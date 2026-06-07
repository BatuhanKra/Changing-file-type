"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function PrivacyPolicy() {
  const { t } = useLanguage();

  const sections = [1, 2, 3, 4, 5, 6] as const;

  return (
    <div className="flex flex-col flex-1 items-center bg-background">
      <main className="flex w-full max-w-2xl flex-col gap-6 py-12 px-6">
        <Link href="/" className="text-sm text-foreground/50 transition-colors hover:text-accent">
          {t("back.home")}
        </Link>

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {t("privacy.title")}
          </h1>
          <p className="text-sm text-foreground/50">{t("privacy.updated")}</p>
        </div>

        <div className="flex flex-col gap-6 rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <p className="text-sm leading-relaxed text-foreground/80">{t("privacy.intro")}</p>

          {sections.map((n) => (
            <div key={n} className="flex flex-col gap-1.5">
              <h2 className="text-base font-semibold text-foreground">
                {t(`privacy.section${n}.title` as Parameters<typeof t>[0])}
              </h2>
              <p className="text-sm leading-relaxed text-foreground/70">
                {t(`privacy.section${n}.body` as Parameters<typeof t>[0])}
              </p>
            </div>
          ))}

          <div className="flex flex-col gap-1.5">
            <h2 className="text-base font-semibold text-foreground">{t("privacy.contact.title")}</h2>
            <p className="text-sm leading-relaxed text-foreground/70">{t("privacy.contact.body")}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
