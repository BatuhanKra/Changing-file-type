"use client";

import { useState } from "react";
import { limitsFor } from "@/lib/premium";
import { useRealPremium } from "@/lib/useRealPremium";
import { useLanguage } from "@/lib/i18n";
import {
  SOURCE_FORMATS,
  TARGET_FORMATS,
  detectFormat,
  convertDocument,
  type DocFormat,
  type TargetFormat,
} from "@/lib/document-convert";

type Result = { name: string; url: string };

const ALL_ACCEPT = SOURCE_FORMATS.map((s) => s.accept).join(",");

export default function DocumentConverterTool({
  initialSource = "pdf",
  initialTarget = "docx",
}: {
  initialSource?: DocFormat;
  initialTarget?: TargetFormat;
}) {
  const { premium } = useRealPremium();
  const limits = limitsFor(premium);
  const { t } = useLanguage();

  const [source, setSource] = useState<DocFormat>(initialSource);
  const [target, setTarget] = useState<TargetFormat>(initialTarget);
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
    let detected: DocFormat | null = null;

    for (const f of selected) {
      const format = detectFormat(f.name);
      if (!format) {
        errs.push(t("doc.errUnsupported", { name: f.name }));
        continue;
      }
      if (f.size > maxBytes) {
        errs.push(
          t("doc.errTooLarge", {
            name: f.name,
            limit: limits.maxSizeMb,
            extra: premium ? "" : t("doc.errTooLargeExtra"),
          })
        );
        continue;
      }
      if (detected === null) detected = format;
      if (format !== detected) {
        errs.push(t("doc.errMixedFormats", { name: f.name }));
        continue;
      }
      valid.push(f);
    }

    if (detected) {
      setSource(detected);
      if (detected === target) {
        setTarget(detected === "pdf" ? "docx" : "pdf");
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
        const converted = await convertDocument(files[i], source, target, (base, page) =>
          t("doc.pdfImagePageName", { base, page })
        );
        for (const c of converted) {
          allResults.push({ name: c.name, url: URL.createObjectURL(c.blob) });
        }
      } catch (err) {
        allErrors.push(
          t("doc.errFile", {
            name: files[i].name,
            msg: err instanceof Error ? err.message : t("doc.errUnknown"),
          })
        );
      }
    }

    setProgress(null);
    setResults(allResults);
    setErrors(allErrors);
    setBusy(false);
  }

  const sourceDef = SOURCE_FORMATS.find((s) => s.value === source)!;
  const targetChoices = TARGET_FORMATS.filter((f) => f.value !== source);

  return (
    <div className="flex flex-col gap-5 rounded-2xl border border-card-border bg-card p-6 shadow-sm">
      <p
        className={
          premium
            ? "rounded-lg bg-amber-400/10 px-3 py-2 text-sm text-amber-600 dark:text-amber-400"
            : "rounded-lg bg-accent-soft px-3 py-2 text-sm text-foreground/70"
        }
      >
        {premium
          ? t("doc.planPremium", { limit: limits.maxSizeMb })
          : t("doc.planFree", { limit: limits.maxSizeMb })}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm font-medium text-foreground/70">{t("doc.sourceFormat")}</label>
        <select
          value={source}
          onChange={(e) => {
            const next = e.target.value as DocFormat;
            setSource(next);
            if (next === target) setTarget(next === "pdf" ? "docx" : "pdf");
            setFiles([]);
            setResults([]);
            setErrors([]);
          }}
          className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {SOURCE_FORMATS.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>

        <span className="text-foreground/40">→</span>

        <select
          value={target}
          onChange={(e) => {
            setTarget(e.target.value as TargetFormat);
            setResults([]);
            setErrors([]);
          }}
          className="rounded-lg border border-card-border bg-background px-3 py-2 text-sm text-foreground"
        >
          {targetChoices.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <p className="text-xs text-foreground/50">{t("doc.autoDetectHint")}</p>

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
          {files.length > 0 ? t("doc.selectedCount", { count: files.length }) : t("doc.dropFile")}
        </span>
        <span className="text-xs text-foreground/50">
          {t("doc.fileType", { ext: sourceDef.accept.toUpperCase() })}
        </span>
        <span className="text-xs text-foreground/40">{t("common.dragHint")}</span>
        <input
          key={source}
          type="file"
          accept={ALL_ACCEPT}
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
          ? t("doc.progress", { done: progress.done, total: progress.total })
          : t("doc.convert")}
      </button>

      {errors.length > 0 && (
        <div className="flex flex-col gap-1">
          {errors.map((e, i) => (
            <p
              key={i}
              className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
            >
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
              {t("doc.downloadAll")}
            </button>
          )}
          {results.map((r) => (
            <a
              key={r.name}
              href={r.url}
              download={r.name}
              className="flex items-center justify-center gap-2 rounded-full border border-accent/30 bg-accent-soft px-5 py-3 text-center text-sm font-medium text-accent transition-colors hover:bg-accent/15"
            >
              {t("doc.download", { name: r.name })}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
