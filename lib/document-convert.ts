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
    const content = await page.getTextContent();

    const items: Item[] = [];
    for (const raw of content.items) {
      if (!("str" in raw) || !raw.str.trim()) continue;
      const transform = raw.transform as number[];
      const fontName: string = (raw as { fontName?: string }).fontName ?? "";
      const fontSize = Math.hypot(transform[2], transform[3]) || 12;
      items.push({
        str: raw.str,
        x: transform[4],
        y: Math.round(transform[5]),
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
      for (const it of lineItems) {
        const last = runs[runs.length - 1];
        if (
          last &&
          last.bold === it.bold &&
          last.italic === it.italic &&
          Math.abs(last.fontSize - it.fontSize) < 0.5
        ) {
          last.text += it.str;
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
// Source → Markdown
// ---------------------------------------------------------------------------

async function htmlToMarkdown(html: string): Promise<string> {
  const TurndownService = (await import("turndown")).default;
  const turndown = new TurndownService({ headingStyle: "atx" });
  return turndown.turndown(html);
}

async function pdfToMarkdown(file: File): Promise<string> {
  const { pages, bodyFontSize } = await extractPdfLines(file);
  const mdPages = pages.map((lines) =>
    lines
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
        if (level) return `${"#".repeat(level)} ${text.replace(/\*+/g, "")}`;
        // Paragraph break if there was a visible vertical gap.
        return line.gapBefore > 1.5 ? `\n${text}` : text;
      })
      .filter((l) => l !== "")
      .join("\n")
  );
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
  | { kind: "blank" };

function parseMarkdownBlocks(md: string): MdBlock[] {
  return md.split(/\r?\n/).map((line): MdBlock => {
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
  const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = await import(
    "docx"
  );

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

  const paragraphs = parseMarkdownBlocks(md).map((block) => {
    switch (block.kind) {
      case "heading":
        return new Paragraph({ heading: HEADING[block.level], children: inlineRuns(block.text) });
      case "bullet":
        return new Paragraph({ bullet: { level: 0 }, children: inlineRuns(block.text) });
      case "numbered":
        return new Paragraph({
          numbering: { reference: "doc-list", level: 0 },
          children: inlineRuns(block.text),
        });
      case "blank":
        return new Paragraph({});
      case "paragraph":
        return new Paragraph({ children: inlineRuns(block.text) });
    }
  });

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

  for (const block of parseMarkdownBlocks(md)) {
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
        drawWrapped(`• ${stripInlineMarkdown(block.text)}`, regular, bodySize, 12);
        break;
      case "numbered":
        drawWrapped(stripInlineMarkdown(block.text), regular, bodySize, 12);
        break;
      case "paragraph": {
        if (block.text.trim() === "---") {
          y -= bodySize;
          break;
        }
        drawWrapped(stripInlineMarkdown(block.text), regular, bodySize);
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
