"use client";

import { useState } from "react";
import Link from "next/link";
import { usePremium, limitsFor } from "@/lib/premium";

const FORMATS = [
  { value: "image/jpeg", label: "JPG", ext: "jpg" },
  { value: "image/png", label: "PNG", ext: "png" },
  { value: "image/webp", label: "WEBP", ext: "webp" },
  { value: "application/pdf", label: "PDF", ext: "pdf" },
];

type Result = { name: string; url: string };

async function imageFileToCanvas(file: File): Promise<HTMLCanvasElement> {
  const bitmap = await createImageBitmap(file);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas oluşturulamadı");
  ctx.drawImage(bitmap, 0, 0);
  return canvas;
}

async function convertToImage(file: File, mimeType: string): Promise<Blob> {
  const canvas = await imageFileToCanvas(file);
  const blob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, mimeType, 0.92)
  );
  if (!blob) throw new Error("Dönüşüm başarısız oldu");
  return blob;
}

async function convertToPdf(file: File): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  const canvas = await imageFileToCanvas(file);
  const pngBlob: Blob | null = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!pngBlob) throw new Error("Dönüşüm başarısız oldu");

  const doc = await PDFDocument.create();
  const pngBytes = await pngBlob.arrayBuffer();
  const image = await doc.embedPng(pngBytes);
  const page = doc.addPage([image.width, image.height]);
  page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  const bytes = await doc.save();
  return new Blob([bytes], { type: "application/pdf" });
}

export default function ImageConverter() {
  const { premium } = usePremium();
  const limits = limitsFor(premium);

  const [files, setFiles] = useState<File[]>([]);
  const [targetFormat, setTargetFormat] = useState(FORMATS[0].value);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(e.target.files ?? []);
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
          ? `Premium planda aynı anda en fazla ${limits.maxFiles} dosya yükleyebilirsiniz.`
          : `Ücretsiz planda tek seferde yalnızca 1 dosya yükleyebilirsiniz. Daha fazlası için Premium'a geçin.`
      );
      return;
    }

    const tooLarge = selected.find((f) => f.size > limits.maxSizeMb * 1024 * 1024);
    if (tooLarge) {
      setFiles([]);
      setError(
        `"${tooLarge.name}" dosyası ${limits.maxSizeMb} MB sınırını aşıyor${
          premium ? "" : " (Premium'da sınır 200 MB'a çıkar)"
        }.`
      );
      return;
    }

    setFiles(selected);
  }

  async function convert() {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    setResults([]);

    const format = FORMATS.find((f) => f.value === targetFormat)!;
    const newResults: Result[] = [];

    try {
      for (const file of files) {
        const blob =
          targetFormat === "application/pdf"
            ? await convertToPdf(file)
            : await convertToImage(file, targetFormat);
        const baseName = file.name.replace(/\.[^/.]+$/, "");
        newResults.push({
          name: `${baseName}.${format.ext}`,
          url: URL.createObjectURL(blob),
        });
      }
      setResults(newResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Bilinmeyen bir hata oluştu");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col flex-1 items-center bg-background">
      <main className="flex w-full max-w-xl flex-col gap-6 py-12 px-6">
        <Link href="/" className="text-sm text-foreground/50 transition-colors hover:text-accent">
          ← Ana sayfa
        </Link>

        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-2xl">
            🖼️
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Resim Dönüştürücü
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
              ? `✦ Premium plan: aynı anda ${limits.maxFiles} dosyaya kadar, dosya başına ${limits.maxSizeMb} MB.`
              : `Ücretsiz plan: tek seferde 1 dosya, dosya başına ${limits.maxSizeMb} MB. Daha fazlası için sağ üstten Premium'a geçebilirsiniz.`}
          </p>

          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-card-border bg-background/40 px-4 py-8 text-center transition-colors hover:border-accent/50">
            <span className="text-2xl">📤</span>
            <span className="text-sm font-medium text-foreground">
              {files.length > 0 ? `${files.length} dosya seçildi` : "Dosya seçmek için tıklayın"}
            </span>
            <span className="text-xs text-foreground/50">
              {premium ? "Birden fazla dosya seçebilirsiniz" : "JPG, PNG veya WEBP"}
            </span>
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
              Hedef format
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

          <button
            onClick={convert}
            disabled={files.length === 0 || busy}
            className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-white shadow-sm shadow-accent/30 transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Dönüştürülüyor…" : "Dönüştür"}
          </button>

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {results.length > 0 && (
            <div className="flex flex-col gap-2">
              {results.map((r) => (
                <a
                  key={r.name}
                  href={r.url}
                  download={r.name}
                  className="flex items-center justify-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-5 py-3 text-center text-sm font-medium text-accent transition-colors hover:bg-accent/15"
                >
                  ⬇ {r.name} dosyasını indir
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
