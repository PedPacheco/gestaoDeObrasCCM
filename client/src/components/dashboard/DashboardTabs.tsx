"use client";

import { useCachedResource } from "@/hooks/dashboard/useCachedResource";
import { InitialDashboardData } from "@/lib/dashboard/constants";
import {
  loadExecMonitoring,
  loadGoalsFilters,
  loadLaborFilters,
  loadMaodeObra,
  loadMetasRecomposicao,
} from "@/lib/dashboard/loaders";
import { TabError, TabLoading } from "../common/tabStatus";
import LaborDashboard from "./laborDashboard/laborDashboard";
import MonitoringExecutionDashboard from "./monitoringExecutionDashboard/monitoringExecutionDashboard";
import RecompositionGoalsDashboard from "./recompositionGoalsDashboard/RecompositionGoalsDashboard";

interface TabProps {
  token: string;
  filtersTop: number;
  initialData?: InitialDashboardData;
}

export function LaborTab({ token, filtersTop, initialData }: TabProps) {
  const labor = useCachedResource(
    "labor",
    () => loadMaodeObra(token),
    initialData?.labor,
  );
  const filters = useCachedResource(
    "labor-filters",
    loadLaborFilters,
    initialData?.laborFilters,
  );

  if (labor.error || filters.error) {
    return (
      <TabError
        onRetry={() => {
          if (labor.error) labor.retry();
          if (filters.error) filters.retry();
        }}
      />
    );
  }
  if (!labor.data || !filters.data) {
    return <TabLoading message="Carregando dados do dashboard..." />;
  }

  return (
    <LaborDashboard
      initialData={labor.data.data}
      initialData2={labor.data.data2}
      initialMetaDiaria={labor.data.metaDiaria}
      filtersData={filters.data}
      token={token}
      filtersTop={filtersTop}
    />
  );
}

export function RecompositionTab({ token, filtersTop, initialData }: TabProps) {
  const goals = useCachedResource(
    "metas-recomposicao",
    () => loadMetasRecomposicao(token),
    initialData?.metas,
  );
  const filters = useCachedResource(
    "goals-filters",
    () => loadGoalsFilters(token),
    initialData?.goalsFilters,
  );

  if (goals.error || filters.error) {
    return (
      <TabError
        onRetry={() => {
          if (goals.error) goals.retry();
          if (filters.error) filters.retry();
        }}
      />
    );
  }
  if (!goals.data || !filters.data) {
    return <TabLoading message="Carregando dados do dashboard..." />;
  }

  return (
    <RecompositionGoalsDashboard
      initialGoals={goals.data}
      filtersData={filters.data}
      token={token}
      filtersTop={filtersTop}
    />
  );
}

// MonitoringTab: igual à versão anterior (carregado só quando o tab é aberto)
export function MonitoringTab({ token, filtersTop }: TabProps) {
  const exec = useCachedResource("exec-monitoring", () =>
    loadExecMonitoring(token),
  );
  const filters = useCachedResource("goals-filters", () =>
    loadGoalsFilters(token),
  );

  if (exec.error || filters.error) {
    return (
      <TabError
        onRetry={() => {
          if (exec.error) exec.retry();
          if (filters.error) filters.retry();
        }}
      />
    );
  }
  if (!exec.data || !filters.data) {
    return <TabLoading message="Carregando dados do dashboard..." />;
  }

  return (
    <MonitoringExecutionDashboard
      initialData={exec.data}
      filtersData={filters.data}
      token={token}
      filtersTop={filtersTop}
    />
  );
}
