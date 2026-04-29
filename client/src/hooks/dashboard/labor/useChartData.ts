import { DailySummary, GroupSummary } from "@/types/dashboard/labor/types";
import { useMemo } from "react";

interface UseChartDataParams {
  dailyData: DailySummary[];
  groupData: GroupSummary[];
}

export function useChartData({ dailyData, groupData }: UseChartDataParams) {
  return useMemo(
    () => ({
      dailyPerformance: dailyData.map((item) => ({
        date: item.data,
        executado: item.executado,
        meta: item.meta,
        percentual: item.percentualMeta,
      })),

      partnerPerformance: groupData
        .slice()
        .sort((a, b) => b.percentualMeta - a.percentualMeta)
        .map((item) => ({
          partner: item.parceira,
          executado: item.executado,
          percentual: item.percentualMeta,
        })),
    }),
    [dailyData, groupData],
  );
}
