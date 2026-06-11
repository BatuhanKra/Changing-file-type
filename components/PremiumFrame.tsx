"use client";

import { useEffect, useState } from "react";
import { useRealPremium } from "@/lib/useRealPremium";
import { useLanguage } from "@/lib/i18n";
import PremiumButton from "./PremiumButton";

const TEASER_DISMISS_KEY = "convertdesk:teaser-dismissed";

// Premium members get an animated gold frame around the viewport; free
// visitors get a slim, dismissible upsell strip under the header.
export default function PremiumFrame() {
  const { premium } = useRealPremium();
  const { t } = useLanguage();
  const [teaserDismissed, setTeaserDismissed] = useState(true);

  useEffect(() => {
    setTeaserDismissed(window.localStorage.getItem(TEASER_DISMISS_KEY) === "1");
  }, []);

  if (premium) {
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 z-50">
        <div className="gold-strip absolute inset-x-0 top-0 h-1" />
        <div className="gold-strip absolute inset-x-0 bottom-0 h-1" />
        <div className="gold-strip-vertical absolute inset-y-0 left-0 w-1" />
        <div className="gold-strip-vertical absolute inset-y-0 right-0 w-1" />
      </div>
    );
  }

  if (teaserDismissed) return null;

  return (
    <div className="relative border-b border-amber-400/30 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 dark:from-amber-400/10 dark:via-orange-400/5 dark:to-amber-400/10">
      <div className="mx-auto flex w-full max-w-3xl flex-wrap items-center justify-center gap-x-4 gap-y-2 px-10 py-2.5 text-center">
        <span className="text-sm text-foreground/80">
          <span className="mr-1 text-amber-500">✦</span>
          {t("teaser.text")}
        </span>
        <PremiumButton className="rounded-full bg-gradient-to-r from-amber-400 to-orange-400 px-4 py-1.5 text-xs font-semibold text-black shadow-sm transition-opacity hover:opacity-90" />
      </div>
      <button
        onClick={() => {
          window.localStorage.setItem(TEASER_DISMISS_KEY, "1");
          setTeaserDismissed(true);
        }}
        aria-label={t("teaser.dismiss")}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-foreground/40 transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        ✕
      </button>
    </div>
  );
}
