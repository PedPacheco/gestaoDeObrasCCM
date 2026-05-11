import { useMemo } from "react";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartTooltip } from "../common/ChartTooltip";
import {
  META_PCT,
  monthLabel,
  Row,
  sortMes,
} from "./monitoringExecutionDashboard";
import { formatPercentage } from "@/utils/formatValue";

export function MonitoredMonthlyTable({ data }: { data: Row[] }) {
  const byMonth = useMemo(() => {
    const map: Record<string, { total: number; acompanhado: number }> = {};
    data.forEach((r) => {
      if (!map[r.mes]) map[r.mes] = { total: 0, acompanhado: 0 };
      map[r.mes].total += r.total;
      map[r.mes].acompanhado += r.acompanhado;
    });
    return Object.entries(map)
      .sort(([a], [b]) => sortMes(a, b))
      .map(([mes, v]) => ({
        mes: monthLabel(mes),
        total: v.total,
        acompanhado: v.acompanhado,
        naoAcompanhado: v.total - v.acompanhado,
        // pct recalculado aqui para garantir consistência com o agrupamento atual
        pct: v.total > 0 ? Math.round((v.acompanhado / v.total) * 100) : 0,
      }));
  }, [data]);

  return (
    <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-6 border border-white/5 shadow-xl">
      <h3 className="text-white font-bold text-sm mb-5 tracking-wide uppercase">
        Acompanhamento de obras durante execução - Visão EDP
      </h3>
      {byMonth.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-zinc-500 text-sm">
          Nenhum dado encontrado para o período selecionado.
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={320}>
          <ComposedChart
            data={byMonth}
            margin={{ top: 5, right: 40, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
            <XAxis dataKey="mes" tick={{ fill: "#94a3b8", fontSize: 14 }} />
            {/* Eixo esquerdo: contagem absoluta de programações */}
            <YAxis yAxisId="left" tick={{ fill: "#94a3b8", fontSize: 14 }} />
            {/* Eixo direito: percentual 0–100% — domínio fixo para comparar a meta */}
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
              tick={{ fill: "#94a3b8", fontSize: 14 }}
            />
            <Tooltip
              content={
                <ChartTooltip
                  metricConfig="number"
                  percentageFields={["pct"]}
                />
              }
            />
            <Legend
              wrapperStyle={{
                fontSize: 14,
                color: "#94a3b8",
                paddingTop: 12,
              }}
            />
            {/* Linha de referência da meta (30%) — tracejada amarela */}
            <ReferenceLine
              yAxisId="right"
              y={META_PCT}
              stroke="#f59e0b"
              strokeDasharray="6 3"
              label={{
                value: `Meta ${META_PCT}%`,
                fill: "#f59e0b",
                fontSize: 12,
                position: "insideTopRight",
              }}
            />
            {/* Barra inferior (cinza) = não acompanhado */}
            <Bar
              yAxisId="left"
              dataKey="naoAcompanhado"
              name="Não acompanhado"
              stackId="a"
              fill="#6b7280"
            />
            {/* Barra superior (verde) = acompanhado — radius arredonda o topo da barra empilhada */}
            <Bar
              yAxisId="left"
              dataKey="acompanhado"
              name="Acompanhado"
              stackId="a"
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            />
            {/* Linha azul de percentual — usa eixo direito */}
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="pct"
              name="% Acompanhado"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ fill: "#3b82f6", r: 4 }}
              activeDot={{ r: 6 }}
              label={{
                position: "top",
                fill: "#e5e7eb",
                fontSize: 12,
                offset: 20,
                formatter: (value) => `${value}%`,
              }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
