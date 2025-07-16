"use client";

import { Cookies } from "react-cookie";
import { useEffect, useState } from "react";

const cookies = new Cookies();

export function useSaveFilters(pageKey: string) {
  const [filters, setFilters] = useState<Record<string, any>>();

  useEffect(() => {
    const saveFilters = cookies.get(pageKey);

    if (saveFilters) {
      setFilters(saveFilters);
    }
  }, [pageKey]);

  function saveFilters(filtersValues: Record<string, any>) {
    const currentFilters = cookies.get(pageKey) ? cookies.get(pageKey) : {};

    const newFilters = { ...currentFilters, ...filtersValues };

    setFilters(newFilters);
    cookies.set(pageKey, JSON.stringify(newFilters), {
      path: "/",
      maxAge: 1200,
    });
  }

  function clearFilters() {
    setFilters(undefined);
    cookies.remove(pageKey, { path: "/" });
  }

  return { filters, saveFilters, clearFilters };
}
