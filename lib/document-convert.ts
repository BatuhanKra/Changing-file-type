// Universal client-side document conversion engine.
//
// Every source format is first normalised into Markdown (the intermediate
// representation), which is then compiled into the requested target format.
// This gives a full any-to-any conversion matrix:
//
//   TXT / MD / HTML / DOCX / PDF  →  TXT / MD / HTML / DOCX / PDF / PNG
//
// PDF→PNG renders pages directly; other→PNG goes source→PDF→render.

export type DocFormat = "txt" | "md" | "html" | "docx" | "pdf";
export type TargetFormat = DocFormat | "png";

export const SOURCE_FORMATS: { value: DocFormat; label: string; accept: string }[] = [
  { value: "pdf", label: "PDF", accept: ".pdf" },
  { value: "docx", label: "Word (DOCX)", accept: ".docx" },
  { value: "txt", label: "TXT", accept: ".txt" },
  { value: "md", label: "Markdown", accept: ".md,.markdown" },
  { value: "html", label: "HTML", accept: ".html,.htm" },
];

export const TARGET_FORMATS: { value: TargetFormat; label: string; ext: string }[] = [
  { value: "pdf", label: "PDF", ext: "pdf" },
  { value: "docx", label: "Word (DOCX)", ext: "docx" },
  { value: "txt", label: "TXT", ext: "txt" },
  { value: "md", label: "Markdown", ext: "md" },
  { value: "html", label: "HTML", ext: "html" },
  { value: "png", label: "PNG", ext: "png" },
];

export function detectFormat(fileName: string): DocFormat | null {
  const ext = fileName.toLowerCase().replace(/^.*(\.[^.]+)$/, "$1");
  if (ext === ".txt") return "txt";
  if (ext === ".md" || ext === ".markdown") return "md";
  if (ext === ".html" || ext === ".htm") return "html";
  if (ext === ".docx") return "docx";
  if (ext === ".pdf") return "pdf";
  return null;
}

export type ConvertedFile = { name: string; blob: Blob };

// ---------------------------------------------------------------------------
// PDF text extraction (lines with style/geometry, used to rebuild structure)
// ---------------------------------------------------------------------------

type PdfRun = { text: string; bold: boolean; italic: boolean; fontSize: number };
type PdfLine = {
  runs: PdfRun[];
  fontSize: number;
  align: "left" | "center" | "right";
  gapBefore: number;
};

const HEADING_LEVELS = [
  { ratio: 1.6, level: 1 as const },
  { ratio: 1.35, level: 2 as const },
  { ratio: 1.15, level: 3 as const },
];

async function loadPdfjs() {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  return pdfjs;
}

async function extractPdfLines(file: File): Promise<{
  pages: PdfLine[][];
  bodyFontSize: number;
}> {
  const pdfjs = await loadPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  type Item = {
    str: string;
    x: number;
    y: number;
    width: number;
    bold: boolean;
    italic: boolean;
    fontSize: number;
  };

  const pages: PdfLine[][] = [];
  const allFontSizes: number[] = [];
  let pageWidth = 0;

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    pageWidth = page.getViewport({ scale: 1 }).width;
    // getOperatorList loads the page's fonts into commonObjs, which
    // getTextContent alone does not — needed to resolve real font names.
    await page.getOperatorList().catch(() => undefined);
    const content = await page.getTextContent();

    // textContent's fontName is pdf.js' internal id (e.g. "g_d0_f1"); the real
    // PostScript name (e.g. "LiberationSans-Bold") lives in the loaded font
    // object inside commonObjs.
    const fontNameCache = new Map<string, string>();
    const realFontName = (id: string): string => {
      let cached = fontNameCache.get(id);
      if (cached === undefined) {
        cached = id;
        try {
          const font = page.commonObjs.get(id) as { name?: string } | null;
          if (font?.name) cached = font.name;
        } catch {
          // Font not resolved yet; fall back to the internal id.
        }
        fontNameCache.set(id, cached);
      }
      return cached;
    };

    const items: Item[] = [];
    for (const raw of content.items) {
      if (!("str" in raw) || !raw.str.trim()) continue;
      const transform = raw.transform as number[];
      const fontName = realFontName((raw as { fontName?: string }).fontName ?? "");
      const fontSize = Math.hypot(transform[2], transform[3]) || 12;
      items.push({
        str: raw.str,
        x: transform[4],
        y: Math.round(transform[5]),
        width: (raw as { width?: number }).width ?? 0,
        bold: /bold|black|heavy|semibold/i.test(fontName),
        italic: /italic|oblique/i.test(fontName),
        fontSize,
      });
      allFontSizes.push(fontSize);
    }

    items.sort((a, b) => b.y - a.y || a.x - b.x);
    type RawLine = { items: Item[]; y: number };
    const rawLines: RawLine[] = [];
    let current: Item[] = [];
    let currentY: number | null = null;

    const flushLine = () => {
      if (current.length === 0) return;
      rawLines.push({ items: current, y: currentY! });
      current = [];
    };

    for (const item of items) {
      if (currentY === null || Math.abs(item.y - currentY) <= 2) {
        current.push(item);
        currentY = currentY === null ? item.y : currentY;
      } else {
        flushLine();
        current = [item];
        currentY = item.y;
      }
    }
    flushLine();

    const lines: PdfLine[] = [];
    let prevY: number | null = null;

    for (const { items: lineItems, y } of rawLines) {
      const runs: PdfRun[] = [];
      let prevEnd: number | null = null;
      for (const it of lineItems) {
        // Re-insert the space pdf.js drops when words are separate draw calls.
        const needsSpace = prevEnd !== null && it.x - prevEnd > it.fontSize * 0.15;
        prevEnd = it.x + it.width;
        const last = runs[runs.length - 1];
        if (
          last &&
          last.bold === it.bold &&
          last.italic === it.italic &&
          Math.abs(last.fontSize - it.fontSize) < 0.5
        ) {
          last.text += (needsSpace ? " " : "") + it.str;
        } else {
          runs.push({ text: it.str, bold: it.bold, italic: it.italic, fontSize: it.fontSize });
        }
      }
      for (const run of runs) run.text = run.text.replace(/\s+/g, " ");
      if (!runs.some((r) => r.text.trim())) continue;

      const fontSize = Math.max(...lineItems.map((it) => it.fontSize));
      const minX = Math.min(...lineItems.map((it) => it.x));
      const maxX = Math.max(...lineItems.map((it) => it.x + it.fontSize * it.str.length * 0.5));

      let align: PdfLine["align"] = "left";
      if (pageWidth > 0) {
        const leftGap = minX;
        const rightGap = pageWidth - maxX;
        if (leftGap > pageWidth * 0.2 && rightGap > pageWidth * 0.2) {
          align = "center";
        } else if (rightGap < pageWidth * 0.08 && leftGap > pageWidth * 0.25) {
          align = "right";
        }
      }

      const gapBefore = prevY === null ? 0 : Math.max(0, prevY - y) / fontSize;
      prevY = y;

      lines.push({ runs, fontSize, align, gapBefore });
    }

    pages.push(lines);
  }

  allFontSizes.sort((a, b) => a - b);
  const bodyFontSize = allFontSizes.length
    ? allFontSizes[Math.floor(allFontSizes.length / 2)]
    : 12;

  return { pages, bodyFontSize };
}

function headingLevelFor(fontSize: number, bodyFontSize: number): 1 | 2 | 3 | null {
  const ratio = fontSize / bodyFontSize;
  for (const { ratio: threshold, level } of HEADING_LEVELS) {
    if (ratio >= threshold) return level;
  }
  return null;
}

// ---------------------------------------------------------------------------
// PDF embedded image extraction
// ---------------------------------------------------------------------------

type PdfJsImage = {
  width: number;
  height: number;
  kind?: number; // pdfjs ImageKind: 1=GRAYSCALE_1BPP, 2=RGB_24BPP, 3=RGBA_32BPP
  data?: Uint8Array;
  bitmap?: ImageBitmap;
};

function pdfImageToDataUrl(img: PdfJsImage): string | null {
  const { width, height } = img;
  if (!width || !height || width < 16 || height < 16) return null; // skip decorative specks

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  if (img.bitmap) {
    ctx.drawImage(img.bitmap, 0, 0);
  } else if (img.data) {
    const imageData = ctx.createImageData(width, height);
    const src = img.data;
    const dst = imageData.data;
    if (img.kind === 3) {
      dst.set(src);
    } else if (img.kind === 2) {
      for (let i = 0, j = 0; j < dst.length; i += 3, j += 4) {
        dst[j] = src[i];
        dst[j + 1] = src[i + 1];
        dst[j + 2] = src[i + 2];
        dst[j + 3] = 255;
      }
    } else if (img.kind === 1) {
      // 1 bit per pixel, rows padded to full bytes; set bit = white.
      const rowBytes = Math.ceil(width / 8);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const bit = (src[y * rowBytes + (x >> 3)] >> (7 - (x & 7))) & 1;
          const v = bit ? 255 : 0;
          const j = (y * width + x) * 4;
          dst[j] = dst[j + 1] = dst[j + 2] = v;
          dst[j + 3] = 255;
        }
      }
    } else {
      return null;
    }
    ctx.putImageData(imageData, 0, 0);
  } else {
    return null;
  }

  return canvas.toDataURL("image/png");
}

async function extractPdfImagesByPage(file: File): Promise<string[][]> {
  const pdfjs = await loadPdfjs();
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const pagesImages: string[][] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const dataUrls: string[] = [];
    try {
      const opList = await page.getOperatorList();
      const seen = new Set<string>();
      for (let op = 0; op < opList.fnArray.length; op++) {
        if (opList.fnArray[op] !== pdfjs.OPS.paintImageXObject) continue;
        const name = opList.argsArray[op][0] as string;
        if (seen.has(name)) continue;
        seen.add(name);

        const store = name.startsWith("g_") ? page.commonObjs : page.objs;
        const img = await Promise.race<PdfJsImage | null>([
          new Promise<PdfJsImage>((resolve) => store.get(name, resolve)),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000)),
        ]);
        if (!img) continue;

        const dataUrl = pdfImageToDataUrl(img);
        if (dataUrl) dataUrls.push(dataUrl);
      }
    } catch {
      // Image extraction is best-effort; text conversion continues regardless.
    }
    pagesImages.push(dataUrls);
  }

  return pagesImages;
}

// ---------------------------------------------------------------------------
// Source → Markdown
// ---------------------------------------------------------------------------

async function htmlToMarkdown(html: string): Promise<string> {
  const TurndownService = (await import("turndown")).default;
  const turndown = new TurndownService({
    headingStyle: "atx",
    bulletListMarker: "-",
    codeBlockStyle: "fenced",
  });
  return turndown.turndown(html);
}

async function pdfToMarkdown(file: File): Promise<string> {
  const [{ pages, bodyFontSize }, pagesImages] = await Promise.all([
    extractPdfLines(file),
    extractPdfImagesByPage(file),
  ]);

  const mdPages = pages.map((lines, pageIndex) => {
    const text = lines
      .map((line) => {
        const level = headingLevelFor(line.fontSize, bodyFontSize);
        const text = line.runs
          .map((run) => {
            let t = run.text;
            if (!t.trim()) return t;
            if (run.bold && run.italic) t = `***${t.trim()}***`;
            else if (run.bold && !level) t = `**${t.trim()}**`;
            else if (run.italic) t = `*${t.trim()}*`;
            return t;
          })
          .join(" ")
          .trim();
        if (!text) return "";
        if (level) return `\n${"#".repeat(level)} ${text.replace(/\*+/g, "")}`;
        // PDF bullet glyphs become proper Markdown list items.
        const bullet = /^[•·▪‣◦]\s*(.+)$/.exec(text);
        if (bullet) return `- ${bullet[1]}`;
        // Paragraph break if there was a visible vertical gap.
        return line.gapBefore > 1.5 ? `\n${text}` : text;
      })
      .filter((l) => l !== "")
      .join("\n");

    // Carry the page's embedded images over as standalone image lines.
    const images = (pagesImages[pageIndex] ?? []).map((url) => `\n![](${url})`).join("\n");
    return text + images;
  });

  return mdPages.join("\n\n---\n\n");
}

export async function sourceToMarkdown(file: File, format: DocFormat): Promise<string> {
  if (format === "txt" || format === "md") {
    return file.text();
  }
  if (format === "html") {
    return htmlToMarkdown(await file.text());
  }
  if (format === "docx") {
    const mammoth = await import("mammoth");
    const arrayBuffer = await file.arrayBuffer();
    const { value: html } = await mammoth.convertToHtml({ arrayBuffer });
    return htmlToMarkdown(html);
  }
  // pdf
  return pdfToMarkdown(file);
}

// ---------------------------------------------------------------------------
// Markdown → targets
// ---------------------------------------------------------------------------

type MdBlock =
  | { kind: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { kind: "bullet"; text: string }
  | { kind: "numbered"; text: string }
  | { kind: "paragraph"; text: string }
  | { kind: "image"; src: string }
  | { kind: "blank" };

function parseMarkdownBlocks(md: string): MdBlock[] {
  return md.split(/\r?\n/).map((line): MdBlock => {
    const image = /^!\[[^\]]*\]\(([^)\s]+)\)\s*$/.exec(line.trim());
    if (image) return { kind: "image", src: image[1] };
    const heading = /^(#{1,6})\s+(.*)$/.exec(line);
    if (heading) {
      return {
        kind: "heading",
        level: heading[1].length as 1 | 2 | 3 | 4 | 5 | 6,
        text: heading[2],
      };
    }
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) return { kind: "bullet", text: bullet[1] };
    const numbered = /^\d+\.\s+(.*)$/.exec(line);
    if (numbered) return { kind: "numbered", text: numbered[1] };
    if (!line.trim()) return { kind: "blank" };
    return { kind: "paragraph", text: line };
  });
}

// Decodes a data: URL (or fetches a blob/regular URL) into raw bytes + mime.
async function imageSourceToBytes(
  src: string
): Promise<{ bytes: Uint8Array; mime: string } | null> {
  try {
    const resp = await fetch(src);
    const blob = await resp.blob();
    if (!blob.type.startsWith("image/")) return null;
    return { bytes: new Uint8Array(await blob.arrayBuffer()), mime: blob.type };
  } catch {
    return null;
  }
}

async function imageDimensions(bytes: Uint8Array, mime: string) {
  const bitmap = await createImageBitmap(new Blob([bytes.slice().buffer as ArrayBuffer], { type: mime }));
  const dims = { width: bitmap.width, height: bitmap.height };
  bitmap.close();
  return dims;
}

function stripInlineMarkdown(text: string): string {
  return text
    .replace(/\*\*\*([^*]+)\*\*\*/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");
}

export function markdownToPlainText(md: string): string {
  return parseMarkdownBlocks(md)
    .map((block) => {
      switch (block.kind) {
        case "blank":
        case "image":
          return "";
        case "heading":
          return stripInlineMarkdown(block.text);
        case "bullet":
          return `• ${stripInlineMarkdown(block.text)}`;
        case "numbered":
        case "paragraph":
          return stripInlineMarkdown(block.text);
      }
    })
    .join("\n")
    .replace(/^---$/gm, "")
    .replace(/\n{3,}/g, "\n\n");
}

async function buildHtmlBlob(md: string, title: string): Promise<Blob> {
  const { marked } = await import("marked");
  const body = await marked.parse(md);
  const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
body { max-width: 720px; margin: 2rem auto; padding: 0 1rem; font-family: Georgia, 'Times New Roman', serif; line-height: 1.7; color: #1a1a1a; }
h1, h2, h3, h4 { font-family: -apple-system, 'Segoe UI', Helvetica, Arial, sans-serif; line-height: 1.3; }
code { background: #f4f4f4; padding: 0.15em 0.35em; border-radius: 4px; font-size: 0.9em; }
img { max-width: 100%; height: auto; border-radius: 6px; }
hr { border: none; border-top: 1px solid #ddd; margin: 2.5rem 0; }
</style>
</head>
<body>
${body}
</body>
</html>
`;
  return new Blob([html], { type: "text/html;charset=utf-8" });
}

async function buildDocxBlob(md: string): Promise<Blob> {
  const { Document, Packer, Paragraph, TextRun, ImageRun, HeadingLevel, AlignmentType } =
    await import("docx");

  const HEADING = {
    1: HeadingLevel.HEADING_1,
    2: HeadingLevel.HEADING_2,
    3: HeadingLevel.HEADING_3,
    4: HeadingLevel.HEADING_4,
    5: HeadingLevel.HEADING_5,
    6: HeadingLevel.HEADING_6,
  } as const;

  function inlineRuns(text: string): InstanceType<typeof TextRun>[] {
    const runs: InstanceType<typeof TextRun>[] = [];
    const re = /(\*\*\*([^*]+)\*\*\*|\*\*([^*]+)\*\*|\*([^*]+)\*|`([^`]+)`)/g;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = re.exec(text)) !== null) {
      if (match.index > lastIndex) {
        runs.push(new TextRun(text.slice(lastIndex, match.index)));
      }
      if (match[2] !== undefined) {
        runs.push(new TextRun({ text: match[2], bold: true, italics: true }));
      } else if (match[3] !== undefined) {
        runs.push(new TextRun({ text: match[3], bold: true }));
      } else if (match[4] !== undefined) {
        runs.push(new TextRun({ text: match[4], italics: true }));
      } else if (match[5] !== undefined) {
        runs.push(new TextRun({ text: match[5], font: "Courier New" }));
      }
      lastIndex = re.lastIndex;
    }
    if (lastIndex < text.length) {
      runs.push(new TextRun(text.slice(lastIndex)));
    }
    return runs.length > 0 ? runs : [new TextRun(text)];
  }

  const paragraphs: InstanceType<typeof Paragraph>[] = [];
  for (const block of parseMarkdownBlocks(md)) {
    switch (block.kind) {
      case "heading":
        paragraphs.push(
          new Paragraph({ heading: HEADING[block.level], children: inlineRuns(block.text) })
        );
        break;
      case "bullet":
        paragraphs.push(new Paragraph({ bullet: { level: 0 }, children: inlineRuns(block.text) }));
        break;
      case "numbered":
        paragraphs.push(
          new Paragraph({
            numbering: { reference: "doc-list", level: 0 },
            children: inlineRuns(block.text),
          })
        );
        break;
      case "blank":
        paragraphs.push(new Paragraph({}));
        break;
      case "image": {
        const img = await imageSourceToBytes(block.src);
        if (!img) break;
        try {
          const dims = await imageDimensions(img.bytes, img.mime);
          // Fit within ~600px of usable page width, keep aspect ratio.
          const maxW = 600;
          const scale = dims.width > maxW ? maxW / dims.width : 1;
          paragraphs.push(
            new Paragraph({
              children: [
                new ImageRun({
                  type: img.mime === "image/jpeg" ? "jpg" : "png",
                  data: img.bytes,
                  transformation: {
                    width: Math.round(dims.width * scale),
                    height: Math.round(dims.height * scale),
                  },
                }),
              ],
            })
          );
        } catch {
          // Skip images that fail to decode; text content still matters more.
        }
        break;
      }
      case "paragraph":
        paragraphs.push(new Paragraph({ children: inlineRuns(block.text) }));
        break;
    }
  }

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "doc-list",
          levels: [{ level: 0, format: "decimal", text: "%1.", alignment: AlignmentType.START }],
        },
      ],
    },
    sections: [{ children: paragraphs }],
  });
  return Packer.toBlob(doc);
}

async function buildPdfBlob(md: string): Promise<Blob> {
  const { PDFDocument, rgb } = await import("pdf-lib");
  const fontkit = (await import("@pdf-lib/fontkit")).default;

  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  const [regularBytes, boldBytes] = await Promise.all([
    fetch("/fonts/LiberationSans-Regular.ttf").then((r) => r.arrayBuffer()),
    fetch("/pdfjs/standard_fonts/LiberationSans-Bold.ttf").then((r) => r.arrayBuffer()),
  ]);
  const regular = await doc.embedFont(regularBytes);
  const bold = await doc.embedFont(boldBytes);

  const bodySize = 11;
  const lineGap = 1.5;
  const margin = 60;

  let page = doc.addPage();
  let { width, height } = page.getSize();
  let y = height - margin;

  const ensureRoom = (needed: number) => {
    if (y - needed < margin) {
      page = doc.addPage();
      ({ width, height } = page.getSize());
      y = height - margin;
    }
  };

  // Keeps **bold** markers, strips all other inline markdown.
  const stripExceptBold = (text: string) =>
    text
      .replace(/\*\*\*([^*]+)\*\*\*/g, "**$1**")
      .replace(/(^|[^*])\*([^*]+)\*(?!\*)/g, "$1$2")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1");

  // Draws text with word-wrap, rendering **bold** spans with the bold font.
  const drawRich = (rawText: string, size: number, indent = 0, baseFont = regular) => {
    type Word = { w: string; font: typeof regular };
    const words: Word[] = [];
    const re = /\*\*([^*]+)\*\*/g;
    const text = stripExceptBold(rawText);
    let last = 0;
    let m: RegExpExecArray | null;
    const pushWords = (chunk: string, font: typeof regular) => {
      for (const w of chunk.split(/\s+/)) if (w) words.push({ w, font });
    };
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) pushWords(text.slice(last, m.index), baseFont);
      pushWords(m[1], bold);
      last = re.lastIndex;
    }
    if (last < text.length) pushWords(text.slice(last), baseFont);

    if (words.length === 0) {
      y -= size * lineGap;
      return;
    }

    const maxWidth = width - margin * 2 - indent;
    let line: Word[] = [];
    let lineW = 0;
    const flush = () => {
      if (line.length === 0) return;
      ensureRoom(size);
      let x = margin + indent;
      for (const item of line) {
        page.drawText(item.w, { x, y, size, font: item.font, color: rgb(0.1, 0.1, 0.1) });
        x += item.font.widthOfTextAtSize(item.w + " ", size);
      }
      y -= size * lineGap;
      line = [];
      lineW = 0;
    };
    for (const item of words) {
      const itemW = item.font.widthOfTextAtSize(item.w + " ", size);
      if (lineW + itemW > maxWidth && line.length > 0) flush();
      line.push(item);
      lineW += itemW;
    }
    flush();
  };

  const drawWrapped = (
    text: string,
    font: typeof regular,
    size: number,
    indent = 0
  ) => {
    const maxWidth = width - margin * 2 - indent;
    const words = text.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      y -= size * lineGap;
      return;
    }
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && line) {
        ensureRoom(size);
        page.drawText(line, { x: margin + indent, y, size, font, color: rgb(0.1, 0.1, 0.1) });
        y -= size * lineGap;
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) {
      ensureRoom(size);
      page.drawText(line, { x: margin + indent, y, size, font, color: rgb(0.1, 0.1, 0.1) });
      y -= size * lineGap;
    }
  };

  const HEADING_SIZES: Record<number, number> = { 1: 22, 2: 17, 3: 14, 4: 12, 5: 11, 6: 11 };

  let listNumber = 0;

  for (const block of parseMarkdownBlocks(md)) {
    if (block.kind !== "numbered") listNumber = 0;
    switch (block.kind) {
      case "blank":
        y -= bodySize * 0.8;
        break;
      case "heading": {
        const size = HEADING_SIZES[block.level] ?? 12;
        y -= size * 0.5; // extra space above headings
        drawWrapped(stripInlineMarkdown(block.text), bold, size);
        y -= size * 0.2;
        break;
      }
      case "bullet":
        drawRich(`• ${block.text}`, bodySize, 12);
        break;
      case "numbered":
        listNumber += 1;
        drawRich(`${listNumber}. ${block.text}`, bodySize, 12);
        break;
      case "image": {
        const img = await imageSourceToBytes(block.src);
        if (!img) break;
        try {
          const embedded =
            img.mime === "image/jpeg"
              ? await doc.embedJpg(img.bytes)
              : await doc.embedPng(img.bytes);
          const maxW = width - margin * 2;
          const maxH = height - margin * 2;
          let drawW = embedded.width;
          let drawH = embedded.height;
          const scale = Math.min(maxW / drawW, maxH / drawH, 1);
          drawW *= scale;
          drawH *= scale;
          if (y - drawH < margin) {
            page = doc.addPage();
            ({ width, height } = page.getSize());
            y = height - margin;
          }
          page.drawImage(embedded, { x: margin, y: y - drawH, width: drawW, height: drawH });
          y -= drawH + bodySize;
        } catch {
          // Unsupported image data; skip and keep going.
        }
        break;
      }
      case "paragraph": {
        if (block.text.trim() === "---") {
          y -= bodySize;
          break;
        }
        drawRich(block.text, bodySize);
        break;
      }
    }
  }

  const bytes = await doc.save();
  return new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
}

async function renderPdfToPngs(
  pdfData: ArrayBuffer,
  pageName: (page: number) => string
): Promise<ConvertedFile[]> {
  const pdfjs = await loadPdfjs();
  const pdf = await pdfjs.getDocument({
    data: pdfData,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
  }).promise;

  const results: ConvertedFile[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("CANVAS_ERROR");
    // intent: "print" keeps rendering off requestAnimationFrame, which
    // Chrome throttles to a standstill on hidden tabs.
    await page.render({ canvas, canvasContext: ctx, viewport, intent: "print" }).promise;

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
    if (!blob) throw new Error("CONVERT_FAILED");
    results.push({ name: pageName(i), blob });
  }
  return results;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function convertDocument(
  file: File,
  source: DocFormat,
  target: TargetFormat,
  pageName: (base: string, page: number) => string
): Promise<ConvertedFile[]> {
  const baseName = file.name.replace(/\.[^/.]+$/, "");

  if (target === "png") {
    // PDF renders directly; everything else goes through a PDF first.
    const pdfData =
      source === "pdf"
        ? await file.arrayBuffer()
        : await (await buildPdfBlob(await sourceToMarkdown(file, source))).arrayBuffer();
    return renderPdfToPngs(pdfData, (page) => pageName(baseName, page));
  }

  // Fast paths that don't need the Markdown intermediate.
  if (source === "txt" && target === "txt") {
    return [{ name: `${baseName}.txt`, blob: new Blob([await file.text()], { type: "text/plain;charset=utf-8" }) }];
  }
  if (source === "docx" && target === "txt") {
    const mammoth = await import("mammoth");
    const { value: text } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return [{ name: `${baseName}.txt`, blob: new Blob([text], { type: "text/plain;charset=utf-8" }) }];
  }
  if (source === "html" && target === "html") {
    return [{ name: `${baseName}.html`, blob: new Blob([await file.text()], { type: "text/html;charset=utf-8" }) }];
  }

  const md = await sourceToMarkdown(file, source);

  switch (target) {
    case "txt":
      return [
        {
          name: `${baseName}.txt`,
          blob: new Blob([markdownToPlainText(md)], { type: "text/plain;charset=utf-8" }),
        },
      ];
    case "md":
      return [
        { name: `${baseName}.md`, blob: new Blob([md], { type: "text/markdown;charset=utf-8" }) },
      ];
    case "html":
      return [{ name: `${baseName}.html`, blob: await buildHtmlBlob(md, baseName) }];
    case "docx":
      return [{ name: `${baseName}.docx`, blob: await buildDocxBlob(md) }];
    case "pdf":
      return [{ name: `${baseName}.pdf`, blob: await buildPdfBlob(md) }];
  }
}
