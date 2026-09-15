import { useMemo } from "react";
import { KpiCard } from "../common/KpiCard";
import { Row } from "./monitoringExecutionDashboard";
import { formatPercentage } from "@/utils/formatValue";
import { EXCLUDE_PARCEIRAS } from "../DashboardClient";

export function KpiSectionMonitoringExecution({ data }: { data: Row[] }) {
  const totals = useMemo(() => {
    const total = data.reduce((s, r) => s + r.total, 0);
    const acomp = data.reduce((s, r) => s + r.acompanhado, 0);
    return {
      total,
      acomp,
      pct: total > 0 ? Math.round((acomp / total) * 100) : 0,
    };
  }, [data]);

  return (
    <div className="grid grid-cols-3 gap-4 px-5">
      {[
        {
          label: "Total Obras",
          value: totals.total,
          gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
          accent: "#60a5fa",
        },
        {
          label: "Acompanhadas",
          value: totals.acomp,
          gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
          accent: "#38bdf8",
        },
        {
          label: "% Acompanhado",
          value: formatPercentage(totals.pct),
          gradient: "bg-gradient-to-br from-[#182638] to-[#1c2f42]",
          accent: "#38bdf8",
        },
      ].map((item, index) => {
        const { label, value, gradient, accent } = item;

        if (!label || !value || !gradient || !accent) {
          return;
        }

        return (
          <KpiCard
            accent={accent}
            gradient={gradient}
            label={label}
            value={value}
            key={index}
          />
        );
      })}
    </div>
  );
}
