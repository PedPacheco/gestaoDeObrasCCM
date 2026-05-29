import {
  Bar,
  CartesianGrid,
  ComposedChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useMemo } from "react";
import { ChartTooltip } from "../common/ChartTooltip";
import { MotivoRow } from "./advancePartner";
import { MotivoTab } from "@/hooks/dashboard/advancePartner/useAdvancePartnerFilters";

interface ChartReasonsReaschedulingProps {
  motivos: MotivoRow[];
  motivoTab: MotivoTab;
  setMotivoTab: (data: MotivoTab) => void;
  isPending: boolean;
}

export function ChartReasonsReascheduling({
  motivos,
  isPending,
}: ChartReasonsReaschedulingProps) {
  const motivosChartData = useMemo(() => {
    const counts: Record<
      string,
      {
        count: number;
        moNaoExecutada: number;
      }
    > = {};

    motivos.forEach((m) => {
      const k = (m.motivo || "Sem motivo informado").toUpperCase().trim();

      if (!counts[k]) {
        counts[k] = {
          count: 0,
          moNaoExecutada: 0,
        };
      }

      counts[k].count += 1;
      counts[k].moNaoExecutada += Number(m.mo_nao_executada ?? 0);
    });

    return Object.entries(counts)
      .map(([motivo, data]) => ({
        motivo,
        count: data.count,
        moNaoExecutada: data.moNaoExecutada,
        pct:
          motivos.length > 0
            ? Math.round((data.count / motivos.length) * 100)
            : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [motivos]);

  return (
    <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold text-sm tracking-wide uppercase">
            Motivos de Reprogramação
          </h3>
          <p className="text-zinc-500 text-xs mt-0.5">
            Top ocorrências por motivo
            {` — ${motivos.length} registros`}
          </p>
        </div>
      </div>

      {isPending ? (
        <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
          Carregando…
        </div>
      ) : motivosChartData.length === 0 ? (
        <div className="flex items-center justify-center h-32 text-zinc-500 text-sm">
          Nenhum motivo de reprogramação para o período e filtro selecionados.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={380}>
          <ComposedChart
            data={motivosChartData}
            margin={{ top: 20, right: 10, left: 10, bottom: 5 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#ffffff08"
              vertical={false}
            />
            <XAxis
              type="category"
              dataKey="motivo"
              tick={{
                fill: "#94a3b8",
                fontSize: 11,
                angle: -25,
                textAnchor: "end",
              }}
              tickFormatter={(v: string) =>
                v.length > 20 ? v.slice(0, 20) + "…" : v
              }
              interval={0}
              height={110}
            />
            <YAxis
              type="number"
              tick={{ fill: "#94a3b8", fontSize: 10 }}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip content={<ChartTooltip percentageFields={"pct"} />} />
            <Bar
              dataKey={"pct"}
              name={"% do total"}
              fill="#1d4ed8"
              radius={[4, 4, 0, 0]}
              maxBarSize={72}
              label={{
                position: "top",
                fill: "#94a3b8",
                fontSize: 14,
                formatter: (v: any) => `${v}%`,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
