// ── ChartsSection.tsx ─────────────────────────────────────────────────────────
// Seção de gráficos extraída do monolito.
// ANTES: ~500 linhas de JSX de gráficos misturadas ao render principal.
// DEPOIS: componente focado; cada gráfico é um sub-componente separado.

"use client";

import { useState } from "react";
import {
  Area,
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

import { DashboardMetrics } from "@/types/dashboard/recompositionGoals/goals";
import { FormatCurrency } from "@/utils/formatValue";

import { ChartTooltip } from "../common/ChartTooltip";

interface ChartsSectionProps {
  metrics: DashboardMetrics;
}

const AXIS_TICK_X = { fill: "#94a3b8", fontSize: 14, fontWeight: 500 } as const;
const AXIS_TICK_Y = { fill: "#64748b", fontSize: 14 } as const;
const LEGEND_FORMATTER = (v: string) => (
  <span style={{ color: "#cbd5e1", fontSize: 12 }}>{v}</span>
);
const K_FORMATTER = (v: number) => `${(v / 1000).toFixed(0)}k`;

export function ChartsSection({ metrics }: ChartsSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1 px-5">
        <MonthlyBarChart data={metrics.monthlyTotals} />
        <CurvaSPanel metrics={metrics} />
      </div>
    </>
  );
}

// ── 1. Meta vs Prog vs Real mensal ────────────────────────────────────────────

function MonthlyBarChart({
  data,
}: {
  data: DashboardMetrics["monthlyTotals"];
}) {
  return (
    <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border border-white/5 shadow-xl flex flex-col">
      <h3 className="text-white font-bold text-base mb-5 uppercase tracking-wide shrink-0">
        PROGRAMADO / REALIZADO (MÊS)
      </h3>
      <div className="flex-1 min-h-[280px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
            barGap={1}
          >
            <defs>
              <linearGradient id="gMeta" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#64748b" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
              <linearGradient id="gProg2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#1d4ed8" />
              </linearGradient>
              <linearGradient id="gReal" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#ffffff0a"
              vertical={false}
            />
            <XAxis
              dataKey="mes"
              tick={AXIS_TICK_X}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={AXIS_TICK_Y}
              axisLine={false}
              tickLine={false}
              tickFormatter={K_FORMATTER}
              width={36}
            />
            <Tooltip content={<ChartTooltip metricConfig="number" />} />
            <Legend
              iconType="circle"
              iconSize={9}
              formatter={LEGEND_FORMATTER}
              wrapperStyle={{ paddingTop: 14 }}
            />
            <Line dataKey="Meta" fill="url(#gMeta)" />
            <Bar
              dataKey="Programado"
              fill="url(#gProg2)"
              radius={[4, 4, 0, 0]}
              maxBarSize={10}
            />
            <Bar
              dataKey="Realizado"
              fill="url(#gReal)"
              radius={[4, 4, 0, 0]}
              maxBarSize={10}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ── 2. Curva S + painel de análise ────────────────────────────────────────────

function CurvaSPanel({ metrics }: { metrics: DashboardMetrics }) {
  const [showProjection, setShowProjection] = useState(false);
  const {
    cumulative,
    totalMetaFull,
    naturallyHitsThisYear,
    projectedCrossMonth,
  } = metrics;

  return (
    <div className="flex flex-col gap-3">
      {/* Gráfico */}
      <div
        onClick={() => setShowProjection((v) => !v)}
        className={`bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-5 border shadow-xl cursor-pointer transition-all duration-200 ${showProjection ? "border-[#53FF75]/30" : "border-white/5 hover:border-white/10"}`}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-bold text-base uppercase tracking-wide">
            Acumulado — Curva S
          </h3>
          <div className="flex items-center gap-2">
            {projectedCrossMonth && (
              <span
                className={`text-sm p-2 rounded-full border ${naturallyHitsThisYear ? "bg-[#53FF75]/10 border-[#53FF75]/20 text-[#53FF75]" : "bg-amber-400/10 border-amber-400/20 text-amber-400"}`}
              >
                {naturallyHitsThisYear
                  ? `Meta em ${projectedCrossMonth}`
                  : `Projeção → Dez`}
              </span>
            )}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <ComposedChart
            data={cumulative}
            margin={{ left: 8, right: 16, top: 8, bottom: 0 }}
          >
            <defs>
              <linearGradient id="aMetaAc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#64748b" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#64748b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="aRealAc" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ade80" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#ffffff0a"
              vertical={false}
            />
            <XAxis
              dataKey="mes"
              tick={{ fill: "#94a3b8", fontSize: 14, fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: "#64748b", fontSize: 14 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
              width={36}
            />
            <Tooltip content={<ChartTooltip metricConfig="number" />} />
            <Legend
              iconType="circle"
              iconSize={9}
              formatter={(v) => (
                <span style={{ color: "#cbd5e1", fontSize: 12 }}>{v}</span>
              )}
              wrapperStyle={{ paddingTop: 14 }}
            />
            <ReferenceLine
              y={totalMetaFull}
              stroke={naturallyHitsThisYear ? "#53FF75" : "#fbbf24"}
              strokeDasharray="5 5"
              strokeOpacity={0.7}
              label={{
                value: naturallyHitsThisYear
                  ? `✓ Meta atingida em ${projectedCrossMonth}`
                  : `⚠ Projeção-alvo: Meta em Dez`,
                position: "insideTopRight",
                fill: naturallyHitsThisYear ? "#53FF75" : "#fbbf24",
                fontSize: 12,
                fontWeight: 700,
              }}
            />
            <Area
              type="monotone"
              dataKey="Meta Acum."
              stroke="#94a3b8"
              fill="url(#aMetaAc)"
              strokeWidth={2.5}
              dot={false}
              connectNulls
            />
            <Area
              type="monotone"
              dataKey="Prog+Real Acum."
              stroke="#4ade80"
              fill="url(#aRealAc)"
              strokeWidth={3}
              dot={{ r: 4, fill: "#4ade80", strokeWidth: 0 }}
              connectNulls
            />
            <Line
              type="monotone"
              dataKey="Projeção"
              stroke="#d4e216"
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
