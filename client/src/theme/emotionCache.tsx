"use client";

import { CacheProvider } from "@emotion/react";
import { useState } from "react";
import createCache from "@emotion/cache";

const createEmotionCache = () => createCache({ key: "css", prepend: true });

export function EmotionCacheProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cache] = useState(() => createEmotionCache());

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}
