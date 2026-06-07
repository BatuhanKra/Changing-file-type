"use client";

import { useState } from "react";
import Link from "next/link";
import { limitsFor } from "@/lib/premium";
import { useRealPremium } from "@/lib/useRealPremium";
import { useLanguage } from "@/lib/i18n";

type Direction =
  | "docx-to-txt"
  | "txt-to-docx"
  | "pdf-to-txt"
  | "txt-to-pdf"
  | "pdf-to-md"
  | "pdf-to-docx";

const DIRECTIONS: { value: Direction; label: string; accept: string }[] = [
  { value: "docx-to-txt", label: "DOCX → TXT", accept: ".docx" },
  { value: "txt-to-docx", label: "TXT → DOCX", accept: ".txt" },
  { value: "pdf-to-txt", label: "PDF → TXT", accept: ".pdf" },
  { value: "txt-to-pdf", label: "TXT → PDF", accept: ".txt" },
  { value: "pdf-to-md", label: "PDF → Markdown", accept: ".pdf" },
  { value: "pdf-to-docx", label: "PDF → Word (DOCX)", accept: ".pdf" },
];

type PdfRun = { text: string; bold: boolean; italic: boolean; fontSize: number };
type PdfLine = {
  runs: PdfRun[];
  fontSize: number;
  align: "left" | "center" | "right";
  gapBefore: number; // vertical whitespace above this line, in font-size units
};

const HEADING_LEVELS = [
  { ratio: 1.6, level: 1 as const },
  { ratio: 1.35, level: 2 as const },
  { ratio: 1.15, level: 3 as const },
];

// Groups PDF text items into lines using their vertical position, splits
// each line into runs that share bold/italic/size (from font-name heuristics
// and the glyph transform matrix), and records enough geometry to infer
// headings, alignment, and paragraph spacing when rebuilding the document.
async function extractPdfLines(file: File): Promise<{
  pages: PdfLine[][];
  bodyFontSize: number;
}> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

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

    // Group items sharing (roughly) the same baseline into one line.
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

    // Convert raw lines into structured lines with runs, alignment and gaps.
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
      // Collapse internal whitespace but keep run boundaries meaningful.
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

async function extractPdfPageTexts(file: File): Promise<string[]> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

  const pageTexts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    pageTexts.push(pageText);
  }
  return pageTexts;
}

export default function DocumentConverter() {
  const { premium } = useRealPremium();
  const limits = limitsFor(premium);
  const { t } = useLanguage();

  const [direction, setDirection] = useState<Direction>("docx-to-txt");
  const [file, setFile] = useState<File | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);
  const [resultName, setResultName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0] ?? null;
    setResultUrl(null);
    setError(null);

    if (selected && selected.size > limits.maxSizeMb * 1024 * 1024) {
      setFile(null);
      setError(
        `"${selected.name}" dosyası ${limits.maxSizeMb} MB sınırını aşıyor${
          premium ? "" : " (Premium'da sınır 200 MB'a çıkar)"
        }.`
      );
      return;
    }

    setFile(selected);
  }

  async function convert() {
    if (!file) return;
    setBusy(true);
    setError(null);
    setResultUrl(null);

    try {
      const baseName = file.name.replace(/\.[^/.]+$/, "");

      if (direction === "docx-to-txt") {
        const mammoth = await import("mammoth");
        const arrayBuffer = await file.arrayBuffer();
        const { value: text } = await mammoth.extractRawText({ arrayBuffer });
        const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
        setResultName(`${baseName}.txt`);
        setResultUrl(URL.createObjectURL(blob));
      } else if (direction === "txt-to-docx") {
        const { Document, Packer, Paragraph } = await import("docx");
        const text = await file.text();
        const doc = new Document({
          sections: [
            {
              children: text
                .split(/\r?\n/)
                .map((line) => new Paragraph(line)),
            },
          ],
        });
        const blob = await Packer.toBlob(doc);
        setResultName(`${baseName}.docx`);
        setResultUrl(URL.createObjectURL(blob));
      } else if (direction === "pdf-to-txt") {
        const pageTexts = await extractPdfPageTexts(file);
        const blob = new Blob([pageTexts.join("\n\n")], {
          type: "text/plain;charset=utf-8",
        });
        setResultName(`${baseName}.txt`);
        setResultUrl(URL.createObjectURL(blob));
      } else if (direction === "pdf-to-md") {
        const pageTexts = await extractPdfPageTexts(file);
        const markdown = pageTexts
          .map((pageText, i) => `## Sayfa ${i + 1}\n\n${pageText.trim()}`)
          .join("\n\n");
        const blob = new Blob([markdown], {
          type: "text/markdown;charset=utf-8",
        });
        setResultName(`${baseName}.md`);
        setResultUrl(URL.createObjectURL(blob));
      } else if (direction === "pdf-to-docx") {
        const { Document, Packer, Paragraph, TextRun, PageBreak, AlignmentType, HeadingLevel } =
          await import("docx");
        const { pages, bodyFontSize } = await extractPdfLines(file);

        const ALIGNMENT = {
          left: AlignmentType.LEFT,
          center: AlignmentType.CENTER,
          right: AlignmentType.RIGHT,
        };
        const HEADING = {
          1: HeadingLevel.HEADING_1,
          2: HeadingLevel.HEADING_2,
          3: HeadingLevel.HEADING_3,
        };

        const children = pages.flatMap((lines, pageIndex) => {
          const paragraphs = lines.map((line) => {
            const level = headingLevelFor(line.fontSize, bodyFontSize);
            return new Paragraph({
              heading: level ? HEADING[level] : undefined,
              alignment: ALIGNMENT[line.align],
              spacing: {
                before: Math.round(Math.min(line.gapBefore, 3) * 120),
              },
              children: line.runs
                .filter((run) => run.text.trim().length > 0)
                .map(
                  (run) =>
                    new TextRun({
                      text: run.text,
                      bold: level ? true : run.bold,
                      italics: run.italic,
                      size: Math.round(run.fontSize * 2),
                    })
                ),
            });
          });
          if (pageIndex < pages.length - 1) {
            paragraphs.push(new Paragraph({ children: [new PageBreak()] }));
          }
          return paragraphs;
        });

        const doc = new Document({ sections: [{ children }] });
        const blob = await Packer.toBlob(doc);
        setResultName(`${baseName}.docx`);
        setResultUrl(URL.createObjectURL(blob));
      } else {
        const { PDFDocument, rgb } = await import("pdf-lib");
        const fontkit = (await import("@pdf-lib/fontkit")).default;
        const text = await file.text();
        const doc = await PDFDocument.create();
        doc.registerFontkit(fontkit);
        const fontBytes = await fetch("/fonts/LiberationSans-Regular.ttf").then((r) =>
          r.arrayBuffer()
        );
        const font = await doc.embedFont(fontBytes);
        const fontSize = 12;
        const lineHeight = fontSize * 1.4;
        const margin = 50;

        let page = doc.addPage();
        let { width, height } = page.getSize();
        let y = height - margin;

        for (const line of text.split(/\r?\n/)) {
          if (y < margin) {
            page = doc.addPage();
            ({ width, height } = page.getSize());
            y = height - margin;
          }
          page.drawText(line, {
            x: margin,
            y,
            size: fontSize,
            font,
            color: rgb(0, 0, 0),
            maxWidth: width - margin * 2,
          });
          y -= lineHeight;
        }

        const bytes = await doc.save();
        const blob = new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
        setResultName(`${baseName}.pdf`);
        setResultUrl(URL.createObjectURL(blob));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  const accept = DIRECTIONS.find((d) => d.value === direction)!.accept;

  return (
    <div className="flex flex-col flex-1 items-center bg-background">
      <main className="flex w-full max-w-xl flex-col gap-6 py-12 px-6">
        <Link href="/" className="text-sm text-foreground/50 transition-colors hover:text-accent">
          {t("back.home")}
        </Link>

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-2xl">
            📄
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("doc.title")}
          </h1>
        </div>

        <div className="flex flex-col gap-5 rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <p
            className={
              premium
                ? "rounded-lg bg-amber-400/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400"
                : "rounded-lg bg-accent-soft px-3 py-2 text-sm text-foreground/70"
            }
          >
            {premium
              ? `✦ Premium plan: dosya başına ${limits.maxSizeMb} MB sınırı.`
              : `Ücretsiz plan: dosya başına ${limits.maxSizeMb} MB sınırı. Daha fazlası için sağ üstten Premium'a geçebilirsiniz.`}
          </p>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground/70">{t("doc.direction")}</label>
            <select
              value={direction}
              onChange={(e) => {
                setDirection(e.target.value as Direction);
                setFile(null);
                setResultUrl(null);
                setError(null);
              }}
              className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {DIRECTIONS.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-card-border bg-background/40 px-4 py-8 text-center transition-colors hover:border-accent/50">
            <span className="text-2xl">📤</span>
            <span className="text-sm font-medium text-foreground">
              {file ? file.name : t("doc.dropFile")}
            </span>
            <span className="text-xs text-foreground/50">{accept.toUpperCase()} dosyası</span>
            <input
              key={direction}
              type="file"
              accept={accept}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            onClick={convert}
            disabled={!file || busy}
            className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-white shadow-sm shadow-accent/30 transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Dönüştürülüyor…" : "Dönüştür"}
          </button>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {resultUrl && (
            <a
              href={resultUrl}
              download={resultName}
              className="flex items-center justify-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-5 py-3 text-center text-sm font-medium text-accent transition-colors hover:bg-accent/15"
            >
              ⬇ {resultName} dosyasını indir
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
