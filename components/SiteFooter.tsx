"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function SiteFooter() {
  const { t } = useLanguage();

  const tools = [
    { href: "/belge", label: t("home.tool.doc.title") },
    { href: "/resim", label: t("home.tool.image.title") },
    { href: "/tablo-donustur", label: t("home.tool.table.title") },
    { href: "/pdf-birlestir", label: t("home.tool.merge.title") },
    { href: "/pdf-bol", label: t("home.tool.split.title") },
  ];

  const company = [
    { href: "/hakkinda", label: t("footer.about") },
    { href: "/iletisim", label: t("footer.contact") },
    { href: "/gizlilik", label: t("footer.privacy") },
    { href: "/kullanim-kosullari", label: t("footer.terms") },
  ];

  return (
    <footer className="mt-auto border-t border-card-border bg-card/50">
      <div className="mx-auto grid w-full max-w-3xl grid-cols-1 gap-10 px-6 py-12 sm:grid-cols-3">
        <div className="flex flex-col gap-3">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-accent to-fuchsia-400 text-sm font-bold text-white">
              ⇄
            </span>
            <span className="text-base font-semibold tracking-tight text-foreground">
              Convertit
            </span>
          </Link>
          <p className="text-sm leading-6 text-foreground/50">{t("footer.tagline")}</p>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-foreground/80">
            {t("footer.toolsTitle")}
          </span>
          <ul className="flex flex-col gap-2">
            {tools.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-foreground/50 transition-colors hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-3">
          <span className="text-sm font-semibold text-foreground/80">
            {t("footer.companyTitle")}
          </span>
          <ul className="flex flex-col gap-2">
            {company.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="text-sm text-foreground/50 transition-colors hover:text-accent"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="border-t border-card-border">
        <div className="mx-auto w-full max-w-3xl px-6 py-5 text-xs text-foreground/40">
          © {new Date().getFullYear()} Convertit · {t("footer.rights")}
        </div>
      </div>
    </footer>
  );
}
