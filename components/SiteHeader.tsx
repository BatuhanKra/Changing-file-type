"use client";

import Link from "next/link";
import { Show, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs";
import { useRealPremium } from "@/lib/useRealPremium";
import { useLanguage } from "@/lib/i18n";
import PremiumButton from "./PremiumButton";

export default function SiteHeader() {
  const { premium } = useRealPremium();
  const { lang, toggle: toggleLang, t } = useLanguage();

  return (
    <header className="sticky top-0 z-10 border-b border-card-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-accent to-fuchsia-400 text-base font-bold text-white shadow-sm shadow-accent/30">
            ⇄
          </span>
          <span className="text-lg font-semibold tracking-tight text-foreground">
            Convertit
          </span>
          {premium && (
            <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-2.5 py-0.5 text-xs font-semibold text-black shadow-sm">
              {t("nav.premiumBadge")}
            </span>
          )}
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleLang}
            title={lang === "tr" ? "Switch to English" : "Türkçe'ye geç"}
            className="rounded-full border border-card-border px-3 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent-soft hover:text-accent"
          >
            {lang === "tr" ? "EN" : "TR"}
          </button>

          <PremiumButton />

          <Show when="signed-out">
            <SignInButton mode="modal">
              <button className="rounded-full border border-card-border px-4 py-2 text-sm font-medium text-foreground/70 transition-colors hover:bg-accent-soft hover:text-accent">
                {t("nav.signIn")}
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button className="rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background transition-opacity hover:opacity-90">
                {t("nav.signUp")}
              </button>
            </SignUpButton>
          </Show>
          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </div>
    </header>
  );
}
