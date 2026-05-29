"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import AdvancePartnerDashboard from "./advancePartner/advancePartner";
import ForecastDashboard from "./ForecastDashboard";
import LaborDashboard from "./laborDashboard/laborDashboard";
import MonitoringExecutionDashboard from "./monitoringExecutionDashboard/monitoringExecutionDashboard";
import RecompositionGoalsDashboard from "./recompositionGoalsDashboard/RecompositionGoalsDashboard";
import { useUser } from "@/contexts/userContext";

// ... (manter todas as interfaces existentes: Kpis, ByStatus, ByRegional, etc.)

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
  token: string;
  initialMaodeObra: any;
  initialMaodeObra2: any;
  initialMetaDiaria: number;
  initialForecastFirst: any;
  initialForecastSecond: any;
  initialMetasRecomposicao: any[];
  goalsFilters: any;
  initialExecMonitoring: any[];
  initialEliminacaoRestricao: any[];
  initialAderenciaParceira: any[];
  initialSparklinesPartners: any[];
  initialPartnerWeeks: any[];
  initialReasonsReascheduling: any[];
  initialLaborMoveForwardPartner: any;
  initialDailyGoalMoveForwardPartner: number;
  filtersData: any;
}

type Tab =
  | "geral"
  | "mao-de-obra"
  | "forecast"
  | "metas-recomposicao"
  | "acompanhamento-execucao"
  | "avanca-parceiro";

export function pctColor(pct: number) {
  if (pct >= 100) {
    return { bg: "#053715", text: "#53FF75", bar: "#53FF75" };
  }
  if (pct >= 89 && pct < 100) {
    return { bg: "#451a03", text: "#facc15", bar: "#facc15" };
  }
  return { bg: "#450a0a", text: "#f87171", bar: "#ef4444" };
}

// ✅ Áreas permitidas para utilizadores internos
const ALLOWED_AREAS = [2, 8];

export default function DashboardClient({
  token,
  initialMaodeObra,
  initialMaodeObra2,
  initialMetaDiaria,
  initialMetasRecomposicao,
  goalsFilters,
  initialExecMonitoring,
  initialEliminacaoRestricao,
  initialAderenciaParceira,
  initialPartnerWeeks,
  initialReasonsReascheduling,
  initialSparklinesPartners,
  initialLaborMoveForwardPartner,
  initialDailyGoalMoveForwardPartner,
  filtersData,
}: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("mao-de-obra");
  const tabSwitcherRef = useRef<HTMLDivElement>(null);
  const [tabSwitcherHeight, setTabSwitcherHeight] = useState(0);

  useEffect(() => {
    if (!tabSwitcherRef.current) return;

    const observer = new ResizeObserver(([entry]) => {
      setTabSwitcherHeight(entry.contentRect.height);
    });

    observer.observe(tabSwitcherRef.current);

    return () => observer.disconnect();
  }, []);

  const filtersTop = 76 + tabSwitcherHeight;

  const partners = [
    { name: "Engelmig", logo: "/engelmig-logo.png" },
    { name: "LIG", logo: "/lig-logo.png" },
    { name: "Start", logo: "/start-logo.png" },
    { name: "Manserv", logo: "/manserv-logo.png" },
    { name: "OCA", logo: "/oca-logo.png" },
    { name: "Cosampa", logo: "/cosampa-logo.png" },
    { name: "Compel", logo: "/compel-logo.png" },
    { name: "Baramaia", logo: "/baramaia-logo.png" },
  ];

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Tab Switcher ─────────────────────────────────────── */}
      <div
        ref={tabSwitcherRef}
        className="sticky top-16 z-30 bg-white flex justify-between items-center gap-1 px-3 pt-3 pb-0 border-b border-white/5"
      >
        <div className="flex gap-1">
          {(
            [
              { key: "mao-de-obra", label: "Resumo — Mão de Obra Parceira" },
              { key: "metas-recomposicao", label: "Metas Recomposição" },
              {
                key: "acompanhamento-execucao",
                label: "Acompanhamento da Execução",
              },
              { key: "avanca-parceiro", label: "Avança Parceiro" },
            ] as { key: Tab; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-3 py-2.5 text-base font-semibold tracking-wide rounded-t-xl transition-all duration-200 ${
                activeTab === key
                  ? "bg-gradient-to-br from-[#1e2f42] to-[#192535] text-white border border-b-0 border-white/10 shadow-lg"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 pb-2">
          {partners.map((item, index) => (
            <div
              key={index}
              className="relative h-12 w-20 opacity-80 transition hover:opacity-100"
            >
              <Image
                title={item.name}
                src={item.logo}
                alt={`Parceira ${index + 1}`}
                fill
                className="object-contain"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ── Tab Content ──────────────────────────────────────── */}
      {activeTab === "metas-recomposicao" ? (
        <RecompositionGoalsDashboard
          initialGoals={initialMetasRecomposicao}
          filtersData={goalsFilters}
          token={token}
          filtersTop={filtersTop}
        />
      ) : activeTab === "acompanhamento-execucao" ? (
        <MonitoringExecutionDashboard
          initialData={initialExecMonitoring}
          filtersData={goalsFilters}
          token={token}
          filtersTop={filtersTop}
        />
      ) : activeTab === "avanca-parceiro" ? (
        <AdvancePartnerDashboard
          initialEliminacao={initialEliminacaoRestricao}
          initialAderencia={initialAderenciaParceira}
          initialSparklinesPartners={initialSparklinesPartners}
          initialPartnerWeeks={initialPartnerWeeks}
          initialSummary={initialLaborMoveForwardPartner}
          initialReasonsReascheduling={initialReasonsReascheduling}
          initialDailyGoal={initialDailyGoalMoveForwardPartner}
          filtersData={goalsFilters}
          filtersTop={filtersTop}
          token={token}
        />
      ) : (
        <LaborDashboard
          initialData={initialMaodeObra}
          initialData2={initialMaodeObra2}
          token={token}
          initialMetaDiaria={initialMetaDiaria}
          filtersData={filtersData}
          filtersTop={filtersTop}
        />
      )}
    </div>
  );
}
