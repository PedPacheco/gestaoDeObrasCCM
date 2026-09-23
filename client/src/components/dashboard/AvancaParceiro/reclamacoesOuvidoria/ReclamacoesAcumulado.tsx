"use client";

import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/dashboard/common/ChartCard";
import { ExecutionTooltip } from "@/components/entryComponents/edpExecution/ExecutionTooltip";
import { EmpreiteiraTrend, MonthAcumulado } from "@/utils/reclamacoesOuvidoria/metrics";
import { NUM } from "@/utils/formatValue";

const BLUE = "#3b82f6";
const CYAN = "#38bdf8";
const GRAY = "#64748b";
const RED = "#ef4444";

const AXIS_TICK = { fill: "#94a3b8", fontSize: 11 };

export function ReclamacoesAcumuladoChart({ data }: { data: MonthAcumulado[] }) {
  return (
    <ChartCard title="Acumulado" className="xl:col-span-2">
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-[300px] text-zinc-500 text-sm">
          Importe a planilha para ver a evolução mensal.
        </div>
      ) : (
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              barGap={2}
              barCategoryGap="12%"
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" vertical={false} />
              <XAxis dataKey="label" tick={AXIS_TICK} />
              <YAxis tick={AXIS_TICK} width={36} />
              <Tooltip cursor={{ fill: "#ffffff08" }} content={<ExecutionTooltip formatter={(v) => NUM(v)} />} />
              <Legend formatter={(value) => <span className="text-zinc-300 text-xs">{value}</span>} />
              <Bar dataKey="Entradas" name="Entradas de Notas" fill={BLUE} maxBarSize={26} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Encerradas" name="Total Encerradas" fill={CYAN} maxBarSize={26} radius={[3, 3, 0, 0]} />
              <Bar dataKey="Passivos" name="Passivos" fill={GRAY} maxBarSize={26} radius={[3, 3, 0, 0]} />
              <Line
                type="monotone"
                dataKey="ForaPrazo"
                name="Fora do Prazo"
                stroke={RED}
                strokeWidth={2}
                dot={{ r: 3, fill: RED }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </ChartCard>
  );
}

function MiniTrendChart({ trend }: { trend: EmpreiteiraTrend }) {
  return (
    <div className="bg-gradient-to-br from-[#1a2d42] to-[#182333] rounded-2xl p-4 border border-white/8 shadow-xl">
      <span className="text-white font-bold text-xs uppercase tracking-wide">{trend.empreiteira}</span>
      <div className="h-[150px] mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={trend.data} margin={{ top: 6, right: 4, left: -20, bottom: 0 }}>
            <XAxis dataKey="label" tick={{ fill: "#94a3b8", fontSize: 9 }} interval={0} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 9 }} width={24} />
            <Tooltip cursor={{ fill: "#ffffff08" }} content={<ExecutionTooltip formatter={(v) => NUM(v)} />} />
            <Bar dataKey="Entradas" name="Entradas" fill={BLUE} maxBarSize={16} radius={[2, 2, 0, 0]} />
            <Line type="monotone" dataKey="ForaPrazo" name="FP" stroke={RED} strokeWidth={2} dot={{ r: 2, fill: RED }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export function ReclamacoesEmpreiteiraTrends({ trends }: { trends: EmpreiteiraTrend[] }) {
  if (trends.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
      {trends.map((trend) => (
        <MiniTrendChart key={trend.empreiteira} trend={trend} />
      ))}
    </div>
  );
}
