"use client";

import { AdvancePartnerFilters } from "./advancePartnerFilters";
import { KpiSection } from "./kpiSection";
import { SparklinesSection } from "./sparklinesSection";
import { ChartReasonsReascheduling } from "./chartReasonsReascheduling";
import { useAdvancePartnerFilters } from "@/hooks/dashboard/advancePartner/useAdvancePartnerFilters";

// ── Types ──────────────────────────────────────────────────────────────────

export interface EliminacaoRow {
  month: string;
  total: number;
  withRestriction: number;
  withoutRestriction: number;
  pct: number;
}

export interface AderenciaRow {
  week: string;
  total: number;
  executed: number;
  partialExecuted: number;
  notExecuted: number;
  notInformed: number;
  pct: number;
}

export interface MotivoRow {
  ovnota: string;
  motivo: string;
  responsavel?: string;
  mo_nao_executada: number;
  observacao_execucao?: string | null;
}

interface Props {
  initialEliminacao: EliminacaoRow[];
  initialAderencia: AderenciaRow[];
  initialSparklinesPartners: any[];
  initialPartnerWeeks: any[];
  initialReasonsReascheduling: any[];
  initialSummary: any;
  initialDailyGoal: number;
  filtersData: any;
  token: string;
  filtersTop: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pctExact(num: number, den: number) {
  if (den === 0) return 0;
  return Math.round((num / den) * 100 * 10) / 10;
}

export function pctColorGripSchedule(pct: number) {
  if (pct >= 85) {
    return {
      bg: "#053715",
      text: "#53FF75",
      bar: "#53FF75",
    };
  }

  if (pct >= 71 && pct < 85) {
    return {
      bg: "#451a03",
      text: "#facc15",
      bar: "#facc15",
    };
  }

  return {
    bg: "#450a0a",
    text: "#f87171",
    bar: "#ef4444",
  };
}

export function pctColorRestrictionsElimination(pct: number) {
  if (pct >= 100) {
    return {
      bg: "#053715",
      text: "#53FF75",
      bar: "#53FF75",
    };
  }

  if (pct >= 86 && pct < 100) {
    return {
      bg: "#451a03",
      text: "#facc15",
      bar: "#facc15",
    };
  }

  return {
    bg: "#450a0a",
    text: "#f87171",
    bar: "#ef4444",
  };
}

export default function AdvancePartnerDashboard({
  initialEliminacao,
  initialAderencia,
  initialPartnerWeeks,
  initialSummary,
  initialReasonsReascheduling,
  initialSparklinesPartners,
  initialDailyGoal,
  filtersData,
  filtersTop,
  token,
}: Props) {
  const {
    aderencia,
    applyFilters,
    eliminacao,
    startDate,
    endDate,
    finalWeek,
    initialWeek,
    isPending,
    motivos,
    resetFilters,
    selParceira,
    selRegional,
    motivoTab,
    semanasMap,
    setStartDate,
    setEndDate,
    setFinalWeek,
    setInitialWeek,
    setSelParceira,
    setSelRegional,
    setMotivoTab,
    sparklines,
    taxaExec,
    dailyGoal,
    filterMode,
    setFilterMode,
  } = useAdvancePartnerFilters({
    token,
    filtersData,
    initialEliminacao,
    initialAderencia,
    initialPartnerWeeks,
    initialReasonsReascheduling,
    initialSparklinesPartners,
    initialSummary,
    initialDailyGoal,
  });

  return (
    // Removido: useState desnecessário que não estava em uso
    // Layout principal: flex-col com gap consistente e padding lateral responsivo
    <div className="flex flex-col gap-4 sm:gap-6 pb-6">
      {/* ── Filtros ── */}
      <AdvancePartnerFilters
        startDate={startDate}
        endDate={endDate}
        filtersData={filtersData}
        initialWeek={initialWeek}
        finalWeek={finalWeek}
        selectedParceira={selParceira}
        selectedRegional={selRegional}
        filterMode={filterMode}
        motivoTab={motivoTab}
        setMotivoTab={setMotivoTab}
        setFilterMode={setFilterMode}
        setSelectedParceira={setSelParceira}
        setSelectedRegional={setSelRegional}
        setStartDate={setStartDate}
        setEndDate={setEndDate}
        setFinalWeek={setFinalWeek}
        setInitialWeek={setInitialWeek}
        applyFilters={applyFilters}
        clearFilters={resetFilters}
        isPending={isPending}
        filtersTop={filtersTop}
      />

      {/* ── KPIs ── */}
      <KpiSection
        aderencia={aderencia}
        eliminacao={eliminacao}
        taxaExec={taxaExec}
        reasonsReascheduling={motivos}
        dailyGoal={dailyGoal * 22}
      />

      {/* ── Sparklines: 3 cards — Empresas | Eliminação | Aderência ── */}
      <SparklinesSection
        sparklines={sparklines}
        filtersPartner={filtersData.parceira}
        loading={isPending}
        semanasMap={semanasMap}
      />

      {/* ── Motivos de Reprogramação ── */}
      {/* Padding lateral padronizado via px-4 sm:px-5 para consistência com KpiSection/SparklinesSection */}
      <div className="w-full px-4 sm:px-5">
        <ChartReasonsReascheduling
          motivos={motivos}
          aderencia={aderencia}
          isPending={isPending}
        />
      </div>
    </div>
  );
}
