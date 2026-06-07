"use client";

import Link from "next/link";
import { usePremium, LIMITS } from "@/lib/premium";

export default function SiteHeader() {
  const { premium, toggle } = usePremium();

  return (
    <header className="sticky top-0 z-10 border-b border-card-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-fuchsia-400 text-base font-bold text-white shadow-sm shadow-accent/30">
            ⇄
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Dosya Çevirme Aracı
          </span>
          {premium && (
            <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2.5 py-0.5 text-xs font-semibold text-black shadow-sm">
              ✦ Premium
            </span>
          )}
        </Link>

        <button
          onClick={toggle}
          title={
            premium
              ? `Premium aktif: aynı anda ${LIMITS.premium.maxFiles} dosyaya kadar, dosya başına ${LIMITS.premium.maxSizeMb} MB`
              : `Ücretsiz plan: tek seferde 1 dosya, dosya başına ${LIMITS.free.maxSizeMb} MB`
          }
          className={
            premium
              ? "rounded-full border border-amber-400/70 px-4 py-2 text-sm font-medium text-amber-500 transition-colors hover:bg-amber-400/10"
              : "rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm shadow-accent/30 transition-colors hover:bg-accent/90"
          }
        >
          {premium ? "Premium'dan çık" : "✦ Premium'a geç"}
        </button>
      </div>
    </header>
  );
}
