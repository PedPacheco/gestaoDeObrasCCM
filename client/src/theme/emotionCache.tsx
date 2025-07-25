"use client";

import { CacheProvider } from "@emotion/react";
import { ReactNode } from "react";
import createEmotionCache from "./createEmotionCache";

const clientSideEmotionCache = createEmotionCache();

interface EmotionCacheProviderProps {
  children: ReactNode;
}

export function EmotionCacheProvider({ children }: EmotionCacheProviderProps) {
  return (
    <CacheProvider value={clientSideEmotionCache}>{children}</CacheProvider>
  );
}
