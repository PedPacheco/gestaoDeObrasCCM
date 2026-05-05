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

// ── Cores de desempenho ───────────────────────────────────────────────────────

/** Retorna paleta de cores baseada no percentual de atingimento */
export function pctColor(v: number) {
  if (v >= 100) return { bar: "#53FF75", bg: "#052e16", text: "#4ade80" };
  if (v >= 70) return { bar: "#f97316", bg: "#431407", text: "#fb923c" };
  return { bar: "#818cf8", bg: "#1e1b4b", text: "#818cf8" };
}

export default function RecompositionGoalsDashboard({
  initialGoals,
  filtersData,
  token,
}: Props) {
  const { clearFilters, filters, saveFilters } = useSaveFilters({
    pageKey: "recompositionGoalsDashboardFilters",
    data: filtersData,
  });

  const [goals, setGoals] = useState<Goal[]>(initialGoals ?? []);

  const [ano, setAno] = useState<Dayjs>(dayjs());
  const [anoPlan, setAnoPlan] = useState<Dayjs>(dayjs());
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

  const metrics = useDashboardMetrics(goals);

  const now = dayjs();

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
    setAno(now);
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
    <div className="flex flex-col gap-5 p-6 min-h-full">
      <GoalsFilters
        filtersData={filtersData}
        tiposRecomp={tiposRecomp}
        ano={ano}
        anoPlan={anoPlan}
        selRegional={selectedRegionais}
        selParceira={selectedParceiras}
        selTipo={selectedTiposObra}
        isPending={isPending}
        setAno={setAno}
        setAnoPlan={setAnoPlan}
        setSelRegional={setSelectedRegionais}
        setSelParceira={setSelectedParceiras}
        setSelTipo={setSelectedTiposObra}
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
