"use client";

import { useState } from "react";

import ForecastDashboard from "./ForecastDashboard";
import AvancaParceiroDashboard from "./AvancaParceiroDashboard";

import MonitoringExecutionDashboard from "./monitoringExecutionDashboard/monitoringExecutionDashboard";
import RecompositionGoalsDashboard from "./recompositionGoalsDashboard/RecompositionGoalsDashboard";
import LaborDashboard from "./laborDashboard/laborDashboard";

// Formats "YYYY-MM" → "MMM/YY"

export interface Kpis {
  total: number;
  concludedThisMonth: number;
  portfoliototal: number;
  valueExecutedTotal: number;
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

export interface DataDashboardInterface {
  kpis: Kpis;
  byStatus: ByStatus[];
  byRegional: ByRegional[];
  trend: Trend[];
  topPartners: TopPartner[];
  partnerDetails: Record<string, { status: string; count: number }[]>;
  recentWorks: RecentWork[];
}

interface Props {
  // dataDashboard: DataDashboardInterface;
  // Resumo Mensal — Mão de Obra
  token: string;
  initialMaodeObra: any;
  initialMaodeObra2: any;
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

type Tab =
  | "geral"
  | "mao-de-obra"
  | "forecast"
  | "metas-recomposicao"
  | "acompanhamento-execucao"
  | "avanca-parceiro";

export default function DashboardClient({
  // dataDashboard,
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
  const [activeTab, setActiveTab] = useState<Tab>("mao-de-obra");

  return (
    <div className="flex flex-col min-h-full ">
      {/* ── Tab Switcher ──────────────────────────────────────────── */}
      <div className="flex gap-1 px-6 pt-5 pb-0 border-b border-white/5">
        {(
          [
            // { key: "geral", label: "Visão Geral" },
            {
              key: "mao-de-obra",
              label: "Resumo — Mão de Obra Parceira",
            },
            // { key: "forecast", label: "Resumo Mensal — Forecast" },
            { key: "metas-recomposicao", label: "Metas Recomposição" },
            {
              key: "acompanhamento-execucao",
              label: "Acompanhamento da Execução",
            },
            // { key: "avanca-parceiro", label: "Avança parceiro" },
          ] as { key: Tab; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`px-5 py-2.5 text-base font-semibold tracking-wide rounded-t-xl transition-all duration-200 ${
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
      {activeTab === "metas-recomposicao" ? (
        <RecompositionGoalsDashboard
          initialGoals={initialMetasRecomposicao}
          filtersData={goalsFilters}
          token={token}
        />
      ) : activeTab === "acompanhamento-execucao" ? (
        <MonitoringExecutionDashboard
          initialData={initialExecMonitoring}
          filtersData={goalsFilters}
          token={token}
        />
      ) : (
        <LaborDashboard
          initialData={initialMaodeObra}
          initialData2={initialMaodeObra2}
          token={token}
          initialMetaDiaria={initialMetaDiaria}
          filtersData={filtersData}
        />
      )}
    </div>
  );
}
