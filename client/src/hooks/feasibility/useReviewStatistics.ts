import { FeasibilityServiceItem } from "@/components/feasibility/feasbilityServices/feasibilityServicesReviewStep";
import { useMemo } from "react";

export type RowStatus = "pending" | "greater" | "less" | "equal";

export function getRowStatus(row: FeasibilityServiceItem): RowStatus {
  const madeFeasible = Number(row.viabilizado);

  if (
    row.viabilizado === null ||
    (madeFeasible === 0 && row.qtdePlanejada === 0)
  ) {
    return "pending";
  }

  if (madeFeasible === row.qtdePlanejada) {
    return "equal";
  }

  if (madeFeasible > row.qtdePlanejada) {
    return "greater";
  }

  return "less";
}

export function useReviewStatistics(reviewData: FeasibilityServiceItem[]) {
  return useMemo(() => {
    let pendingCount = 0;
    let changedCount = 0;

    reviewData.forEach((row) => {
      const status = getRowStatus(row);

      if (status === "pending") {
        pendingCount++;
      }

      if (status === "greater" || status === "less") {
        changedCount++;
      }
    });

    return {
      pendingCount,
      changedCount,
    };
  }, [reviewData]);
}
