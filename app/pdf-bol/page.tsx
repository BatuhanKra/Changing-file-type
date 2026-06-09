"use client";

import { useState } from "react";
import Link from "next/link";
import { limitsFor } from "@/lib/premium";
import { useRealPremium } from "@/lib/useRealPremium";
import { useLanguage } from "@/lib/i18n";

type Result = { name: string; url: string };
type Mode = "all" | "range";

// Parses "1-3, 5, 7-9" into zero-based page indices, validated against pageCount.
function parsePageRanges(input: string, pageCount: number): number[] | null {
  const indices: number[] = [];
  const seen = new Set<number>();
  for (const part of input.split(",")) {
    const piece = part.trim();
    if (!piece) continue;
    const range = /^(\d+)\s*-\s*(\d+)$/.exec(piece);
    const single = /^(\d+)$/.exec(piece);
    if (range) {
      const from = parseInt(range[1], 10);
      const to = parseInt(range[2], 10);
      if (from < 1 || to > pageCount || from > to) return null;
      for (let p = from; p <= to; p++) {
        if (!seen.has(p - 1)) {
          seen.add(p - 1);
          indices.push(p - 1);
        }
      }
    } else if (single) {
      const p = parseInt(single[1], 10);
      if (p < 1 || p > pageCount) return null;
      if (!seen.has(p - 1)) {
        seen.add(p - 1);
        indices.push(p - 1);
      }
    } else {
      return null;
    }
  }
  return indices.length > 0 ? indices : null;
}

export default function PdfSplitter() {
  const { premium } = useRealPremium();
  const limits = limitsFor(premium);
  const { t } = useLanguage();

  const [file, setFile] = useState<File | null>(null);
  const [pageCount, setPageCount] = useState<number | null>(null);
  const [mode, setMode] = useState<Mode>("all");
  const [rangeInput, setRangeInput] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  async function processFile(selected: File | null) {
    setResults([]);
    setError(null);
    setPageCount(null);

    if (!selected) {
      setFile(null);
      return;
    }
    if (selected.size > limits.maxSizeMb * 1024 * 1024) {
      setFile(null);
      setError(
        t("split.errTooLarge", {
          name: selected.name,
          limit: limits.maxSizeMb,
          extra: premium ? "" : t("split.errTooLargeExtra"),
        })
      );
      return;
    }

    setFile(selected);
    try {
      const { PDFDocument } = await import("pdf-lib");
      const doc = await PDFDocument.load(await selected.arrayBuffer());
      setPageCount(doc.getPageCount());
    } catch {
      setFile(null);
      setError(t("split.errInvalidPdf"));
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    processFile(e.target.files?.[0] ?? null);
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    const dropped = Array.from(e.dataTransfer.files ?? []).find(
      (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf")
    );
    if (dropped) processFile(dropped);
  }

  async function split() {
    if (!file || pageCount === null) return;
    setBusy(true);
    setError(null);
    setResults([]);

    try {
      const { PDFDocument } = await import("pdf-lib");
      const sourceBytes = await file.arrayBuffer();
      const source = await PDFDocument.load(sourceBytes);
      const baseName = file.name.replace(/\.[^/.]+$/, "");
      const newResults: Result[] = [];

      const makePdf = async (indices: number[], name: string) => {
        const out = await PDFDocument.create();
        const pages = await out.copyPages(source, indices);
        pages.forEach((p) => out.addPage(p));
        const bytes = await out.save();
        const blob = new Blob([bytes.slice().buffer as ArrayBuffer], {
          type: "application/pdf",
        });
        newResults.push({ name, url: URL.createObjectURL(blob) });
      };

      if (mode === "all") {
        for (let i = 0; i < pageCount; i++) {
          await makePdf([i], t("split.pageFileName", { base: baseName, page: i + 1 }));
        }
      } else {
        const indices = parsePageRanges(rangeInput, pageCount);
        if (!indices) {
          setError(t("split.errBadRange", { max: pageCount }));
          setBusy(false);
          return;
        }
        await makePdf(indices, t("split.rangeFileName", { base: baseName }));
      }

      setResults(newResults);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("split.errUnknown"));
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
            ✂️
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("split.title")}
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
              ? t("split.planPremium", { limit: limits.maxSizeMb })
              : t("split.planFree", { limit: limits.maxSizeMb })}
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
              {file
                ? pageCount !== null
                  ? t("split.fileInfo", { name: file.name, pages: pageCount })
                  : file.name
                : t("split.dropFile")}
            </span>
            <span className="text-xs text-foreground/50">{t("split.dropHint")}</span>
            <span className="text-xs text-foreground/40">{t("common.dragHint")}</span>
            <input
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
              <input
                type="radio"
                name="split-mode"
                checked={mode === "all"}
                onChange={() => setMode("all")}
                className="h-4 w-4 accent-accent"
              />
              {t("split.modeAll")}
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground/80">
              <input
                type="radio"
                name="split-mode"
                checked={mode === "range"}
                onChange={() => setMode("range")}
                className="h-4 w-4 accent-accent"
              />
              {t("split.modeRange")}
            </label>
            {mode === "range" && (
              <input
                type="text"
                value={rangeInput}
                onChange={(e) => setRangeInput(e.target.value)}
                placeholder={t("split.rangePlaceholder")}
                className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground/30"
              />
            )}
          </div>

          <button
            onClick={split}
            disabled={!file || pageCount === null || busy || (mode === "range" && !rangeInput.trim())}
            className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-white shadow-sm shadow-accent/30 transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? t("split.splitting") : t("split.split")}
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
                      zip.file(r.name, await resp.blob());
                    }
                    const zipBlob = await zip.generateAsync({ type: "blob" });
                    const a = document.createElement("a");
                    a.href = URL.createObjectURL(zipBlob);
                    a.download = "bolunmus-pdf.zip";
                    a.click();
                  }}
                  className="rounded-full bg-foreground/10 px-5 py-3 text-sm font-medium text-foreground transition-colors hover:bg-foreground/15"
                >
                  {t("split.downloadAll")}
                </button>
              )}
              {results.map((r) => (
                <a
                  key={r.name}
                  href={r.url}
                  download={r.name}
                  className="flex items-center justify-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-5 py-3 text-center text-sm font-medium text-accent transition-colors hover:bg-accent/15"
                >
                  {t("split.download", { name: r.name })}
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
