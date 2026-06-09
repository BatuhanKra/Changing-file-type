"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function AboutPage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col flex-1 items-center bg-background">
      <main className="flex w-full max-w-2xl flex-col gap-6 py-12 px-6">
        <Link href="/" className="text-sm text-foreground/50 transition-colors hover:text-accent">
          {t("back.home")}
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("about.title")}
        </h1>

        <div className="flex flex-col gap-6 rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <p className="text-base font-medium leading-relaxed text-foreground">
            {t("about.intro")}
          </p>
          <p className="text-sm leading-relaxed text-foreground/70">{t("about.p1")}</p>
          <p className="text-sm leading-relaxed text-foreground/70">{t("about.p2")}</p>
          <p className="text-sm leading-relaxed text-foreground/70">{t("about.p3")}</p>

          <div className="flex flex-col gap-3">
            <h2 className="text-base font-semibold text-foreground">{t("about.whyTitle")}</h2>
            <ul className="flex flex-col gap-2">
              {([1, 2, 3, 4] as const).map((n) => (
                <li key={n} className="flex items-start gap-2 text-sm leading-relaxed text-foreground/70">
                  <span className="mt-0.5 text-accent">✓</span>
                  {t(`about.why${n}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
