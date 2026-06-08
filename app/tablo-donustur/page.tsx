"use client";

import { useState } from "react";
import Link from "next/link";
import { limitsFor } from "@/lib/premium";
import { useRealPremium } from "@/lib/useRealPremium";
import { useLanguage } from "@/lib/i18n";

type Direction = "xlsx-to-csv" | "csv-to-xlsx";

const DIRECTIONS: { value: Direction; label: string; accept: string }[] = [
  { value: "xlsx-to-csv", label: "XLSX → CSV", accept: ".xlsx,.xls" },
  { value: "csv-to-xlsx", label: "CSV → XLSX", accept: ".csv" },
];

type Result = { name: string; url: string };

export default function TableConverter() {
  const { premium } = useRealPremium();
  const limits = limitsFor(premium);
  const { t } = useLanguage();

  const [direction, setDirection] = useState<Direction>("xlsx-to-csv");
  const [files, setFiles] = useState<File[]>([]);
  const [results, setResults] = useState<Result[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);

  function processFiles(selected: File[]) {
    setResults([]);
    setErrors([]);
    const maxBytes = limits.maxSizeMb * 1024 * 1024;
    const valid: File[] = [];
    const errs: string[] = [];
    for (const f of selected) {
      if (f.size > maxBytes) {
        errs.push(
          t("table.errTooLarge", {
            name: f.name,
            limit: limits.maxSizeMb,
            extra: premium ? "" : t("table.errTooLargeExtra"),
          })
        );
      } else {
        valid.push(f);
      }
    }
    setFiles(valid);
    if (errs.length > 0) setErrors(errs);
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    processFiles(Array.from(e.target.files ?? []));
  }

  function handleDrop(e: React.DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setDragOver(false);
    processFiles(Array.from(e.dataTransfer.files ?? []));
  }

  async function convertOne(file: File): Promise<Result[]> {
    const baseName = file.name.replace(/\.[^/.]+$/, "");
    const XLSX = await import("xlsx");

    if (direction === "xlsx-to-csv") {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      return workbook.SheetNames.map((sheetName) => {
        const sheet = workbook.Sheets[sheetName];
        const csv = XLSX.utils.sheet_to_csv(sheet);
        const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
        const fileName =
          workbook.SheetNames.length > 1
            ? t("table.csvSheetName", { base: baseName, sheet: sheetName })
            : `${baseName}.csv`;
        return { name: fileName, url: URL.createObjectURL(blob) };
      });
    } else {
      const text = await file.text();
      const workbook = XLSX.read(text, { type: "string" });
      const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
      const blob = new Blob([bytes], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      return [{ name: `${baseName}.xlsx`, url: URL.createObjectURL(blob) }];
    }
  }

  async function convert() {
    if (files.length === 0) return;
    setBusy(true);
    setErrors([]);
    setResults([]);
    setProgress({ done: 0, total: files.length });

    const allResults: Result[] = [];
    const allErrors: string[] = [];

    for (let i = 0; i < files.length; i++) {
      setProgress({ done: i, total: files.length });
      try {
        const res = await convertOne(files[i]);
        allResults.push(...res);
      } catch (err) {
        allErrors.push(
          t("table.errFile", {
            name: files[i].name,
            msg: err instanceof Error ? err.message : t("table.errUnknown"),
          })
        );
      }
    }

    setProgress(null);
    setResults(allResults);
    setErrors(allErrors);
    setBusy(false);
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
            📊
          </span>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("table.title")}
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
              ? t("table.planPremium", { limit: limits.maxSizeMb })
              : t("table.planFree", { limit: limits.maxSizeMb })}
          </p>

          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground/70">{t("table.direction")}</label>
            <select
              value={direction}
              onChange={(e) => {
                setDirection(e.target.value as Direction);
                setFiles([]);
                setResults([]);
                setErrors([]);
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
                ? t("table.selectedCount", { count: files.length })
                : t("table.dropFile")}
            </span>
            <span className="text-xs text-foreground/50">{t("doc.fileType", { ext: accept.toUpperCase() })}</span>
            <span className="text-xs text-foreground/40">{t("common.dragHint")}</span>
            <input
              key={direction}
              type="file"
              accept={accept}
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>

          <button
            onClick={convert}
            disabled={files.length === 0 || busy}
            className="rounded-full bg-accent px-5 py-3 text-sm font-medium text-white shadow-sm shadow-accent/30 transition-colors hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {progress
              ? t("table.progress", { done: progress.done, total: progress.total })
              : t("table.convert")}
          </button>

          {errors.length > 0 && (
            <div className="flex flex-col gap-1">
              {errors.map((e, i) => (
                <p key={i} className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400">
                  {e}
                </p>
              ))}
            </div>
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
                  {t("table.downloadAll")}
                </button>
              )}
              {results.map((r) => (
                <a
                  key={r.name}
                  href={r.url}
                  download={r.name}
                  className="flex items-center justify-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-5 py-3 text-center text-sm font-medium text-accent transition-colors hover:bg-accent/15"
                >
                  {t("table.download", { name: r.name })}
                </a>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
