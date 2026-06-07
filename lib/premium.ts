"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "dosya-cevirici:premium";
const EVENT_NAME = "dosya-cevirici:premium-changed";

export function isPremium(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(STORAGE_KEY) === "1";
}

export function setPremium(value: boolean) {
  window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function usePremium() {
  const [premium, setPremiumState] = useState(false);

  useEffect(() => {
    setPremiumState(isPremium());
    const onChange = () => setPremiumState(isPremium());
    window.addEventListener(EVENT_NAME, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT_NAME, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  return {
    premium,
    toggle: () => setPremium(!premium),
  };
}

export const LIMITS = {
  free: { maxFiles: 1, maxSizeMb: 15 },
  premium: { maxFiles: 10, maxSizeMb: 200 },
} as const;

export function limitsFor(premium: boolean) {
  return premium ? LIMITS.premium : LIMITS.free;
}
