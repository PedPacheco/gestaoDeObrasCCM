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
export enum ServiceExecutionStatus {
  EXECUTADO = 'EXECUTADO',
  REPROGRAMADO = 'REPROGRAMADO',
  NAO_EXECUTADO = 'NAO_EXECUTADO',
}

export interface ScheduleItem {
  scheduleId: number;
  serviceId: number;
  prog: number | null;
  real: number | null;
  isMaterial: boolean;
  status: ServiceExecutionStatus | null;
}

export interface WorkItem {
  serviceId: number;
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

export interface WorkExecutionTotals {
  /** % executado da obra (limitado a 100). */
  executed: number;
  /** % coberto: executado + reservado em linhas sem apontamento (limitado a 100). */
  coverage: number;
}

// ─── Estado da linha ────────────────────────────────────────────────────
/**
 * status         real   significado                                      saldo  executado
 * null           null   programado, ainda sem apontamento                prog   0
 * EXECUTADO      > 0    execução lançada                                 real   real
 * NAO_EXECUTADO  0      regra 1: descartado; ENCERRA o serviço           0      0
 * REPROGRAMADO   null   não executado: tudo volta ao saldo               0      0
 * REPROGRAMADO   > 0    parcial: o executado conta, o resto volta        real   real
 */
type StatusLine = { status: string | null };
type ExecutionLine = StatusLine & { prog: number | null; real: number | null };

/** Programado e ainda sem apontamento. */
export const isNotYetReported = (r: ExecutionLine) =>
  r.status === null && r.real === null;

export const isExecuted = (r: StatusLine) =>
  r.status === ServiceExecutionStatus.EXECUTADO;

/** Regra 1: linha DESCARTADA. */
export const isDiscarded = (r: StatusLine) =>
  r.status === ServiceExecutionStatus.NAO_EXECUTADO;

export const isRescheduled = (r: StatusLine) =>
  r.status === ServiceExecutionStatus.REPROGRAMADO;

/** Execução parcial: real lançado, mas abaixo do programado. */
export const isPartial = (r: ExecutionLine) =>
  r.real !== null && r.real > 0 && r.real + PROGRESS_EPSILON < (r.prog ?? 0);

/** Há execução lançada (real > 0). O real = 0 só existe em NAO_EXECUTADO. */
export const hasRealExecution = (r: ExecutionLine) => (r.real ?? 0) > 0;

/**
 * Estado gravado no apontamento:
 * - null/undefined → REPROGRAMADO (não executado)
 * - 0              → NAO_EXECUTADO (regra 1)
 * - > 0            → EXECUTADO
 */
export const deriveExecutionStatus = (
  real: number | null | undefined,
): ServiceExecutionStatus => {
  if (real === null || real === undefined) {
    return ServiceExecutionStatus.REPROGRAMADO;
  }

  return real > 0
    ? ServiceExecutionStatus.EXECUTADO
    : ServiceExecutionStatus.NAO_EXECUTADO;
};

/** Quanto a linha ocupa do saldo do serviço. */
export function consumedQuantity(r: ExecutionLine): number {
  switch (r.status) {
    case ServiceExecutionStatus.EXECUTADO:
    case ServiceExecutionStatus.REPROGRAMADO:
      return r.real ?? 0; // REPROGRAMADO: só o executado; o resto volta ao saldo
    case ServiceExecutionStatus.NAO_EXECUTADO:
      return 0;
    default:
      return r.prog ?? 0; // sem apontamento: reserva o prog
  }
}

/** Quanto a linha conta como executado. */
export const executedQuantity = (r: ExecutionLine): number =>
  isExecuted(r) || isRescheduled(r) ? (r.real ?? 0) : 0;

/** Regras 1 e 4: materiais e linhas descartadas não entram nos percentuais. */
const countsForProgress = (item: ScheduleItem) =>
  !item.isMaterial && !isDiscarded(item);

// ─── Serviço encerrado (regra 1 ao nível do serviço) ────────────────────
/**
 * Serviço com pelo menos uma linha NAO_EXECUTADO não será mais executado:
 * fica ENCERRADO com o que já foi executado/reservado.
 * `items` tem de ter TODAS as linhas da obra.
 */
function findClosedServices(items: ScheduleItem[]): Set<number> {
  return new Set(items.filter(isDiscarded).map((i) => i.serviceId));
}

/**
 * Quanto a linha conta no "prog" das percentagens.
 * - Serviço aberto: o prog original (histórico da programação).
 * - Serviço encerrado: só o executado/reservado, para o numerador nunca
 *   ultrapassar o denominador (evita prog > 100%).
 */
const scheduledQuantity = (item: ScheduleItem, closed: Set<number>): number =>
  closed.has(item.serviceId) ? consumedQuantity(item) : (item.prog ?? 0);

/**
 * Total planeado da obra (denominador das percentagens):
 * - serviço aberto     → viabilizado + adicional
 * - serviço encerrado  → Σ consumedQuantity (o executado/reservado)
 * - material           → fora
 * O viabilizado não é alterado: o valor é calculado e o histórico mantém-se.
 */
export function calculateTotalPlanned(
  workItems: WorkItem[],
  scheduleItems: ScheduleItem[],
): number {
  const closed = findClosedServices(scheduleItems);
  const consumedByService = new Map<number, number>();

  for (const item of scheduleItems) {
    if (!closed.has(item.serviceId)) continue;

    consumedByService.set(
      item.serviceId,
      (consumedByService.get(item.serviceId) ?? 0) + consumedQuantity(item),
    );
  }

  return workItems
    .filter((i) => !i.isMaterial)
    .reduce((sum, i) => {
      if (closed.has(i.serviceId)) {
        return sum + (consumedByService.get(i.serviceId) ?? 0);
      }

      // Dados antigos: real = 0 sem linha NAO_EXECUTADO continua a ser descartado
      if (i.realQuantity === 0) return sum;

      return sum + (i.enabledQuantity ?? 0) + (i.additionalQuantity ?? 0);
    }, 0);
}

// ─── Totalizadores do serviço ───────────────────────────────────────────
/**
 * qtde_prog = Σ consumedQuantity
 * qtde_real = Σ real das linhas com apontamento numérico
 *             (null quando nenhuma linha tem real; 0 quando descartado)
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

    current.plannedQuantity += consumedQuantity(item);

    if (item.real !== null) {
      current.realQuantity = (current.realQuantity ?? 0) + item.real;
    }
  }

  return [...totals.values()];
}

// ─── Percentuais das programações ───────────────────────────────────────
/**
 * prog: o programado da programação (o original, exceto em serviços encerrados).
 * exec: o executado; 0 numa programação só com itens reprogramados;
 *       null se ainda não houver apontamento.
 */
export function calculateAllSchedulesProgress(
  items: ScheduleItem[],
  totalPlanned: number,
): ScheduleProgress[] {
  const closed = findClosedServices(items);
  const totals = new Map<
    number,
    {
      prog: number;
      exec: number;
      hasExecution: boolean;
      hasRescheduled: boolean;
    }
  >();

  for (const item of items) {
    if (!countsForProgress(item)) continue;

    const current = totals.get(item.scheduleId) ?? {
      prog: 0,
      exec: 0,
      hasExecution: false,
      hasRescheduled: false,
    };

    current.prog += scheduledQuantity(item, closed);
    current.exec += executedQuantity(item);
    current.hasExecution ||= hasRealExecution(item);
    current.hasRescheduled ||= isRescheduled(item);
    totals.set(item.scheduleId, current);
  }

  return [...totals].map(([idProgramacao, t]) => ({
    idProgramacao,
    prog: toPercentage(t.prog, totalPlanned),
    exec: t.hasExecution
      ? toPercentage(t.exec, totalPlanned)
      : t.hasRescheduled
        ? 0
        : null,
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

/** Executado e cobertura da obra, sem contar nada duas vezes. */
export function calculateWorkExecutionTotals(
  items: ScheduleItem[],
  totalPlanned: number,
): WorkExecutionTotals {
  const counted = items.filter(countsForProgress);
  const executed = counted.reduce((sum, i) => sum + executedQuantity(i), 0);
  const covered = counted.reduce((sum, i) => sum + consumedQuantity(i), 0);

  return {
    executed: Math.min(toPercentage(executed, totalPlanned), 100),
    coverage: Math.min(toPercentage(covered, totalPlanned), 100),
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
  const totalPlanned = calculateTotalPlanned(workItems, scheduleItems);

  const executed = scheduleItems
    .filter(countsForProgress)
    .reduce((sum, i) => sum + executedQuantity(i), 0);

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

/**
 * Regra 2: o executado não pode ser perdido.
 * Bloqueia se houver apontamento numérico (real > 0 ou descartado) ou se
 * a programação já estiver finalizada como executada/parcial.
 */
export function hasLockedExecution(
  scheduleStatus: number | null,
  items: { real: number | null; status: string | null }[],
): boolean {
  const hasExecution = items.some(
    (i) => i.real !== null || isExecuted(i) || isDiscarded(i),
  );

  const scheduleIsExecuted =
    scheduleStatus === ScheduleStatus.EXECUTADA ||
    scheduleStatus === ScheduleStatus.PARCIAL;

  return hasExecution || scheduleIsExecuted;
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

export interface SchedulingHistoryRow {
  id_servico: number;
  prog: number | null;
  real: number | null;
  status: string | null;
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
 * Devolve a primeira violação:
 * - o item pertence à obra;
 * - o serviço encerrado/descartado (regra 1) não volta a ser programado;
 * - a soma programada não ultrapassa o saldo (viabilizado + adicional - consumido).
 */
export function findSchedulingViolation(
  workId: number,
  requests: { id: number; prog: number; additional?: number | null }[],
  services: SchedulingService[],
  history: SchedulingHistoryRow[],
): SchedulingViolation | null {
  const servicesById = new Map(services.map((s) => [s.id, s]));

  const consumed = new Map<number, number>();
  const discardedByHistory = new Set<number>();

  for (const row of history) {
    consumed.set(
      row.id_servico,
      (consumed.get(row.id_servico) ?? 0) + consumedQuantity(row),
    );
    if (isDiscarded(row)) discardedByHistory.add(row.id_servico);
  }

  const requested = new Map<number, number>();
  const additional = new Map<number, number>();

  for (const item of requests) {
    requested.set(item.id, (requested.get(item.id) ?? 0) + item.prog);

    if (item.additional !== undefined && item.additional !== null) {
      additional.set(item.id, item.additional);
    }
  }

  for (const serviceId of new Set(requests.map((r) => r.id))) {
    const service = servicesById.get(serviceId);

    if (!service || service.id_obra !== workId) {
      return { type: 'not_owned', serviceId };
    }

    const label =
      `${service.operacao ?? ''} ${service.ponto ?? ''}`.trim() ||
      String(serviceId);

    if (service.qtde_real === 0 || discardedByHistory.has(serviceId)) {
      return { type: 'discarded', label };
    }

    if (service.viabilizado === null || service.viabilizado === undefined) {
      continue;
    }

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

// ─── Reagendamento e finalização (regras 1 e 2) ─────────────────────────
export interface ScheduleExecutionRow {
  id: number;
  id_servico: number;
  prog: number | null;
  real: number | null;
  status: string | null;
}

export interface ReschedulePlan {
  /** Linhas a marcar como REPROGRAMADO agora: sem apontamento e parciais EXECUTADO. */
  releasedRowIds: number[];
  /** Serviços cujos totalizadores têm de ser recalculados. */
  affectedServiceIds: number[];
  /** Há itens a reprogramar (a marcar agora ou já REPROGRAMADO no apontamento). */
  hasPendingItems: boolean;
  /** A programação tem execução lançada (real > 0). */
  hasExecution: boolean;
}

/**
 * Regra 2: o executado NUNCA é perdido. As linhas parciais passam a
 * REPROGRAMADO mas mantêm o real, que continua a contar como executado;
 * o que faltou volta ao saldo para ser reprogramado.
 * Regra 1: NAO_EXECUTADO (descartado) não é reprogramado.
 */
export function planReschedule(rows: ScheduleExecutionRow[]): ReschedulePlan {
  const toMark = rows.filter(
    (r) => isNotYetReported(r) || (isExecuted(r) && isPartial(r)),
  );
  const alreadyRescheduled = rows.filter(isRescheduled);
  const toReschedule = [...toMark, ...alreadyRescheduled];

  return {
    releasedRowIds: toMark.map((r) => r.id),
    affectedServiceIds: [...new Set(toReschedule.map((r) => r.id_servico))],
    hasPendingItems: toReschedule.length > 0,
    hasExecution: rows.some(hasRealExecution),
  };
}

/**
 * Estado da programação a partir das linhas:
 * - itens a reprogramar, sem execução → REAGENDADA
 * - itens a reprogramar, com execução → PARCIAL
 * - nada a reprogramar (tudo executado e/ou descartado) → EXECUTADA
 */
export function resolveScheduleOutcome(plan: ReschedulePlan): number {
  if (plan.hasPendingItems) {
    return plan.hasExecution
      ? ScheduleStatus.PARCIAL
      : ScheduleStatus.REAGENDADA;
  }

  return ScheduleStatus.EXECUTADA;
}

// ─── Adaptador ──────────────────────────────────────────────────────────
/**
 * Formato mínimo de uma linha do getServiceScheduleHistory.
 * O `status` é obrigatório: o TypeScript acusa as queries que não o tragam.
 */
export interface HistoryRow {
  id_programacao: number;
  id_servico: number;
  prog: number | null;
  real: number | null;
  status: string | null;
  servicos?: {
    id_material?: number | null;
    materiais?: unknown | null;
  } | null;
}

/** Linha do getServiceScheduleHistory -> ScheduleItem. */
export const fromHistoryRow = (row: HistoryRow): ScheduleItem => ({
  scheduleId: row.id_programacao,
  serviceId: row.id_servico,
  prog: row.prog,
  real: row.real,
  isMaterial:
    row.servicos?.id_material !== undefined
      ? row.servicos.id_material !== null
      : row.servicos?.materiais !== null,
  status: row.status as ServiceExecutionStatus | null,
});
