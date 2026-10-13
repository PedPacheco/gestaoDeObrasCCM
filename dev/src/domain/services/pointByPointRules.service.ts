import {
  isAtLeast,
  PROGRESS_EPSILON,
  toPercentage,
} from 'src/utils/pointByPoint/progress.utils';
import {
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';

// ─── Tipos ──────────────────────────────────────────────────────────────
export interface ScheduleItem {
  scheduleId: number;
  serviceId: number;
  prog: number | null;
  real: number | null;
  isMaterial: boolean;
}

export interface WorkItem {
  isMaterial: boolean;
  enabledQuantity: number | null; // viabilizado
  additionalQuantity: number | null; // qtde_adicional
  realQuantity: number | null; // qtde_real
}

export interface ServiceTotals {
  serviceId: number;
  plannedQuantity: number; // qtde_prog
  realQuantity: number | null; // qtde_real
}

export interface ScheduleProgress {
  idProgramacao: number;
  prog: number;
  exec: number | null;
}

export interface WorkProgress {
  totalPlanned: number;
  workProgress: number;
  schedulesProgress: ScheduleProgress[];
  demoteConclusion: boolean;
}

// ─── Regras 1 e 4 ───────────────────────────────────────────────────────
/** Regra 1: real === 0 => item DESCARTADO. */
export const isDiscarded = (item: { real: number | null }) => item.real === 0;

/** Regras 1 e 4: materiais e descartados não entram nos percentuais. */
const countsForProgress = (item: ScheduleItem) =>
  !item.isMaterial && !isDiscarded(item);

// ─── Totalizadores do serviço ───────────────────────────────────────────
/**
 * qtde_prog = Σ (real ?? prog): o executado substitui o programado.
 * qtde_real = Σ real (null quando nenhuma linha tem execução lançada).
 */
export function calculateServiceTotals(
  serviceIds: number[],
  items: ScheduleItem[],
): ServiceTotals[] {
  const totals = new Map<number, ServiceTotals>();
  for (const serviceId of serviceIds) {
    totals.set(serviceId, {
      serviceId,
      plannedQuantity: 0,
      realQuantity: null,
    });
  }
  for (const item of items) {
    const current = totals.get(item.serviceId);
    if (!current) continue;
    current.plannedQuantity += item.real ?? item.prog ?? 0;
    if (item.real !== null)
      current.realQuantity = (current.realQuantity ?? 0) + item.real;
  }
  return [...totals.values()];
}

// ─── Percentuais das programações ───────────────────────────────────────
export function calculateAllSchedulesProgress(
  items: ScheduleItem[],
  totalPlanned: number,
): ScheduleProgress[] {
  const totals = new Map<
    number,
    { prog: number; exec: number; hasExecution: boolean }
  >();

  for (const item of items) {
    if (!countsForProgress(item)) continue;

    const current = totals.get(item.scheduleId) ?? {
      prog: 0,
      exec: 0,
      hasExecution: false,
    };

    current.prog += item.prog ?? 0;
    current.exec += item.real ?? 0;
    current.hasExecution ||= item.real !== null;
    totals.set(item.scheduleId, current);
  }

  return [...totals].map(([idProgramacao, t]) => ({
    idProgramacao,
    prog: toPercentage(t.prog, totalPlanned),
    exec: t.hasExecution ? toPercentage(t.exec, totalPlanned) : null,
  }));
}

/** Prog/exec (%) de uma única programação (usado na finalização). */
export function calculateScheduleProgress(
  items: ScheduleItem[],
  totalPlanned: number,
  scheduleId: number,
) {
  const found = calculateAllSchedulesProgress(items, totalPlanned).find(
    (p) => p.idProgramacao === scheduleId,
  );

  return { prog: found?.prog ?? 0, exec: found?.exec ?? 0 };
}

/** Prog/exec (%) agregado das demais programações, limitado a 100. */
export function calculateAggregateProgress(
  items: ScheduleItem[],
  totalPlanned: number,
  excludeScheduleId: number,
) {
  const totals = items
    .filter((i) => i.scheduleId !== excludeScheduleId && countsForProgress(i))
    .reduce(
      (acc, i) => ({
        prog: acc.prog + (i.prog ?? 0),
        exec: acc.exec + (i.real ?? 0),
      }),
      { prog: 0, exec: 0 },
    );

  return {
    exec: Math.min(toPercentage(totals.exec, totalPlanned), 100),
    prog: Math.min(toPercentage(totals.prog, totalPlanned), 100),
  };
}

// ─── Obra (regra 3) ─────────────────────────────────────────────────────
export const DEMOTED_WORK_STATUS = WorkStatus.SERVICOS_REAGENDADOS;

/**
 * Regra 3: a obra só se mantém concluída com execução >= total dos itens.
 * A promoção a "concluída" continua a ser feita só na finalização.
 */
export function calculateWorkProgress(
  workItems: WorkItem[],
  scheduleItems: ScheduleItem[],
  workStatus: number | null,
): WorkProgress {
  const totalPlanned = workItems
    .filter((i) => i.realQuantity !== 0 && !i.isMaterial)
    .reduce(
      (sum, i) => sum + (i.enabledQuantity ?? 0) + (i.additionalQuantity ?? 0),
      0,
    );

  const executed = scheduleItems
    .filter(countsForProgress)
    .reduce((sum, i) => sum + (i.real ?? 0), 0);

  const workProgress = Math.min(toPercentage(executed, totalPlanned), 100);

  return {
    totalPlanned,
    workProgress,
    schedulesProgress: calculateAllSchedulesProgress(
      scheduleItems,
      totalPlanned,
    ),
    demoteConclusion:
      workStatus === WorkStatus.CONCLUIDA && !isAtLeast(workProgress, 100),
  };
}

// ─── Programação de itens ───────────────────────────────────────────────
/** Programar uma programação reprovada (pendente de revisão) aprova-a. */
export const statusAfterScheduling = (status: number): number | undefined =>
  status === ScheduleStatus.PENDENTE_REVISAO
    ? ScheduleStatus.APROVADA
    : undefined;

/** Regra 2: o executado não pode ser perdido. */
export function hasLockedExecution(
  scheduleStatus: number | null,
  items: { real: number | null }[],
): boolean {
  const hasExecution = items.some((i) => i.real !== null); // inclui 0 = descartado

  const isExecuted =
    scheduleStatus === ScheduleStatus.EXECUTADA ||
    scheduleStatus === ScheduleStatus.PARCIAL;

  return hasExecution || isExecuted;
}

export interface SchedulingService {
  id: number;
  id_obra: number;
  operacao: string | null;
  ponto: string | null;
  qtde_real: number | null;
  viabilizado: number | null;
  qtde_adicional: number | null;
}

export type SchedulingViolation =
  | { type: 'not_owned'; serviceId: number }
  | { type: 'discarded'; label: string }
  | {
      type: 'insufficient_balance';
      label: string;
      available: number;
      requested: number;
    };

/**
 * Devolve a primeira violação (pela mesma ordem de verificação de hoje):
 * - o item pertence à obra;
 * - o item descartado (regra 1) não volta a ser programado;
 * - a soma programada não ultrapassa o saldo (viabilizado + adicional - consumido).
 */
export function findSchedulingViolation(
  workId: number,
  requests: { id: number; prog: number; additional?: number | null }[],
  services: SchedulingService[],
  history: { id_servico: number; prog: number | null; real: number | null }[],
): SchedulingViolation | null {
  const servicesById = new Map(services.map((s) => [s.id, s]));

  const consumed = new Map<number, number>();

  for (const row of history) {
    consumed.set(
      row.id_servico,
      (consumed.get(row.id_servico) ?? 0) + (row.real ?? row.prog ?? 0),
    );
  }

  const requested = new Map<number, number>();
  const additional = new Map<number, number>();

  for (const item of requests) {
    requested.set(item.id, (requested.get(item.id) ?? 0) + item.prog);

    if (item.additional !== undefined && item.additional !== null)
      additional.set(item.id, item.additional);
  }

  for (const serviceId of new Set(requests.map((r) => r.id))) {
    const service = servicesById.get(serviceId);

    if (!service || service.id_obra !== workId)
      return { type: 'not_owned', serviceId };

    const label =
      `${service.operacao ?? ''} ${service.ponto ?? ''}`.trim() ||
      String(serviceId);

    if (service.qtde_real === 0) return { type: 'discarded', label };

    if (service.viabilizado === null || service.viabilizado === undefined)
      continue;

    const total =
      service.viabilizado +
      (additional.get(serviceId) ?? service.qtde_adicional ?? 0);

    const available = total - (consumed.get(serviceId) ?? 0);

    const req = requested.get(serviceId) ?? 0;

    if (req > available + PROGRESS_EPSILON) {
      return { type: 'insufficient_balance', label, available, requested: req };
    }
  }
  return null;
}

// ─── Reagendamento (regras 1 e 2) ───────────────────────────────────────
export interface ScheduleExecutionRow {
  id: number;
  id_servico: number;
  prog: number | null;
  real: number | null;
}

export interface ReschedulePlan {
  /** Linhas sem execução (real nulo): saem da programação e voltam ao saldo. */
  releasedRowIds: number[];
  /** Serviços cujos totalizadores têm de ser recalculados (pendentes + parciais). */
  affectedServiceIds: number[];
  /** Há itens pendentes ou parciais para reagendar. */
  hasPendingItems: boolean;
  /** Nenhuma linha fica na programação, por isso ela sai do recálculo e tem de ser zerada. */
  emptiesSchedule: boolean;
  /** A programação mantém execução lançada (real > 0). */
  hasExecution: boolean;
}

/**
 * Regra 2: o executado NUNCA é perdido. As linhas com real lançado (incluindo
 * parcial, real < prog) mantêm-se, e o que faltou volta ao saldo porque
 * qtde_prog = Σ (real ?? prog).
 * Regra 1: real = 0 significa DESCARTADO, por isso só as linhas sem execução
 * (real nulo) são libertadas.
 */
export function planReschedule(rows: ScheduleExecutionRow[]): ReschedulePlan {
  const pending = rows.filter((r) => r.real === null);
  const partial = rows.filter(
    (r) => r.real !== null && r.real > 0 && r.real < (r.prog ?? 0),
  );

  return {
    releasedRowIds: pending.map((r) => r.id),
    affectedServiceIds: [...pending, ...partial].map((r) => r.id_servico),
    hasPendingItems: pending.length > 0 || partial.length > 0,
    emptiesSchedule: rows.length - pending.length === 0,
    hasExecution: rows.some((r) => r.real !== null && r.real > 0),
  };
}

/**
 * Formato mínimo de uma linha do getServiceScheduleHistory que o adaptador usa.
 * `servicos` pode trazer a FK `id_material` e/ou a relação `materiais`,
 * conforme o select da query.
 */
export interface HistoryRow {
  id_programacao: number;
  id_servico: number;
  prog: number | null;
  real: number | null;
  servicos?: {
    id_material?: number | null;
    materiais?: unknown | null;
  } | null;
}

/**
 * Adaptador transitório: linha do getServiceScheduleHistory -> ScheduleItem.
 *
 * Replica exatamente o isService do antigo ScheduleProgressCalculatorService:
 * - se o select traz a FK `id_material`, usa-a (é material quando não é null);
 * - caso contrário, usa a relação `materiais` (é material quando não é null).
 *
 * Se `servicos` não vier no select, o item é tratado como material e fica
 * fora dos cálculos, tal como hoje.
 */
export const fromHistoryRow = (row: HistoryRow): ScheduleItem => ({
  scheduleId: row.id_programacao,
  serviceId: row.id_servico,
  prog: row.prog,
  real: row.real,
  isMaterial:
    row.servicos?.id_material !== undefined
      ? row.servicos.id_material !== null
      : row.servicos?.materiais !== null,
});
