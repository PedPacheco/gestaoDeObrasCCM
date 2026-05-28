// ── MetasRecomposicaoDashboard.tsx ────────────────────────────────────────────
// Componente raiz APÓS refatoração.
//
// ANTES → 1902 linhas: estado, fetch, cálculos, JSX e sub-componentes misturados.
// DEPOIS → ~45 linhas: orquestrador puro que delega para hooks e componentes.
//
// Responsabilidades que saíram daqui:
//  - Tipos          → types/goals.ts
//  - Funções puras  → lib/goals-utils.ts
//  - Fetch/service  → lib/goals-service.ts
//  - Estado filtros → hooks/useGoalsFilter.ts
//  - Derivados KPI  → hooks/useDashboardMetrics.ts
//  - UI filtros     → components/dashboard/GoalsFilters.tsx
//  - UI KPIs        → components/dashboard/KpiSection.tsx
//  - UI gráficos    → components/dashboard/ChartsSection.tsx
//  - UI tabela      → components/dashboard/GoalsTable.tsx

"use client";

import "dayjs/locale/pt-br";

import dayjs, { Dayjs } from "dayjs";
import { useCallback, useMemo, useState, useTransition } from "react";

import { fetchData } from "@/actions/fetchData.action";
import { useDashboardMetrics } from "@/hooks/dashboard/recompositionGoalsDashboard/useRecompositionGoalsMetrics";
import { useSaveFilters } from "@/hooks/useSaveFilters";
import {
  FiltersData,
  Goal,
  MonthKey,
} from "@/types/dashboard/recompositionGoals/goals";
import { Transform } from "@/utils/transform";

import { GoalsFilters } from "./GoalsFilters";
import { GoalsTable } from "./GoalsTable";
import { KpiSection } from "./KpiSection";
import { ChartsSection } from "./ChartSection";

interface Props {
  initialGoals: Goal[];
  filtersData: FiltersData;
  token: string;
  filtersTop: number;
}

export const MONTHS: MonthKey[] = [
  "jan",
  "fev",
  "mar",
  "abr",
  "mai",
  "jun",
  "jul",
  "ago",
  "set",
  "out",
  "nov",
  "dez",
];

export const MONTH_LABELS = [
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

export const PIE_COLORS = [
  "#3b82f6",
  "#53FF75",
  "#f97316",
  "#a78bfa",
  "#06b6d4",
  "#ec4899",
  "#f59e0b",
  "#14b8a6",
  "#ef4444",
  "#8b5cf6",
];

// ── Cálculos por linha ────────────────────────────────────────────────────────

/** Soma meta/prog/real de todos os meses de uma Goal */
export function rowTotal(g: Goal) {
  return MONTHS.reduce(
    (acc, m) => ({
      meta: acc.meta + (g[m]?.meta ?? 0),
      prog: acc.prog + (g[m]?.prog ?? 0),
      real: acc.real + (g[m]?.real ?? 0),
    }),
    { meta: 0, prog: 0, real: 0 },
  );
}

export const MONTH_OPTIONS = MONTHS.map((value, index) => ({
  value,
  label: MONTH_LABELS[index],
  index,
}));

// ── Cores de desempenho ───────────────────────────────────────────────────────

/** Retorna paleta de cores baseada no percentual de atingimento */

export default function RecompositionGoalsDashboard({
  initialGoals,
  filtersData,
  token,
  filtersTop,
}: Props) {
  const currentMonth = dayjs().month();
  const now = dayjs();

  const { clearFilters, filters, saveFilters } = useSaveFilters({
    pageKey: "recompositionGoalsDashboardFilters",
    data: filtersData,
  });

  const [goals, setGoals] = useState<Goal[]>(initialGoals ?? []);

  const [year, setYear] = useState<Dayjs>(dayjs());
  const [anoPlan, setAnoPlan] = useState<Dayjs>(dayjs());
  const [selectedStartMonth, setSelectedStartMonth] = useState<number>(0);
  const [selectedEndMonth, setSelectedEndMonth] =
    useState<number>(currentMonth);
  const [selectedRegionais, setSelectedRegionais] = useState<string[]>(
    () => filters?.regional ?? [],
  );
  const [selectedParceiras, setSelectedParceiras] = useState<string[]>(
    () => filters?.parceira ?? [],
  );
  const [selectedTiposObra, setSelectedTiposObra] = useState<string[]>(
    () => filters?.tipo ?? [],
  );
  const [isPending, startTransition] = useTransition();

  const metrics = useDashboardMetrics(
    goals,
    selectedStartMonth,
    selectedEndMonth,
  );

  const tiposRecomp = useMemo(
    () => (filtersData?.tipo ?? []).filter((t) => t.id_grupo === 2),
    [filtersData?.tipo],
  );

  const buildParams = useCallback(
    (): Record<string, string[]> => ({
      parceira: selectedParceiras,
      regional: selectedRegionais,
      tipo: selectedTiposObra,
    }),
    [selectedParceiras, selectedRegionais, selectedTiposObra],
  );

  const buildFormattedParams = useCallback(
    () => ({
      ...Transform(buildParams()),
      ano: now.year(),
      anoPlan: now.year(),
      btzero: false,
      rda: false,
    }),
    [buildParams, now],
  );

  function applyFilter() {
    const params = buildFormattedParams();
    saveFilters(params);

    startTransition(async () => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/metas`,
        params,
        token,
        { cache: "no-store" },
      );

      setGoals(response.data);
    });
  }

  const handleCleaningFilters = useCallback(() => {
    setSelectedParceiras([]);
    setSelectedRegionais([]);
    setSelectedTiposObra([]);
    setYear(now);
    setAnoPlan(now);
    clearFilters();

    const params = {
      ano: now.year(),
      anoPlan: now.year(),
      btzero: false,
      rda: false,
    };

    startTransition(async () => {
      const response = await fetchData(
        `${process.env.NEXT_PUBLIC_API_URL}/metas`,
        params,
        token,
      );

      setGoals(response.data);
    });
  }, [clearFilters, now, token]);

  return (
    <div className="flex flex-col gap-5 pb-6 min-h-full">
      <GoalsFilters
        filtersData={filtersData}
        filtersTop={filtersTop}
        tiposRecomp={tiposRecomp}
        year={year}
        yearPlan={anoPlan}
        selectedStartMonth={selectedStartMonth}
        selectedEndMonth={selectedEndMonth}
        setSelectedStartMonth={setSelectedStartMonth}
        setSelectedEndMonth={setSelectedEndMonth}
        selRegional={selectedRegionais}
        selPartner={selectedParceiras}
        selType={selectedTiposObra}
        isPending={isPending}
        setYear={setYear}
        setYearPlan={setAnoPlan}
        setSelRegional={setSelectedRegionais}
        setSelPartner={setSelectedParceiras}
        setSelType={setSelectedTiposObra}
        onApply={applyFilter}
        onClear={handleCleaningFilters}
      />

      <KpiSection metrics={metrics} />
      <ChartsSection metrics={metrics} />
      <GoalsTable
        groupedRows={metrics.groupedRows}
        totalMeta={metrics.totalMeta}
        totalProg={metrics.totalProg}
        totalReal={metrics.totalReal}
        totalCarteira={metrics.totalCarteira}
        taxaReal={metrics.taxaReal}
      />
    </div>
  );
}
