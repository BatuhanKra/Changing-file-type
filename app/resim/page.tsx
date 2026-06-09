"use client";

import { useState } from "react";
import Link from "next/link";
import { limitsFor } from "@/lib/premium";
import { useRealPremium } from "@/lib/useRealPremium";
import { useLanguage } from "@/lib/i18n";

const FORMATS = [
  { value: "image/jpeg", label: "JPG", ext: "jpg" },
  { value: "image/png", label: "PNG", ext: "png" },
  { value: "image/webp", label: "WEBP", ext: "webp" },
  { value: "image/bmp", label: "BMP", ext: "bmp" },
  { value: "image/x-icon", label: "ICO (favicon)", ext: "ico" },
  { value: "application/pdf", label: "PDF", ext: "pdf" },
];

const QUALITY_FORMATS = new Set(["image/jpeg", "image/webp"]);

type Result = { name: string; url: string };

async function imageFileToCanvas(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS_ERROR");
  ctx.drawImage(bitmap, 0, 0);
  return canvas;
}

// 24-bit uncompressed BMP from canvas pixels (bottom-up rows, BGR, padded to 4 bytes).
function canvasToBmpBlob(canvas: HTMLCanvasElement): Blob {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("CANVAS_ERROR");
  const { width, height } = canvas;
  const pixels = ctx.getImageData(0, 0, width, height).data;

  const rowSize = Math.ceil((width * 3) / 4) * 4;
  const pixelDataSize = rowSize * height;
  const fileSize = 54 + pixelDataSize;
  const buffer = new ArrayBuffer(fileSize);
  const view = new DataView(buffer);

  // BITMAPFILEHEADER
  view.setUint8(0, 0x42); // 'B'
  view.setUint8(1, 0x4d); // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true); // pixel data offset
  // BITMAPINFOHEADER
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 24, true); // bpp
  view.setUint32(34, pixelDataSize, true);
  view.setInt32(38, 2835, true); // 72 DPI
  view.setInt32(42, 2835, true);

  const out = new Uint8Array(buffer);
  for (let yRow = 0; yRow < height; yRow++) {
    const srcRow = height - 1 - yRow; // BMP stores rows bottom-up
    let offset = 54 + yRow * rowSize;
    for (let x = 0; x < width; x++) {
      const i = (srcRow * width + x) * 4;
      const alpha = pixels[i + 3] / 255;
      // Composite transparency over white, since 24-bit BMP has no alpha.
      out[offset++] = Math.round(pixels[i + 2] * alpha + 255 * (1 - alpha)); // B
      out[offset++] = Math.round(pixels[i + 1] * alpha + 255 * (1 - alpha)); // G
      out[offset++] = Math.round(pixels[i] * alpha + 255 * (1 - alpha)); // R
    }
  }
  return new Blob([buffer], { type: "image/bmp" });
}

// ICO container with embedded PNG (supported by all modern Windows/browsers).
// The image is downscaled to fit 256×256, which is the ICO maximum.
async function canvasToIcoBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  const maxDim = Math.max(canvas.width, canvas.height);
  let icoCanvas = canvas;
  if (maxDim > 256) {
    const scale = 256 / maxDim;
    icoCanvas = document.createElement("canvas");
    icoCanvas.width = Math.max(1, Math.round(canvas.width * scale));
    icoCanvas.height = Math.max(1, Math.round(canvas.height * scale));
    const ctx = icoCanvas.getContext("2d");
    if (!ctx) throw new Error("CANVAS_ERROR");
    ctx.drawImage(canvas, 0, 0, icoCanvas.width, icoCanvas.height);
  }

  const pngBlob: Blob | null = await new Promise((resolve) =>
    icoCanvas.toBlob(resolve, "image/png")
  );
  if (!pngBlob) throw new Error("CONVERT_FAILED");
  const png = new Uint8Array(await pngBlob.arrayBuffer());

  const header = new ArrayBuffer(22);
  const view = new DataView(header);
  view.setUint16(0, 0, true); // reserved
  view.setUint16(2, 1, true); // type: icon
  view.setUint16(4, 1, true); // image count
  view.setUint8(6, icoCanvas.width >= 256 ? 0 : icoCanvas.width); // 0 means 256
  view.setUint8(7, icoCanvas.height >= 256 ? 0 : icoCanvas.height);
  view.setUint8(9, 0); // reserved
  view.setUint16(10, 1, true); // color planes
  view.setUint16(12, 32, true); // bpp
  view.setUint32(14, png.length, true);
  view.setUint32(18, 22, true); // data offset

  return new Blob([header, png], { type: "image/x-icon" });
}

async function convertToImage(file: File, mimeType: string, quality: number): Promise<Blob> {
  const canvas = await imageFileToCanvas(file);
  if (mimeType === "image/bmp") return canvasToBmpBlob(canvas);
  if (mimeType === "image/x-icon") return canvasToIcoBlob(canvas);
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, mimeType, quality)
  );
  if (!blob) throw new Error("CONVERT_FAILED");
  return blob;
}

async function convertToPdf(file: File): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  const canvas = await imageFileToCanvas(file);
  const pngBlob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!pngBlob) throw new Error("CONVERT_FAILED");

  const doc = await PDFDocument.create();
  const pngBytes = await pngBlob.arrayBuffer();
  const image = await doc.embedPng(pngBytes);
  const page = doc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  const bytes = await doc.save();
  return new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
}

async function combineImagesToPdf(files: File[]): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.create();

  for (const file of files) {
    const canvas = await imageFileToCanvas(file);
    const pngBlob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!pngBlob) throw new Error("CONVERT_FAILED");

    const pngBytes = await pngBlob.arrayBuffer();
    const image = await doc.embedPng(pngBytes);
    const page = doc.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }

  const bytes = await doc.save();
  return new Blob([bytes.slice().buffer as ArrayBuffer], { type: "application/pdf" });
}

export default function ImageConverter() {
  const { premium } = useRealPremium();
  const limits = limitsFor(premium);
  const { t } = useLanguage();

  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState(FORMATS[0].value);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [combineIntoPdf, setCombineIntoPdf] = useState(false);
  const [quality, setQuality] = useState(92);
  const [dragOver, setDragOver] = useState(false);

  function processFiles(selected: File[]) {
    setResults([]);
    setError(null);

    if (selected.length === 0) {
      setFiles([]);
      return;
    }

    if (selected.length > limits.maxFiles) {
      setFiles([]);
      setError(
        premium
          ? t("image.errFileCountPremium", { limit: limits.maxFiles })
          : t("image.errFileCountFree")
      );
      return;
    }

    const tooLarge = selected.find((f) => f.size > limits.maxSizeMb * 1024 * 1024);
    if (tooLarge) {
      setFiles([]);
      setError(
        t("image.errTooLarge", {
          name: tooLarge.name,
          limit: limits.maxSizeMb,
          extra: premium ? "" : t("image.errTooLargeExtra"),
        })
      );
      return;
    }

    setFiles(selected);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    processFiles(Array.from(e.target.files ?? []));
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    processFiles(Array.from(e.dataTransfer.files ?? []).filter((f) => f.type.startsWith("image/")));
  }

  async function convert() {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    setResults([]);

    const format = FORMATS.find((f) => f.value === targetFormat)!;
    const newResults: Result[] = [];
    const shouldCombine =
      targetFormat === "application/pdf" && combineIntoPdf && premium && files.length > 1;

    try {
      if (shouldCombine) {
        setProgress({ done: 0, total: 1 });
        const blob = await combineImagesToPdf(files);
        newResults.push({
          name: t("image.combinedFileName"),
          url: URL.createObjectURL(blob),
        });
        setProgress({ done: 1, total: 1 });
      } else {
        setProgress({ done: 0, total: files.length });
        for (let i = 0; i < files.length; i++) {
          setProgress({ done: i, total: files.length });
          const file = files[i];
          const blob =
            targetFormat === "application/pdf"
              ? await convertToPdf(file)
              : await convertToImage(file, targetFormat, quality / 100);
          const baseName = file.name.replace(/\.[^/.]+$/, "");
          newResults.push({
            name: `${baseName}.${format.ext}`,
            url: URL.createObjectURL(blob),
          });
        }
      }
      setResults(newResults);
    } catch (err) {
      if (err instanceof Error && err.message === "CANVAS_ERROR") {
        setError(t("image.errCanvas"));
      } else if (err instanceof Error && err.message === "CONVERT_FAILED") {
        setError(t("image.errConvertFailed"));
      } else {
        setError(err instanceof Error ? err.message : t("image.errUnknown"));
      }
    } finally {
      setProgress(null);
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-background">
      <main className="flex w-full max-w-xl flex-col gap-6 py-12 px-6">
        <Link href="/" className="text-sm text-foreground/50 transition-colors hover:text-accent">
          {t("back.home")}
        </Link>

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-2xl">
            🖼️
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("image.title")}
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
              ? t("image.planPremium", { files: limits.maxFiles, limit: limits.maxSizeMb })
              : t("image.planFree", { limit: limits.maxSizeMb })}
          </p>

          <label
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${
              dragOver
                ? "border-accent bg-accent-soft"
                : "border-card-border bg-background/40 hover:border-accent/50"
            }`}
          >
            <span className="text-2xl">📤</span>
            <span className="text-sm font-medium text-foreground">
              {files.length > 0 ? t("image.selectedCount", { count: files.length }) : t("image.selectFile")}
            </span>
            <span className="text-xs text-foreground/50">
              {premium ? t("image.dropMulti") : t("image.dropSingle")}
            </span>
            <span className="text-xs text-foreground/40">{t("common.dragHint")}</span>
            <input
              type="file"
              accept="image/*"
              multiple={premium}
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {files.length > 0 && (
            <ul className="flex flex-col gap-1 text-sm text-foreground/60">
              {files.map((f) => (
                <li key={f.name} className="flex items-center justify-between rounded-lg bg-background/60 px-3 py-1.5">
                  <span className="truncate">{f.name}</span>
                  <span className="shrink-0 text-foreground/40">{(f.size / (1024 * 1024)).toFixed(2)} MB</span>
                </li>
              ))}
            </ul>
          )}

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground/70">
              {t("image.targetFormat")}
            </label>
            <select
              value={targetFormat}
              onChange={(e) => setTargetFormat(e.target.value)}
              className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground"
            >
              {FORMATS.map((f) => (
                <option key={f.value} value={f.value}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {QUALITY_FORMATS.has(targetFormat) && (
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-foreground/70">
                {t("image.quality")}
              </label>
              <input
                type="range"
                min={10}
                max={100}
                value={quality}
                onChange={(e) => setQuality(parseInt(e.target.value, 10))}
                className="h-2 flex-1 cursor-pointer accent-accent"
              />
              <span className="w-12 text-right text-sm tabular-nums text-foreground/70">
                %{quality}
              </span>
            </div>
          )}

          {targetFormat === "application/pdf" && files.length > 1 && (
            <label
              className={`flex items-center gap-2 text-sm ${
                premium ? "cursor-pointer text-foreground/70" : "cursor-not-allowed text-foreground/40"
              }`}
            >
              <input
                type="checkbox"
                checked={combineIntoPdf}
                disabled={!premium}
                onChange={(e) => setCombineIntoPdf(e.target.checked)}
                className="h-4 w-4 rounded border-card-border accent-accent"
              />
              {t("image.combineIntoPdf")}
              {!premium && (
                <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  {t("nav.premiumBadge")}
                </span>
              )}
            </label>
          )}

          <button
            onClick={convert}
            disabled={files.length === 0 || busy}
            className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-white shadow-sm shadow-accent/30 transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {progress
              ? t("image.progress", { done: progress.done, total: progress.total })
              : t("image.convert")}
          </button>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {results.length > 0 && (
            <div className="flex flex-col gap-2">
              {results.length > 1 && (
                <button
                  onClick={async () => {
                    const JSZip = (await import("jszip")).default;
                    const zip = new JSZip();
                    for (const r of results) {
                      const resp = await fetch(r.url);
                      const blob = await resp.blob();
                      zip.file(r.name, blob);
                    }
                    const zipBlob = await zip.generateAsync({ type: "blob" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(zipBlob);
                    a.download = "donusturuldu.zip";
                    a.click();
                  }}
                  className="rounded-full bg-foreground/10 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/15"
                >
                  {t("image.downloadAll")}
                </button>
              )}
              {results.map((r) => (
                <a
                  key={r.name}
                  href={r.url}
                  download={r.name}
                  className="flex items-center justify-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-5 py-3 text-center text-sm font-medium text-accent transition-colors hover:bg-accent/15"
                >
                  {t("image.download", { name: r.name })}
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
