import nookies from "nookies";
import { useEffect, useState } from "react";

export function useSaveFilters(pageKey: string) {
  const [filters, setFilters] = useState<Record<string, any>>();

  useEffect(() => {
    const cookies = nookies.get();
    const saveFilters = cookies[pageKey];

    if (saveFilters) {
      setFilters(JSON.parse(saveFilters));
    }
  }, [pageKey]);

  function saveFilters(filtersValues: Record<string, any>) {
    const currentFilters = nookies.get(null)[pageKey]
      ? JSON.parse(nookies.get(null)[pageKey])
      : {};

    const newFilters = { ...currentFilters, ...filtersValues };

    setFilters(newFilters);
    nookies.set(null, pageKey, JSON.stringify(newFilters), {
      maxAge: 1200,
      path: "/",
    });
  }

  function clearFilters() {
    setFilters(undefined);
    nookies.destroy(null, pageKey, { path: "/" });
  }

  return { filters, saveFilters, clearFilters };
}
