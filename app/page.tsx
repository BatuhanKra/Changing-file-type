"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n";

export default function Home() {
  const { t } = useLanguage();

  const TOOLS = [
    {
      href: "/resim",
      icon: "🖼️",
      title: t("home.tool.image.title"),
      description: t("home.tool.image.desc"),
    },
    {
      href: "/belge",
      icon: "📄",
      title: t("home.tool.doc.title"),
      description: t("home.tool.doc.desc"),
    },
    {
      href: "/pdf-birlestir",
      icon: "🧩",
      title: t("home.tool.merge.title"),
      description: t("home.tool.merge.desc"),
    },
    {
      href: "/pdf-bol",
      icon: "✂️",
      title: t("home.tool.split.title"),
      description: t("home.tool.split.desc"),
    },
    {
      href: "/tablo-donustur",
      icon: "📊",
      title: t("home.tool.table.title"),
      description: t("home.tool.table.desc"),
    },
  ];

  return (
    <div className="flex flex-col flex-1 items-center bg-background">
      <div className="relative w-full overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_-10%,var(--accent-soft),transparent_60%)]" />
        <main className="mx-auto flex w-full max-w-3xl flex-col items-center gap-14 px-6 py-20">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="rounded-full border border-card-border bg-card px-3 py-1 text-xs font-medium text-accent">
              {t("home.badge")}
            </span>
            <h1 className="max-w-lg text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              {t("home.titleA")}
              <span className="bg-gradient-to-r from-accent to-fuchsia-400 bg-clip-text text-transparent">
                {t("home.titleHighlight")}
              </span>
              {t("home.titleB")}
            </h1>
            <p className="max-w-md text-lg leading-7 text-foreground/60">
              {t("home.subtitle")}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-foreground/50">
              <span className="flex items-center gap-1.5">
                <span className="text-accent">⚡</span> {t("home.trust.directions")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-accent">🔒</span> {t("home.trust.browser")}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="text-accent">✓</span> {t("home.trust.free")}
              </span>
            </div>
          </div>

          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
            {TOOLS.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex flex-col gap-3 rounded-2xl border border-card-border bg-card p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-accent/10"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent-soft text-2xl">
                  {tool.icon}
                </span>
                <span className="text-xl font-medium text-foreground">
                  {tool.title}
                </span>
                <span className="text-sm text-foreground/60">{tool.description}</span>
                <span className="mt-1 text-sm font-medium text-accent opacity-0 transition-opacity group-hover:opacity-100">
                  {t("home.open")}
                </span>
              </Link>
            ))}
          </div>

          <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex flex-col gap-3 rounded-2xl border border-card-border bg-card p-6">
              <span className="text-lg font-medium text-foreground">{t("home.plan.free.title")}</span>
              <ul className="flex flex-col gap-2 text-sm text-foreground/60">
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> {t("home.plan.free.item1")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> {t("home.plan.free.item2")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">✓</span> {t("home.plan.free.item3")}
                </li>
              </ul>
            </div>

            <div className="relative flex flex-col gap-3 overflow-hidden rounded-2xl border border-amber-400/50 bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:from-amber-400/10 dark:to-orange-400/5">
              <span className="flex items-center gap-2 text-lg font-medium text-foreground">
                {t("home.plan.premium.title")}
                <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2 py-0.5 text-xs font-semibold text-black">
                  {t("home.plan.premium.badge")}
                </span>
              </span>
              <ul className="flex flex-col gap-2 text-sm text-foreground/70">
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">✦</span> {t("home.plan.premium.item1")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">✦</span> {t("home.plan.premium.item2")}
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-amber-500">✦</span> {t("home.plan.premium.item3")}
                </li>
              </ul>
              <p className="text-xs text-foreground/50">{t("home.plan.premium.note")}</p>
            </div>
          </div>

          <section className="flex w-full flex-col gap-6">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground">
              {t("home.how.title")}
            </h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
              {([1, 2, 3] as const).map((step) => (
                <div
                  key={step}
                  className="flex flex-col gap-2 rounded-2xl border border-card-border bg-card p-6"
                >
                  <span className="text-base font-semibold text-foreground">
                    {t(`home.how.step${step}.title`)}
                  </span>
                  <p className="text-sm leading-6 text-foreground/60">
                    {t(`home.how.step${step}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="flex w-full flex-col gap-6">
            <h2 className="text-center text-2xl font-semibold tracking-tight text-foreground">
              {t("home.faq.title")}
            </h2>
            <div className="flex flex-col gap-3">
              {([1, 2, 3, 4, 5, 6] as const).map((n) => (
                <details
                  key={n}
                  className="group rounded-2xl border border-card-border bg-card px-6 py-4 transition-colors open:border-accent/30"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-foreground [&::-webkit-details-marker]:hidden">
                    {t(`home.faq.q${n}`)}
                    <span className="text-foreground/40 transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-6 text-foreground/60">
                    {t(`home.faq.a${n}`)}
                  </p>
                </details>
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
