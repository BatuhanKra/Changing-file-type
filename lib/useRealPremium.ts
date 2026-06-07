"use client";

import { useUser } from "@clerk/nextjs";

export function useRealPremium() {
  const { user, isLoaded } = useUser();
  const premium = isLoaded ? user?.publicMetadata?.premium === true : false;
  return { premium, loaded: isLoaded, user };
}
