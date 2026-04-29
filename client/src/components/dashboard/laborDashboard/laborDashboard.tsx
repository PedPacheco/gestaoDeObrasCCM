"use client";

import { useMemo } from "react";

import { KPIGrid } from "./KPIGrid";
import { DashboardFilters } from "./filters/DashboardFilters";
import { DailyPerformanceChart } from "./charts/DailyPerformanceChart";

import { useDashboardMetrics } from "@/hooks/dashboard/labor/useDashboardMetrics";
import { useDashboardFilters } from "@/hooks/dashboard/labor/useDashboardFilters";

import type { DailySummary, GroupSummary } from "@/types/dashboard/labor/types";
import { DailySummaryTable } from "./DailySummaryTable";
import { GroupSummaryTable } from "./GroupSummaryTable";

interface Props {
  dailyData: DailySummary[];
  groupData: GroupSummary[];
  metaDiaria: number;
}

export default function LaborDashboard({
  dailyData,
  groupData,
  metaDiaria,
}: Props) {
  const { filters, updateFilter, resetFilters } = useDashboardFilters();

  const metrics = useDashboardMetrics({
    dailyData,
    groupData,
    metaDiaria,
    filters,
  });

  const partners = useMemo(
    () => [...new Set(groupData.map((item) => item.parceira))].sort(),
    [groupData],
  );

  return (
    <div className="space-y-6">
      <DashboardFilters
        filters={filters}
        partners={partners}
        onChange={updateFilter}
        onReset={resetFilters}
      />

      <KPIGrid metrics={metrics.totals} />

      <DailyPerformanceChart data={metrics.charts.dailyPerformance} />

      <DailySummaryTable data={dailyData} />

      <GroupSummaryTable data={metrics.filteredGroups} />
    </div>
  );
}
