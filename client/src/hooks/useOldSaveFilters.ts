"use client";

import { Cookies } from "react-cookie";
import { useEffect, useState } from "react";
import { FiltersInterface } from "@/types/genericFilterSchema";

const cookies = new Cookies();

interface UseOldSaveFiltersOptions {
  pageKey: string;
  data: FiltersInterface;
  applyFilters?: (
    data: FiltersInterface,
    filters: Record<string, any>,
  ) => FiltersInterface;
}

export function useOldSaveFilters({
  pageKey,
  data,
  applyFilters,
}: UseOldSaveFiltersOptions) {
  const [filters, setFilters] = useState<Record<string, any>>();
  const [filteredData, setFilteredData] = useState<FiltersInterface>(data);

  useEffect(() => {
    const saved = cookies.get(pageKey);
    if (saved) setFilters(saved);
  }, [pageKey]);

  useEffect(() => {
    if (data && filters && applyFilters) {
      const newFiltered = applyFilters(data, filters);
      setFilteredData(newFiltered);
    } else {
      setFilteredData(data);
    }
  }, [data, filters, applyFilters]);

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

  return { filters, filteredData, saveFilters, clearFilters };
}
