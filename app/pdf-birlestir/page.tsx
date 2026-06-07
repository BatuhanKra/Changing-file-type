"use client";

import { useState } from "react";
import Link from "next/link";
import { limitsFor } from "@/lib/premium";
import { useRealPremium } from "@/lib/useRealPremium";
import { useLanguage } from "@/lib/i18n";

type Result = { name: string; url: string };

async function mergePdfs(files: File[]): Promise<Blob> {
  const { PDFDocument } = await import("pdf-lib");
  const merged = await PDFDocument.create();

  for (const file of files) {
    const bytes = await file.arrayBuffer();
    let doc;
    try {
      doc = await PDFDocument.load(bytes);
    } catch {
      throw new Error("INVALID_PDF");
    }
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }

  const out = await merged.save();
  return new Blob([out.slice().buffer as ArrayBuffer], { type: "application/pdf" });
}

export default function PdfMerger() {
  const { premium } = useRealPremium();
  const limits = limitsFor(premium);
  const { t } = useLanguage();
  const maxMergeFiles = premium ? limits.maxFiles : 2;

  const [files, setFiles] = useState<File[]>([]);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  function processFiles(selected: File[]) {
    setResult(null);
    setError(null);

    if (selected.length === 0) {
      setFiles([]);
      return;
    }

    if (selected.length > maxMergeFiles) {
      setFiles([]);
      setError(
        premium
          ? t("merge.errFileCountPremium", { limit: maxMergeFiles })
          : t("merge.errFileCountFree", { limit: maxMergeFiles })
      );
      return;
    }

    const tooLarge = selected.find((f) => f.size > limits.maxSizeMb * 1024 * 1024);
    if (tooLarge) {
      setFiles([]);
      setError(
        t("merge.errTooLarge", {
          name: tooLarge.name,
          limit: limits.maxSizeMb,
          extra: premium ? "" : t("merge.errTooLargeExtra"),
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
    processFiles(
      Array.from(e.dataTransfer.files ?? []).filter((f) => f.type === "application/pdf")
    );
  }

  function moveFile(index: number, dir: -1 | 1) {
    setFiles((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function removeFile(index: number) {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }

  async function convert() {
    if (files.length < 2) return;
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const blob = await mergePdfs(files);
      setResult({ name: t("merge.resultFileName"), url: URL.createObjectURL(blob) });
    } catch (err) {
      if (err instanceof Error && err.message === "INVALID_PDF") {
        setError(t("merge.errInvalidPdf"));
      } else {
        setError(err instanceof Error ? err.message : t("merge.errUnknown"));
      }
    } finally {
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
            🧩
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("merge.title")}
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
              ? t("merge.planPremium", { files: maxMergeFiles, limit: limits.maxSizeMb })
              : t("merge.planFree", { files: maxMergeFiles, limit: limits.maxSizeMb })}
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
              {files.length > 0
                ? t("merge.selectedCount", { count: files.length })
                : t("merge.selectFiles")}
            </span>
            <span className="text-xs text-foreground/50">{t("merge.dropHint")}</span>
            <span className="text-xs text-foreground/40">{t("common.dragHint")}</span>
            <input
              type="file"
              accept="application/pdf"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          {files.length > 0 && (
            <ul className="flex flex-col gap-1.5 text-sm text-foreground/60">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center justify-between gap-2 rounded-lg bg-background/60 px-3 py-1.5"
                >
                  <span className="truncate">
                    {i + 1}. {f.name}
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => moveFile(i, -1)}
                      disabled={i === 0}
                      className="rounded-md px-1.5 py-0.5 text-foreground/50 transition-colors hover:bg-card hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={t("merge.moveUp")}
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      onClick={() => moveFile(i, 1)}
                      disabled={i === files.length - 1}
                      className="rounded-md px-1.5 py-0.5 text-foreground/50 transition-colors hover:bg-card hover:text-foreground disabled:cursor-not-allowed disabled:opacity-30"
                      aria-label={t("merge.moveDown")}
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="rounded-md px-1.5 py-0.5 text-foreground/50 transition-colors hover:bg-card hover:text-red-500"
                      aria-label={t("merge.remove")}
                    >
                      ✕
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}

          <button
            onClick={convert}
            disabled={files.length < 2 || busy}
            className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-white shadow-sm shadow-accent/30 transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? t("merge.merging") : t("merge.merge")}
          </button>

          {files.length === 1 && (
            <p className="text-xs text-foreground/50">{t("merge.needTwo")}</p>
          )}

          {error && (
            <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}

          {result && (
            <a
              href={result.url}
              download={result.name}
              className="flex items-center justify-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-5 py-3 text-center text-sm font-medium text-accent transition-colors hover:bg-accent/15"
            >
              {t("merge.download", { name: result.name })}
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
