"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

// Replace with the address you actually monitor before going live.
const CONTACT_EMAIL = "convertdeskapp@gmail.com";

export default function ContactPage() {
  const { t } = useLanguage();

  return (
    <div className="flex flex-col flex-1 items-center bg-background">
      <main className="flex w-full max-w-2xl flex-col gap-6 py-12 px-6">
        <Link href="/" className="text-sm text-foreground/50 transition-colors hover:text-accent">
          {t("back.home")}
        </Link>

        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {t("contact.title")}
        </h1>

        <div className="flex flex-col gap-6 rounded-2xl border border-card-border bg-card p-6 shadow-sm">
          <p className="text-sm leading-relaxed text-foreground/70">{t("contact.intro")}</p>

          <div className="flex flex-col gap-2">
            <h2 className="text-base font-semibold text-foreground">{t("contact.emailTitle")}</h2>
            <p className="text-sm leading-relaxed text-foreground/70">{t("contact.emailBody")}</p>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="w-fit rounded-full border border-accent/30 bg-accent-soft px-5 py-2.5 text-sm font-medium text-accent transition-colors hover:bg-accent/15"
            >
              ✉ {CONTACT_EMAIL}
            </a>
          </div>

          <p className="rounded-lg bg-accent-soft px-4 py-3 text-xs leading-relaxed text-foreground/60">
            {t("contact.privacyNote")}
          </p>
        </div>
      </main>
    </div>
  );
}
