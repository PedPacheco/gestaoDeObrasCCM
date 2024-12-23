import { useRouter } from "next/navigation";
import nookies from "nookies";
import { useEffect, useState } from "react";

export function useSaveFilters(pageKey: string) {
  const [filters, setFilters] = useState<Record<string, any>>();
  const router = useRouter();

  useEffect(() => {
    const cookies = nookies.get();
    const saveFilters = cookies[pageKey];

    if (saveFilters) {
      setFilters(JSON.parse(saveFilters));
    }
  }, [pageKey]);

  function saveFilters(newFilters: Record<string, any>) {
    setFilters(newFilters);
    nookies.set(null, pageKey, JSON.stringify(newFilters), {
      maxAge: 1200,
      path: "/",
    });
    router.refresh();
  }

  function clearFilters() {
    setFilters(undefined);
    nookies.destroy(null, pageKey, { path: "/" });
    router.refresh();
  }

  return { filters, saveFilters, clearFilters };
}
