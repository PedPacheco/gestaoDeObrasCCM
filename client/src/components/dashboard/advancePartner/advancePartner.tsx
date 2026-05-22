"use client";

import { AdvancePartnerFilters } from "./advancePartnerFilters";
import { KpiSection } from "./kpiSection";
import { SparklinesSection } from "./sparklinesSection";
import { ChartReasonsReascheduling } from "./chartReasonsReascheduling";
import { useAdvancePartnerFilters } from "@/hooks/dashboard/advancePartner/useAdvancePartnerFilters";
import { useState } from "react";

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
}

export type MotivoTab = "GERAL" | "EDP" | "PARCEIRA" | "TERCEIRO";

export interface SparkPoint {
  semana: string;
  pct: number;
}

export interface SparklineRow {
  parceira: string;
  aderencia: SparkPoint[];
  eliminacao: SparkPoint[];
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
}

// ── Helpers ────────────────────────────────────────────────────────────────

export function pctExact(num: number, den: number) {
  if (den === 0) return 0;
  return Math.round((num / den) * 100 * 10) / 10;
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
  token,
}: Props) {
  const [motivoTab, setMotivoTab] = useState<MotivoTab>("GERAL");

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
    semanasMap,
    setStartDate,
    setEndDate,
    setFinalWeek,
    setInitialWeek,
    setSelParceira,
    setSelRegional,
    sparklines,
    taxaExec,
    totalObras,
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
    <div className="flex flex-col gap-6 pb-6">
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
      />

      {/* ── KPIs ── */}
      <KpiSection
        aderencia={aderencia}
        eliminacao={eliminacao}
        taxaExec={taxaExec}
        totalObras={totalObras}
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
      <ChartReasonsReascheduling
        motivoTab={motivoTab}
        motivos={motivos}
        setMotivoTab={setMotivoTab}
        isPending={isPending}
      />
    </div>
  );
}
