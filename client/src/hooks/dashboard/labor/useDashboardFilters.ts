import { useCallback, useState } from "react";
import type { DashboardFiltersState } from "../../../types/dashboard/labor/types";

const INITIAL_FILTERS: DashboardFiltersState = {
  partner: "all",
  status: "all",
  search: "",
  dateRange: null,
};

export function useDashboardFilters() {
  const [filters, setFilters] =
    useState<DashboardFiltersState>(INITIAL_FILTERS);

  const updateFilter = useCallback(
    <K extends keyof DashboardFiltersState>(
      key: K,
      value: DashboardFiltersState[K],
    ) => {
      setFilters((prev) => ({
        ...prev,
        [key]: value,
      }));
    },
    [],
  );

  const resetFilters = useCallback(() => {
    setFilters(INITIAL_FILTERS);
  }, []);

  return {
    filters,
    updateFilter,
    resetFilters,
  };
}
