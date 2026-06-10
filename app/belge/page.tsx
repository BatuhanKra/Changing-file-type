"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";
import DocumentConverterTool from "@/components/DocumentConverterTool";

export default function DocumentConverter() {
  const { t } = useLanguage();

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

        <DocumentConverterTool />
      </main>
    </div>
  );
}
