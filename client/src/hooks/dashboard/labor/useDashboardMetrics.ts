import { useMemo } from "react";

import {
  applyGroupFilters,
  buildChartData,
  buildRankings,
  calculateTotals,
} from "@/utils/metrics";
import type {
  DailySummary,
  DashboardFiltersState,
  GroupSummary,
} from "@/types/dashboard/labor/types";

interface UseDashboardMetricsParams {
  dailyData: DailySummary[];
  groupData: GroupSummary[];
  metaDiaria: number;
  filters: DashboardFiltersState;
}

export function useDashboardMetrics({
  dailyData,
  groupData,
  metaDiaria,
  filters,
}: UseDashboardMetricsParams) {
  return useMemo(() => {
    const filteredGroups = applyGroupFilters(groupData, filters);

    const totals = calculateTotals({
      dailyData,
      groupData: filteredGroups,
      metaDiaria,
    });

    const rankings = buildRankings(filteredGroups);

    const charts = buildChartData({
      dailyData,
      groupData: filteredGroups,
      metaDiaria,
    });

    return {
      filteredGroups,
      totals,
      rankings,
      charts,
    };
  }, [dailyData, groupData, metaDiaria, filters]);
}
