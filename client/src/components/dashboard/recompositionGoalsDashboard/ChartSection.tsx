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

const AXIS_TICK_X = { fill: "#94a3b8", fontSize: 12, fontWeight: 500 } as const;
const AXIS_TICK_Y = { fill: "#64748b", fontSize: 11 } as const;
const LEGEND_FORMATTER = (v: string) => (
  <span style={{ color: "#cbd5e1", fontSize: 12 }}>{v}</span>
);
const K_FORMATTER = (v: number) => `${(v / 1000).toFixed(0)}k`;

export function ChartsSection({ metrics }: ChartsSectionProps) {
  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-1">
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
            <Tooltip content={<ChartTooltip />} />
            <Legend
              iconType="circle"
              iconSize={9}
              formatter={LEGEND_FORMATTER}
              wrapperStyle={{ paddingTop: 14 }}
            />
            <Bar
              dataKey="Meta"
              fill="url(#gMeta)"
              radius={[4, 4, 0, 0]}
              maxBarSize={10}
            />
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
    cumulativeDataAtCutoff,
    avgMonthlyRate,
    remaining,
    rateNeededForDec,
    projByDec,
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
            <span className="text-zinc-300 text-sm bg-white/5 p-2 rounded-full">
              {showProjection ? "Fechar ▲" : "Análise ▼"}
            </span>
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
              tick={AXIS_TICK_X}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={AXIS_TICK_Y}
              axisLine={false}
              tickLine={false}
              tickFormatter={K_FORMATTER}
              domain={[0, "dataMax"]}
              width={36}
            />
            <Tooltip content={<ChartTooltip />} />
            <Legend
              iconType="circle"
              iconSize={9}
              formatter={LEGEND_FORMATTER}
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
                fontSize: 11,
                fontWeight: 700,
              }}
            />
            <Area
              type="monotone"
              dataKey="Meta Acum."
              stroke="#94a3b8" // slate-400
              fill="url(#aMetaAc)"
              strokeWidth={2.5}
              dot={false}
              connectNulls
            />

            <Area
              type="monotone"
              dataKey="Prog Acum."
              stroke="#3b82f6" // 🔵 azul (programado)
              fill="transparent"
              strokeWidth={3}
              dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
              connectNulls
            />

            <Area
              type="monotone"
              dataKey="Prog+Real Acum."
              stroke="#4ade80" // 🟢 verde principal (já usado)
              fill="url(#aRealAc)"
              strokeWidth={3}
              dot={{ r: 4, fill: "#4ade80", strokeWidth: 0 }}
              connectNulls
            />

            <Area
              type="monotone"
              dataKey="Diferença Acum."
              stroke="#16a34a" // 🟢 verde mais escuro (real puro)
              fill="transparent"
              strokeWidth={3}
              dot={{ r: 4, fill: "#16a34a", strokeWidth: 0 }}
              connectNulls
            />

            <Line
              type="monotone"
              dataKey="Projeção"
              stroke="#d4e216" // 🟡 projeção
              strokeWidth={2.5}
              strokeDasharray="6 3"
              dot={false}
              connectNulls
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Painel de análise */}
      <div
        className="overflow-hidden transition-all duration-400 ease-in-out"
        style={{
          maxHeight: showProjection ? "400px" : "0px",
          opacity: showProjection ? 1 : 0,
        }}
      >
        <ProjectionPanel
          cumRealNow={cumulativeDataAtCutoff}
          totalMetaFull={totalMetaFull}
          avgMonthlyRate={avgMonthlyRate}
          remaining={remaining}
          rateNeededForDec={rateNeededForDec}
          projByDec={projByDec}
          naturallyHitsThisYear={naturallyHitsThisYear}
          projectedCrossMonth={projectedCrossMonth}
        />
      </div>
    </div>
  );
}

// ── Painel de análise de projeção ─────────────────────────────────────────────

interface ProjectionPanelProps {
  cumRealNow: number;
  totalMetaFull: number;
  avgMonthlyRate: number;
  remaining: number;
  rateNeededForDec: number;
  projByDec: number;
  naturallyHitsThisYear: boolean;
  projectedCrossMonth: string | null;
}

function ProjectionPanel({
  cumRealNow,
  totalMetaFull,
  avgMonthlyRate,
  remaining,
  rateNeededForDec,
  projByDec,
  naturallyHitsThisYear,
  projectedCrossMonth,
}: ProjectionPanelProps) {
  const stats = [
    {
      label: "Prog+Real acumulado",
      value: FormatCurrency(cumRealNow),
      color: "#4ade80",
    },
    {
      label: "Meta total do ano",
      value: FormatCurrency(totalMetaFull),
      color: "#94a3b8",
    },
    {
      label: "Diferença acumulada",
      value: FormatCurrency(cumRealNow - totalMetaFull),
      color: cumRealNow >= totalMetaFull ? "#53FF75" : "#f97316",
    },
    {
      label: "Ritmo atual / mês",
      value: Math.round(avgMonthlyRate),
      color: "#3b82f6",
    },
    {
      label: "Ritmo necessário / mês",
      value: Math.round(rateNeededForDec),
      color: naturallyHitsThisYear ? "#53FF75" : "#a78bfa",
    },
    {
      label: "Projeção em Dez",
      value: projByDec,
      color: projByDec >= totalMetaFull ? "#53FF75" : "#f97316",
    },
  ];

  return (
    <div className="bg-gradient-to-br from-[#0f1e2e] to-[#0c1824] rounded-2xl border border-[#53FF75]/15 p-5 shadow-xl">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#53FF75] animate-pulse" />
        <span className="text-white font-bold text-sm uppercase tracking-wide">
          Análise de Projeção
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {stats.map(({ label, value, color }) => (
          <div
            key={label}
            className="bg-white/5 rounded-xl p-3 flex flex-col gap-1"
          >
            <span className="text-zinc-500 text-[10px] uppercase tracking-wider">
              {label}
            </span>
            <span className="font-black text-lg leading-none" style={{ color }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      {/* Mensagem de status */}
      <div
        className={`rounded-xl p-3 border flex items-center gap-3 ${naturallyHitsThisYear ? "bg-[#053715]/60 border-[#53FF75]/20" : "bg-[#1e1b4b]/60 border-[#818cf8]/20"}`}
      >
        <StatusIcon hit={naturallyHitsThisYear} />
        <div>
          {avgMonthlyRate === 0 ? (
            <>
              <p className="text-zinc-400 font-bold text-sm">
                Sem dados de execução registrados
              </p>
              <p className="text-zinc-500 text-xs">
                Nenhum Prog+Real encontrado nos meses atuais
              </p>
            </>
          ) : naturallyHitsThisYear ? (
            <>
              <p className="text-[#53FF75] font-bold text-sm">
                No ritmo atual a meta é atingida em{" "}
                {projectedCrossMonth ?? "Dez"}
              </p>
              <p className="text-zinc-400 text-xs">
                Ritmo atual ({FormatCurrency(Math.round(avgMonthlyRate))}/mês) é
                suficiente para fechar a meta no ano
              </p>
            </>
          ) : (
            <>
              <p className="text-[#818cf8] font-bold text-sm">
                Projeção-alvo: meta em Dez com ritmo de{" "}
                {FormatCurrency(Math.round(rateNeededForDec))}/mês
              </p>
              <p className="text-zinc-400 text-xs">
                Ritmo atual {FormatCurrency(Math.round(avgMonthlyRate))}/mês →
                faltam {FormatCurrency(Math.round(remaining))} para a meta.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusIcon({ hit }: { hit: boolean }) {
  return (
    <div
      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${hit ? "bg-[#53FF75]/20" : "bg-[#818cf8]/20"}`}
    >
      {hit ? (
        <svg
          className="w-4 h-4 text-[#53FF75]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ) : (
        <svg
          className="w-4 h-4 text-[#818cf8]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
          />
        </svg>
      )}
    </div>
  );
}
