// ─── Capacity Calculator ───────────────────────────────────────────────────────

import * as moment from 'moment';
import { GetMonthlySummaryInterface } from 'src/interface/types/schedule/getMonthlySummaryInterface';
import {
  FINANCIAL_OVERHEAD_FACTOR,
  MONTH_INDEX_TO_KEY,
  MonthKey,
  MonthlyCapacityMetrics,
  WORKING_DAYS_PER_MONTH,
  WorkOrderMetrics,
} from 'src/interface/types/schedule/monthlySummaryInterface';

/**
 * Agrega as métricas financeiras e de equipes para um determinado mês,
 * percorrendo todos os registros de capacidade de execução uma única vez.
 */
export function aggregateCapacityByMonth(
  executionCapacity: ReadonlyArray<Record<string, any>>,
  monthIndex: number,
): MonthlyCapacityMetrics {
  const monthKey: MonthKey = MONTH_INDEX_TO_KEY[monthIndex];

  let totalFinancial = 0;

  for (const entry of executionCapacity) {
    const teams = Number(entry[monthKey] ?? 0);
    const shouldCost = Number(entry.should_cost ?? 0);

    totalFinancial += teams * shouldCost;
  }

  const dailyFinancialGoal = totalFinancial / WORKING_DAYS_PER_MONTH;
  const dailyFinancialGoalWithOverhead =
    dailyFinancialGoal > 0 ? dailyFinancialGoal * FINANCIAL_OVERHEAD_FACTOR : 0;

  return { dailyFinancialGoal, dailyFinancialGoalWithOverhead };
}

// ─── Calculator For Adding Up Teams ─────────────────────────────────────────────────────

export function calculateTotalTeams(data: GetMonthlySummaryInterface[]) {
  const map = new Map<string, number>();

  for (const item of data) {
    const dateKey = moment.utc(item.data_prog).format('DD/MM/YYYY');

    const teams =
      (item.equipe_linha_morta ?? 0) +
      (item.equipe_linha_viva ?? 0) +
      (item.equipe_regularizacao ?? 0);

    map.set(dateKey, (map.get(dateKey) ?? 0) + teams);
  }

  return map;
}

// ─── Work Order Calculator ─────────────────────────────────────────────────────

/**
 * Calcula os valores de MO programada e executada a partir do percentual base.
 */
export function calculateWorkOrderMetrics(
  baseMo: number,
  prog: number,
  exec: number,
): WorkOrderMetrics {
  return {
    moProg: baseMo * (prog / 100),
    moExec: baseMo * (exec / 100),
  };
}

/**
 * Calcula o percentual de atingimento de meta diária.
 * Retorna 0 para evitar divisão por zero.
 */
export function calculateGoalPercentage(value: number, goal: number): number {
  return goal > 0 ? (value / goal) * 100 : 0;
}

/**
 * Calcula o percentual de execução em relação ao programado.
 * Retorna 0 para evitar divisão por zero.
 */
export function calculateExecutionRate(moExec: number, moProg: number): number {
  return moProg > 0 ? (moExec / moProg) * 100 : 0;
}

/**
 * Calcula a MO prevista com fallback de exec para prog.
 */
export function calculateMoPrev(
  baseMo: number,
  exec: number | null,
  prog: number,
): number {
  return baseMo * ((exec ?? prog) / 100);
}
