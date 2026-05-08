"use client";

import { useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";
import ForecastDashboard from "./ForecastDashboard";
import MetasRecomposicaoDashboard from "./MetasRecomposicaoDashboard";
import AcompanhamentoExecucaoDashboard from "./AcompanhamentoExecucaoDashboard";
import AvancaParceiroDashboard from "./AvancaParceiroDashboard";

import { ChartTooltip } from "./common/ChartTooltip";
import { KpiCard } from "./common/KpiCard";
import LaborDashboard from "./laborDashboard/LaborDashboard";
import { ChartCard } from "./common/ChartCard";
import RecompositionGoalsDashboard from "./recompositionGoalsDashboard/RecompositionGoalsDashboard";

// Status-to-color mapping per business rules
const STATUS_COLORS: Record<string, string> = {
  SUSPENSA: "#f1f5f9",
  PROGRAMADO: "#14532d",
  REPROGRAMAR: "#f97316",
  EXECUTADA: "#53FF75",
  "AGUARDANDO PROGRAMAÇÃO": "#3b82f6",
  "AGUARDANDO VALIDAÇÃO EDP": "#475569",
  "EM PROGRAMAÇÃO": "#06b6d4",
  "EM EMPREITAMENTO": "#a78bfa",
  CANCELADA: "#ef4444",
};

// Fallback palette for unknown statuses
const FALLBACK_COLORS = [
  "#53FF75",
  "#3b82f6",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#f97316",
  "#ec4899",
  "#14b8a6",
];

function getStatusColor(status: string, index: number): string {
  const upper = status?.toUpperCase().trim() ?? "";
  for (const [key, color] of Object.entries(STATUS_COLORS)) {
    if (upper.includes(key.toUpperCase())) return color;
  }
  return FALLBACK_COLORS[index % FALLBACK_COLORS.length];
}

// Formats "YYYY-MM" → "MMM/YY"
function formatMonth(m: string) {
  const [year, month] = m.split("-");
  const months = [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ];
  return `${months[parseInt(month) - 1]}/${year.slice(2)}`;
}

interface Kpis {
  total: number;
  concludedThisMonth: number;
  totalConcluded: number;
  withoutSchedule: number;
  executionRate: number;
}
interface ByStatus {
  status: string;
  count: number;
}
interface ByRegional {
  regional: string;
  total: number;
  concluded: number;
}
interface Trend {
  month: string;
  entered: number;
  concluded: number;
}
interface TopPartner {
  partner: string;
  total: number;
}
interface RecentWork {
  ovnota: string;
  status: string;
  partner: string;
  municipio: string;
  executado: number | null;
  entrada: string;
}

interface Props {
  kpis: Kpis;
  byStatus: ByStatus[];
  byRegional: ByRegional[];
  trend: Trend[];
  topPartners: TopPartner[];
  partnerDetails: Record<string, { status: string; count: number }[]>;
  recentWorks: RecentWork[];
  // Resumo Mensal — Mão de Obra
  token: string;
  initialMaodeObra: any[];
  initialMaodeObra2: any[];
  initialMetaDiaria: number;
  // Resumo Mensal — Forecast
  initialForecastFirst: any;
  initialForecastSecond: any;
  // Metas Recomposição
  initialMetasRecomposicao: any[];
  goalsFilters: any;
  // Acompanhamento da Execução
  initialExecMonitoring: any[];
  // Avança Parceiro
  initialEliminacaoRestricao: any[];
  initialAderenciaParceira: any[];
  filtersData: any;
}

// KPI card with gradient background and accent bar

// Chart card wrapper with consistent dark glass styling

type Tab = "geral" | "mao-de-obra" | "forecast" | "metas-recomposicao" | "acompanhamento-execucao" | "avanca-parceiro";

export default function DashboardClient({
  kpis,
  byStatus,
  byRegional,
  trend,
  topPartners,
  recentWorks,
  token,
  initialMaodeObra,
  initialMaodeObra2,
  initialMetaDiaria,
  initialForecastFirst,
  initialForecastSecond,
  initialMetasRecomposicao,
  goalsFilters,
  initialExecMonitoring,
  initialEliminacaoRestricao,
  initialAderenciaParceira,
  filtersData,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("geral");
  const trendFormatted = trend.map((t) => ({
    ...t,
    month: formatMonth(t.month),
  }));

  return (
    <div className="flex flex-col min-h-full ">
      {/* ── Tab Switcher ──────────────────────────────────────────── */}
      <div className="flex gap-1 px-6 pt-5 pb-0 border-b border-white/5">
        {([
          { key: "geral",                   label: "Visão Geral" },
          { key: "mao-de-obra",             label: "Resumo Mensal — Mão de Obra Parceira" },
          { key: "forecast",                label: "Resumo Mensal — Forecast" },
          { key: "metas-recomposicao",      label: "Metas Recomposição" },
          { key: "acompanhamento-execucao", label: "Acompanhamento da Execução" },
          { key: "avanca-parceiro",         label: "Avança parceiro" },
        ] as { key: Tab; label: string }[]).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-2.5 text-sm font-semibold tracking-wide rounded-t-xl transition-all duration-200 ${
              activeTab === key
                ? "bg-gradient-to-br from-[#1e2f42] to-[#192535] text-white border border-b-0 border-white/10 shadow-lg"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab Content ───────────────────────────────────────────── */}
      {activeTab === "mao-de-obra" ? (
        <LaborDashboard
          initialData={initialMaodeObra}
          initialData2={initialMaodeObra2}
          token={token}
          initialMetaDiaria={initialMetaDiaria}
          filtersData={filtersData}
        />
      ) : activeTab === "forecast" ? (
        <ForecastDashboard
          initialFirst={initialForecastFirst}
          initialSecond={initialForecastSecond}
          token={token}
        />
      ) : activeTab === "metas-recomposicao" ? (
        <RecompositionGoalsDashboard
          initialGoals={initialMetasRecomposicao}
          filtersData={goalsFilters}
          token={token}
        />
      ) : activeTab === "acompanhamento-execucao" ? (
        <AcompanhamentoExecucaoDashboard
          initialData={initialExecMonitoring}
          filtersData={goalsFilters}
          token={token}
        />
      ) : activeTab === "avanca-parceiro" ? (
        <AvancaParceiroDashboard
          initialEliminacao={initialEliminacaoRestricao}
          initialAderencia={initialAderenciaParceira}
          filtersData={goalsFilters}
          token={token}
        />
      ) : (
        <div className="flex flex-col gap-6 p-6">
          {/* ── KPI Cards ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
            <KpiCard
              label="Total de obras"
              value={kpis.total.toLocaleString("pt-BR")}
              gradient="bg-gradient-to-br from-[#0f2744] to-[#1e3a5f]"
              accent="#3b82f6"
            />
            <KpiCard
              label="Concluídas no mês"
              value={kpis.concludedThisMonth.toLocaleString("pt-BR")}
              gradient="bg-gradient-to-br from-[#052e16] to-[#14532d]"
              accent="#53FF75"
            />
            <KpiCard
              label="Total concluídas"
              value={kpis.totalConcluded.toLocaleString("pt-BR")}
              gradient="bg-gradient-to-br from-[#431407] to-[#7c2d12]"
              accent="#f97316"
            />
            <KpiCard
              label="Sem programação"
              value={kpis.withoutSchedule.toLocaleString("pt-BR")}
              gradient="bg-gradient-to-br from-[#3b0764] to-[#4c1d95]"
              accent="#a78bfa"
            />
          </div>

          {/* ── Row 2: Status Donut + Regional Bar ────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Distribuição por Status">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <defs>
                    {byStatus.map((entry, i) => (
                      <linearGradient
                        key={i}
                        id={`statusGrad${i}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="1"
                      >
                        <stop
                          offset="0%"
                          stopColor={getStatusColor(entry.status, i)}
                          stopOpacity={1}
                        />
                        <stop
                          offset="100%"
                          stopColor={getStatusColor(entry.status, i)}
                          stopOpacity={0.75}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <Pie
                    data={byStatus}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={68}
                    outerRadius={108}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {byStatus.map((_entry, i) => (
                      <Cell key={i} fill={`url(#statusGrad${i})`} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconType="circle"
                    iconSize={7}
                    formatter={(v) => (
                      <span className="text-zinc-400 text-[11px]">{v}</span>
                    )}
                    wrapperStyle={{ paddingTop: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Obras por Regional">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart
                  data={byRegional}
                  layout="vertical"
                  margin={{ left: 0, right: 20, top: 4, bottom: 4 }}
                  barGap={4}
                >
                  <defs>
                    <linearGradient id="gradTotal" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#1d4ed8" />
                      <stop offset="100%" stopColor="#3b82f6" />
                    </linearGradient>
                    <linearGradient
                      id="gradConcluded"
                      x1="0"
                      y1="0"
                      x2="1"
                      y2="0"
                    >
                      <stop offset="0%" stopColor="#16a34a" />
                      <stop offset="100%" stopColor="#53FF75" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff08"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="regional"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    width={88}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Legend
                    iconType="square"
                    iconSize={8}
                    formatter={(v) => (
                      <span className="text-zinc-400 text-[11px]">{v}</span>
                    )}
                    wrapperStyle={{ paddingTop: "12px" }}
                  />
                  <Bar
                    dataKey="total"
                    name="Total"
                    fill="url(#gradTotal)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={14}
                  />
                  <Bar
                    dataKey="concluded"
                    name="Concluídas"
                    fill="url(#gradConcluded)"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={14}
                  />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* ── Row 3: Trend Area (full width) ────────────────────────── */}
          <ChartCard title="Tendência — Entradas vs Conclusões (últimos 6 meses)">
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart
                data={trendFormatted}
                margin={{ left: 0, right: 20, top: 8, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="areaEntered" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient
                    id="areaConcluded"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop offset="0%" stopColor="#53FF75" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#53FF75" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff08" />
                <XAxis
                  dataKey="month"
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#64748b", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Legend
                  iconType="circle"
                  iconSize={7}
                  formatter={(v) => (
                    <span className="text-zinc-400 text-[11px]">{v}</span>
                  )}
                  wrapperStyle={{ paddingTop: "12px" }}
                />
                <Area
                  type="monotone"
                  dataKey="entered"
                  name="Entradas"
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  fill="url(#areaEntered)"
                  dot={{ r: 4, fill: "#3b82f6", strokeWidth: 0 }}
                  activeDot={{
                    r: 6,
                    fill: "#3b82f6",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="concluded"
                  name="Concluídas"
                  stroke="#53FF75"
                  strokeWidth={2.5}
                  fill="url(#areaConcluded)"
                  dot={{ r: 4, fill: "#53FF75", strokeWidth: 0 }}
                  activeDot={{
                    r: 6,
                    fill: "#53FF75",
                    stroke: "#fff",
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>

          {/* ── Row 4: Top Partners + Recent Works ────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <ChartCard title="Top 5 Parceiras">
              <ResponsiveContainer width="100%" height={230}>
                <BarChart
                  data={topPartners}
                  layout="vertical"
                  margin={{ left: 0, right: 20, top: 4, bottom: 4 }}
                >
                  <defs>
                    {topPartners.map((_p, i) => (
                      <linearGradient
                        key={i}
                        id={`partnerGrad${i}`}
                        x1="0"
                        y1="0"
                        x2="1"
                        y2="0"
                      >
                        <stop
                          offset="0%"
                          stopColor={
                            FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                          }
                          stopOpacity={0.7}
                        />
                        <stop
                          offset="100%"
                          stopColor={
                            FALLBACK_COLORS[i % FALLBACK_COLORS.length]
                          }
                          stopOpacity={1}
                        />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#ffffff08"
                    horizontal={false}
                  />
                  <XAxis
                    type="number"
                    tick={{ fill: "#64748b", fontSize: 10 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="partner"
                    tick={{ fill: "#94a3b8", fontSize: 11 }}
                    width={100}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Bar
                    dataKey="total"
                    name="Obras"
                    radius={[0, 6, 6, 0]}
                    maxBarSize={16}
                  >
                    {topPartners.map((_, i) => (
                      <Cell key={i} fill={`url(#partnerGrad${i})`} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Recent works table */}
            <div className="bg-gradient-to-br from-[#1e2f42] to-[#192535] rounded-2xl p-6 border border-white/5 shadow-xl flex flex-col">
              <h3 className="text-white font-bold text-sm mb-5 tracking-wide uppercase">
                Últimas Obras Registradas
              </h3>
              <div className="overflow-x-auto flex-1">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left pb-3 pr-3 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                        Nota
                      </th>
                      <th className="text-left pb-3 pr-3 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                        Status
                      </th>
                      <th className="text-left pb-3 pr-3 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                        Parceira
                      </th>
                      <th className="text-left pb-3 pr-3 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                        Município
                      </th>
                      <th className="text-right pb-3 text-zinc-500 font-semibold uppercase tracking-wider text-[10px]">
                        Exec.
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentWorks.map((w, i) => (
                      <tr
                        key={i}
                        className="border-b border-white/[0.03] hover:bg-white/5 transition-colors cursor-pointer group"
                        onClick={() =>
                          window.open(`/detalhes/${w.ovnota}`, "_blank")
                        }
                      >
                        <td className="py-2.5 pr-3 font-bold text-[#53FF75] group-hover:text-white transition-colors">
                          {w.ovnota}
                        </td>
                        <td className="py-2.5 pr-3 text-zinc-400 truncate max-w-[110px]">
                          {w.status}
                        </td>
                        <td className="py-2.5 pr-3 text-zinc-400 truncate max-w-[90px]">
                          {w.partner}
                        </td>
                        <td className="py-2.5 pr-3 text-zinc-400 truncate max-w-[90px]">
                          {w.municipio}
                        </td>
                        <td className="py-2.5 text-right">
                          {w.executado != null ? (
                            <span
                              className="font-bold px-2 py-0.5 rounded-full text-[10px]"
                              style={{
                                background:
                                  w.executado >= 80
                                    ? "#053715"
                                    : w.executado >= 40
                                      ? "#431407"
                                      : "#1e1b4b",
                                color:
                                  w.executado >= 80
                                    ? "#53FF75"
                                    : w.executado >= 40
                                      ? "#f97316"
                                      : "#818cf8",
                              }}
                            >
                              {w.executado}%
                            </span>
                          ) : (
                            <span className="text-zinc-700">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
