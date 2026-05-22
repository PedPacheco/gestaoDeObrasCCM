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
import { MotivoRow, MotivoTab } from "./advancePartner";

interface ChartReasonsReaschedulingProps {
  motivos: MotivoRow[];
  motivoTab: MotivoTab;
  setMotivoTab: (data: MotivoTab) => void;
  isPending: boolean;
}

export function ChartReasonsReascheduling({
  motivos,
  motivoTab,
  setMotivoTab,
  isPending,
}: ChartReasonsReaschedulingProps) {
  const filteredReasons =
    motivoTab === "GERAL"
      ? motivos
      : motivos.filter(
          (m) => (m.responsavel ?? "").toUpperCase().trim() === motivoTab,
        );

  const motivosChartData = useMemo(() => {
    if (!filteredReasons) return [];

    const counts: Record<string, number> = {};

    filteredReasons.forEach((m) => {
      const k = (m.motivo || "Sem motivo informado").toUpperCase().trim();
      counts[k] = (counts[k] || 0) + 1;
    });

    const total = filteredReasons.length;

    return Object.entries(counts)
      .map(([motivo, count]) => ({
        motivo,
        count,
        pct: total > 0 ? Math.round((count / total) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 12);
  }, [filteredReasons]);

  return (
    <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-white font-bold text-sm tracking-wide uppercase">
            Motivos de Reprogramação
          </h3>
          <p className="text-zinc-500 text-xs mt-0.5">
            Top ocorrências por motivo
            {filteredReasons
              ? ` — ${filteredReasons.length} registro${filteredReasons.length !== 1 ? "s" : ""}`
              : ""}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Tabs responsabilidade */}
          <div className="flex rounded-lg overflow-hidden border border-white/10">
            {(["GERAL", "EDP", "PARCEIRA", "TERCEIRO"] as MotivoTab[]).map(
              (t) => (
                <button
                  key={t}
                  onClick={() => setMotivoTab(t)}
                  className={`px-3 py-1.5 text-xs font-bold transition-colors ${motivoTab === t ? "bg-[#1d4ed8] text-white" : "bg-[#0f1e2e] text-zinc-400 hover:text-white"}`}
                >
                  {t}
                </button>
              ),
            )}
          </div>
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
                fontSize: 9,
                angle: -45,
                textAnchor: "end",
              }}
              tickFormatter={(v: string) =>
                v.length > 28 ? v.slice(0, 28) + "…" : v
              }
              interval={0}
              height={110}
            />
            <YAxis
              type="number"
              tick={{ fill: "#94a3b8", fontSize: 11 }}
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
                fontSize: 10,
                formatter: (v: any) => `${v}%`,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
