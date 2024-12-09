import nookies from "nookies";
import { useEffect, useState } from "react";

export function useSaveFilters(pageKey: string) {
  const [filters, setFilters] = useState<Record<string, string>>({});

  useEffect(() => {
    const cookies = nookies.get();
    const saveFilters = cookies[pageKey];

    if (saveFilters) {
      setFilters(JSON.parse(saveFilters));
    }
  }, [pageKey]);

  function saveFilters(newFilters: Record<string, string>) {
    setFilters(newFilters);
    nookies.set(null, pageKey, JSON.stringify(newFilters));
  }

  function clearFilters() {
    setFilters({});
    nookies.destroy(null, pageKey);
  }

  return { filters, saveFilters, clearFilters };
}
