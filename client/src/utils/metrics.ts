import type {
  DailySummary,
  DashboardFiltersState,
  GroupSummary,
} from "@/types/dashboard/labor/types";

export function applyGroupFilters(
  groups: GroupSummary[],
  filters: DashboardFiltersState,
): GroupSummary[] {
  return groups.filter((group) => {
    const matchesPartner =
      filters.partner === "all" || group.parceira === filters.partner;

    const matchesSearch =
      !filters.search ||
      group.parceira.toLowerCase().includes(filters.search.toLowerCase());

    return matchesPartner && matchesSearch;
  });
}

interface CalculateTotalsParams {
  dailyData: DailySummary[];
  groupData: GroupSummary[];
  metaDiaria: number;
}

export function calculateTotals({
  dailyData,
  groupData,
  metaDiaria,
}: CalculateTotalsParams) {
  const totalExecutado = dailyData.reduce(
    (acc, item) => acc + item.executado,
    0,
  );

  const totalMeta = metaDiaria * dailyData.length;
  const totalProgramado = dailyData.reduce(
    (acc, item) => acc + item.programado,
    0,
  );

  const produtividade = totalMeta > 0 ? (totalExecutado / totalMeta) * 100 : 0;

  return {
    totalExecutado,
    totalMeta,
    totalProgramado,
    produtividade,
    totalParceiras: groupData.length,
  };
}

export function buildRankings(groups: GroupSummary[]) {
  return [...groups]
    .sort((a, b) => b.percentualMeta - a.percentualMeta)
    .slice(0, 10);
}

export function buildChartData({ dailyData }: CalculateTotalsParams) {
  return {
    dailyPerformance: dailyData.map((item) => ({
      date: item.data,
      executado: item.executado,
      meta: item.meta,
      percentual: item.percentualMeta,
    })),
  };
}

export function calculatePerformance(current: number, target: number) {
  const percentage = target > 0 ? (current / target) * 100 : 0;

  return {
    percentage,
    achieved: percentage >= 100,
    status:
      percentage >= 100
        ? "excellent"
        : percentage >= 80
          ? "good"
          : percentage >= 60
            ? "warning"
            : "critical",
  };
}
