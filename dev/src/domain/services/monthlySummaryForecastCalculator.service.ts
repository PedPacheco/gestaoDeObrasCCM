// ─── Capacity Calculator ───────────────────────────────────────────────────────

import {
  MonthlyCapacityMetricsForecast,
  WorkOrderMetricsForecast,
} from 'src/interface/types/schedule/monthlySummaryForecastInterface';
import {
  MONTH_INDEX_TO_KEY,
  MonthKey,
  WORKING_DAYS_PER_MONTH,
} from 'src/interface/types/schedule/monthlySummaryInterface';

/**
 * Agrega as métricas financeiras e de equipes para um determinado mês,
 * percorrendo todos os registros de capacidade de execução uma única vez.
 */
export function aggregateCapacityByMonthForecast(
  executionCapacity: ReadonlyArray<Record<string, any>>,
  monthIndex: number,
): MonthlyCapacityMetricsForecast {
  const monthKey: MonthKey = MONTH_INDEX_TO_KEY[monthIndex];

  let totalFinancial = 0;
  let teamsTotal = 0;

  for (const entry of executionCapacity) {
    const teams = Number(entry[monthKey] ?? 0);
    const shouldCost = Number(entry.should_cost ?? 0);

    teamsTotal += teams;
    totalFinancial += teams * shouldCost;
  }

  const dailyFinancialGoal = totalFinancial / WORKING_DAYS_PER_MONTH;

  return { dailyFinancialGoal, teamsTotal };
}

// ─── Work Order Calculator ─────────────────────────────────────────────────────

/**
 * Calcula os valores de MO programada e executada a partir do percentual base.
 */
export function calculateWorkOrderMetricsForecast(
  servicePlan: number,
  materialPlan: number,
  prog: number,
  exec: number,
): WorkOrderMetricsForecast {
  return {
    serviceCapexProg: servicePlan * (prog / 100),
    serviceCapexExec: servicePlan * (exec / 100),
    materialCapexProg: materialPlan * (prog / 100),
    materialCapexExec: materialPlan * (exec / 100),
  };
}

/**
 * Calcula o percentual de atingimento de meta diária.
 * Retorna 0 para evitar divisão por zero.
 */
export function calculateGoalPercentageForecast(
  value: number,
  goal: number,
): number {
  return goal > 0 ? (value / goal) * 100 : 0;
}

/**
 * Calcula o percentual de execução em relação ao programado.
 * Retorna 0 para evitar divisão por zero.
 */
export function calculateExecutionRateForecast(
  serviceCapexProg: number,
  materialCapexProg: number,
  serviceCapexExec: number,
  materialCapexExec: number,
): number {
  return (
    ((materialCapexExec + serviceCapexExec) /
      (materialCapexProg + serviceCapexProg)) *
    100
  );
}

/**
 * Calcula a MO prevista com fallback de exec para prog.
 */
export function calculateMoPrevForecast(
  baseMoPlan: number,
  baseMatPlan: number,
  exec: number | null,
  prog: number,
): { serviceCapexPrev: number; materialCapexPrev: number } {
  const serviceCapexPrev = baseMoPlan * ((exec ?? prog) / 100);
  const materialCapexPrev = baseMatPlan * ((exec ?? prog) / 100);
  return { serviceCapexPrev, materialCapexPrev };
}
