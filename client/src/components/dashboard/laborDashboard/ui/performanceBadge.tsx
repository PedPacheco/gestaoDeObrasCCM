import { memo } from "react";

interface PerformanceBadgeProps {
  value: number;
}

export const PerformanceBadge = memo(function PerformanceBadge({
  value,
}: PerformanceBadgeProps) {
  const variant =
    value >= 100
      ? "bg-green-100 text-green-800"
      : value >= 80
        ? "bg-blue-100 text-blue-800"
        : value >= 60
          ? "bg-yellow-100 text-yellow-800"
          : "bg-red-100 text-red-800";

  return (
    <span
      className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${variant}`}
    >
      {value?.toFixed(1)}%
    </span>
  );
});
