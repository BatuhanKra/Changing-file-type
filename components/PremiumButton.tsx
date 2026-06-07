"use client";

import { useState } from "react";
import { Show, SignUpButton } from "@clerk/nextjs";
import { useRealPremium } from "@/lib/useRealPremium";
import { useLanguage } from "@/lib/i18n";

const PRICE_ID = process.env.NEXT_PUBLIC_PADDLE_PRICE_ID ?? "";
const CLIENT_TOKEN = process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? "";
const PADDLE_ENV = (process.env.NEXT_PUBLIC_PADDLE_ENV ?? "sandbox") as "sandbox" | "production";

export default function PremiumButton({ className }: { className?: string }) {
  const { premium, user } = useRealPremium();
  const { t } = useLanguage();
  const [busy, setBusy] = useState(false);

  async function startCheckout() {
    if (!user || busy) return;
    setBusy(true);
    try {
      const { initializePaddle } = await import("@paddle/paddle-js");
      const paddle = await initializePaddle({
        token: CLIENT_TOKEN,
        environment: PADDLE_ENV,
      });

      paddle?.Checkout.open({
        items: [{ priceId: PRICE_ID, quantity: 1 }],
        customer: user.primaryEmailAddress?.emailAddress
          ? { email: user.primaryEmailAddress.emailAddress }
          : undefined,
        customData: { clerkUserId: user.id },
      });
    } finally {
      setBusy(false);
    }
  }

  if (premium) {
    return (
      <span className={className ?? "rounded-full border border-amber-400/70 px-4 py-2 text-sm font-medium text-amber-500"}>
        {t("nav.premiumBadge")}
      </span>
    );
  }

  return (
    <>
      <Show when="signed-in">
        <button
          onClick={startCheckout}
          disabled={busy}
          className={
            className ??
            "rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm shadow-accent/30 transition-colors hover:bg-accent/90 disabled:opacity-50"
          }
        >
          {t("nav.premiumOff")}
        </button>
      </Show>
      <Show when="signed-out">
        <SignUpButton mode="modal">
          <button
            className={
              className ??
              "rounded-full bg-accent px-4 py-2 text-sm font-medium text-white shadow-sm shadow-accent/30 transition-colors hover:bg-accent/90"
            }
          >
            {t("nav.premiumOff")}
          </button>
        </SignUpButton>
      </Show>
    </>
  );
}
