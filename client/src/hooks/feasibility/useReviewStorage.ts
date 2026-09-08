import { FeasibilityServiceItem } from "@/components/feasibility/feasbilityServices/feasibilityServicesReviewStep";
import { useEffect, useRef } from "react";

export function getStorageKey(workId: number) {
  return `feasibility-services-review-${workId}`;
}

export function useReviewStorage(
  workId: number,
  reviewData: FeasibilityServiceItem[],
  onRestore: (data: FeasibilityServiceItem[]) => void,
) {
  const restoredRef = useRef<number | null>(null);

  useEffect(() => {
    if (!reviewData.length) return;

    if (restoredRef.current === workId) {
      return;
    }

    const raw = localStorage.getItem(getStorageKey(workId));

    if (!raw) {
      restoredRef.current = workId;
      return;
    }

    const stored = JSON.parse(raw) as Record<number, string | null>;

    console.log(stored);

    const restored = reviewData.map((item) => ({
      ...item,
      viabilizado: stored[item.id] ?? item.viabilizado,
    }));

    restoredRef.current = workId;

    onRestore(restored);
  }, [reviewData.length, workId]);

  const saveData = (data: FeasibilityServiceItem[]) => {
    const storage = data.reduce<Record<number, string | null>>((acc, item) => {
      acc[item.id] = item.viabilizado;

      return acc;
    }, {});

    localStorage.setItem(getStorageKey(workId), JSON.stringify(storage));
  };

  const clearStorage = () => {
    localStorage.removeItem(getStorageKey(workId));
  };

  const removeItem = (id: number) => {
    const current = JSON.parse(
      localStorage.getItem(getStorageKey(workId)) || "{}",
    );

    delete current[id];

    localStorage.setItem(getStorageKey(workId), JSON.stringify(current));
  };

  return {
    saveData,
    clearStorage,
    removeItem,
  };
}
