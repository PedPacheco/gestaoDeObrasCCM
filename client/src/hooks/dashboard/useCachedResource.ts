"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const TTL_MS = 5 * 60 * 1000;
const cache = new Map<string, { promise: Promise<unknown>; at: number }>();
const isBrowser = typeof window !== "undefined";

export function clearDashboardCache() {
  cache.clear();
}

function getOrLoad<T>(key: string, loader: () => Promise<T>): Promise<T> {
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < TTL_MS) return hit.promise as Promise<T>;

  const promise = loader();
  cache.set(key, { promise, at: Date.now() });
  promise.catch(() => cache.delete(key));
  return promise;
}

interface ResourceState<T> {
  data: T | undefined;
  error: unknown;
  loading: boolean;
}

export function useCachedResource<T>(
  key: string,
  loader: () => Promise<T>,
  initialData?: T,
) {
  // Guarda os dados do servidor na cache uma única vez.
  // Só no browser: no SSR, um Map de módulo seria partilhado entre utilizadores.
  const seeded = useRef(false);
  if (isBrowser && !seeded.current && initialData !== undefined) {
    seeded.current = true;
    if (!cache.has(key)) {
      cache.set(key, { promise: Promise.resolve(initialData), at: Date.now() });
    }
  }

  const [state, setState] = useState<ResourceState<T>>(() =>
    initialData !== undefined
      ? { data: initialData, error: null, loading: false }
      : { data: undefined, error: null, loading: true },
  );
  const [attempt, setAttempt] = useState(0);
  const loaderRef = useRef(loader);
  loaderRef.current = loader;

  useEffect(() => {
    let active = true;
    setState((s) => (s.data ? s : { ...s, loading: true, error: null }));

    getOrLoad(key, () => loaderRef.current())
      .then((data) => active && setState({ data, error: null, loading: false }))
      .catch(
        (error) =>
          active && setState({ data: undefined, error, loading: false }),
      );

    return () => {
      active = false;
    };
  }, [key, attempt]);

  const retry = useCallback(() => {
    cache.delete(key);
    setAttempt((a) => a + 1);
  }, [key]);

  return { ...state, retry };
}
