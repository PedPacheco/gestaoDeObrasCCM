import {
  Complaint,
  ComplaintOutcome,
  ComplaintRecordType,
  DeadlineState,
} from '../entities/complaints/complaints.entity';
import {
  ComplaintsMetrics,
  ContractorTrend,
  CurrentScenarioItem,
  MonthlyBacklog,
  NameValue,
  NoteSummary,
  ReasonsByContractor,
} from '../entities/complaints/complaintsMetrics';

// This file only aggregates. Rules about a single complaint live in the entity.

const WINDOW_MONTHS = 8;

const OUTCOME_LABEL: Record<ComplaintOutcome, string> = {
  upheld: 'Procedente',
  dismissed: 'Improcedente',
  undefined: 'Não definido',
};

const DEADLINE_LABEL: Record<DeadlineState, string> = {
  onTime: 'Dentro do prazo',
  overdue: 'Fora do prazo',
  noDueDate: 'Sem vencimento',
};

const RECORD_TYPE_LABEL: Record<ComplaintRecordType, string> = {
  complaint: 'Reclamação',
  ombudsman: 'Ouvidoria',
  undefined: 'Não definido',
};

// ---- helpers ----

const pct1 = (num: number, den: number): number =>
  den > 0 ? Math.round((num / den) * 1000) / 10 : 0;

const inc = (m: Map<string, number>, k: string) =>
  m.set(k, (m.get(k) ?? 0) + 1);

/** Adds `delta` months to a 'YYYY-MM' key. */
function addMonths(key: string, delta: number): string {
  const [y, m] = key.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + delta, 1)).toISOString().slice(0, 7);
}

function monthLabel(key: string): string {
  const [year, month] = key.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, 15)); // mid-month: no timezone rollover
  return date
    .toLocaleDateString('pt-BR', {
      month: 'short',
      year: '2-digit',
      timeZone: 'UTC',
    })
    .replace('.', '');
}

/** Counts by key (text already cleaned by the entity), largest first, ties alphabetical. */
function countBy(
  rows: Complaint[],
  pick: (c: Complaint) => string,
): NameValue[] {
  const counts = new Map<string, number>();
  rows.forEach((c) => {
    const key = pick(c);
    if (key) inc(counts, key);
  });
  return [...counts.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value || a.name.localeCompare(b.name));
}

function countStates(
  rows: Complaint[],
  today: string,
): Record<DeadlineState, number> {
  const acc: Record<DeadlineState, number> = {
    onTime: 0,
    overdue: 0,
    noDueDate: 0,
  };
  rows.forEach((c) => {
    acc[c.deadlineState(today)] += 1;
  });
  return acc;
}

// ---- builders ----

function buildMonthlyBacklog(
  rows: Complaint[],
  today: string,
): MonthlyBacklog[] {
  const opened = new Map<string, number>();
  const closed = new Map<string, number>();
  const overdue = new Map<string, number>();

  rows.forEach((c) => {
    const openedKey = c.openedMonth;
    if (openedKey) {
      inc(opened, openedKey);
      if (c.isOverdue(today)) inc(overdue, openedKey);
    }
    const closedKey = c.completionMonth;
    if (closedKey) inc(closed, closedKey);
  });

  // Fixed calendar window: last N months up to the current one, including months with no activity.
  // Future months (typos/placeholders in the source data) fall outside automatically.
  const todayKey = today.slice(0, 7);
  const keys = Array.from({ length: WINDOW_MONTHS }, (_, i) =>
    addMonths(todayKey, i - WINDOW_MONTHS + 1),
  );
  const start = keys[0];

  // Backlog accumulated before the window becomes the opening balance, so it doesn't "reset".
  let cumOpened = 0;
  let cumClosed = 0;
  opened.forEach((v, k) => {
    if (k < start) cumOpened += v;
  });
  closed.forEach((v, k) => {
    if (k < start) cumClosed += v;
  });

  return keys.map<MonthlyBacklog>((key) => {
    cumOpened += opened.get(key) ?? 0;
    cumClosed += closed.get(key) ?? 0;
    return {
      key,
      label: monthLabel(key),
      Entradas: opened.get(key) ?? 0,
      Encerradas: closed.get(key) ?? 0,
      Passivos: Math.max(cumOpened - cumClosed, 0),
      ForaPrazo: overdue.get(key) ?? 0,
    };
  });
}

function buildContractorTrends(
  rows: Complaint[],
  months: { key: string; label: string }[],
  today: string,
): ContractorTrend[] {
  const windowKeys = new Set(months.map((m) => m.key));
  type Acc = {
    opened: Map<string, number>;
    overdue: Map<string, number>;
    total: number;
  };
  const byContractor = new Map<string, Acc>();

  // Single pass over the rows.
  for (const c of rows) {
    const key = c.openedMonth;
    if (!c.contractor || !key || !windowKeys.has(key)) continue; // only what the chart shows

    const acc = byContractor.get(c.contractor) ?? {
      opened: new Map<string, number>(),
      overdue: new Map<string, number>(),
      total: 0,
    };
    inc(acc.opened, key);
    if (c.isOverdue(today)) inc(acc.overdue, key);
    acc.total += 1;
    byContractor.set(c.contractor, acc);
  }

  return [...byContractor.entries()]
    .sort(([na, a], [nb, b]) => b.total - a.total || na.localeCompare(nb))
    .map(([empreiteira, acc]) => ({
      empreiteira,
      data: months.map((m) => ({
        key: m.key,
        label: m.label,
        Entradas: acc.opened.get(m.key) ?? 0,
        ForaPrazo: acc.overdue.get(m.key) ?? 0,
      })),
    }));
}

function buildCurrentScenario(
  pending: Complaint[],
  today: string,
): CurrentScenarioItem[] {
  const map = new Map<string, CurrentScenarioItem>();

  pending.forEach((c) => {
    if (!c.contractor) return;
    const entry = map.get(c.contractor) ?? {
      empreiteira: c.contractor,
      dentroPrazo: 0,
      foraPrazo: 0,
      semVencimento: 0,
    };
    switch (c.deadlineState(today)) {
      case 'overdue':
        entry.foraPrazo += 1;
        break;
      case 'onTime':
        entry.dentroPrazo += 1;
        break;
      case 'noDueDate':
        entry.semVencimento += 1;
        break;
    }
    map.set(c.contractor, entry);
  });

  const total = (i: CurrentScenarioItem) =>
    i.dentroPrazo + i.foraPrazo + i.semVencimento;

  return [...map.values()].sort(
    (a, b) => total(b) - total(a) || a.empreiteira.localeCompare(b.empreiteira),
  );
}

function buildPendingReasons(pending: Complaint[]): ReasonsByContractor[] {
  const by = new Map<string, Map<string, number>>();

  pending.forEach((c) => {
    if (!c.contractor) return;
    const inner = by.get(c.contractor) ?? new Map<string, number>();
    inc(inner, c.reason);
    by.set(c.contractor, inner);
  });

  const total = (g: ReasonsByContractor) =>
    g.itens.reduce((acc, i) => acc + i.count, 0);

  return [...by.entries()]
    .map(([empreiteira, inner]) => ({
      empreiteira,
      itens: [...inner.entries()]
        .map(([motivo, count]) => ({ motivo, count }))
        .sort((a, b) => b.count - a.count || a.motivo.localeCompare(b.motivo)),
    }))
    .sort(
      (a, b) =>
        total(b) - total(a) || a.empreiteira.localeCompare(b.empreiteira),
    );
}

function buildNotes(
  rows: Complaint[],
  outcome: ComplaintOutcome,
): NoteSummary[] {
  return rows
    .filter((c) => c.outcome === outcome)
    .map((c) => ({
      id: c.id,
      nota: c.note,
      empreiteira: c.contractor,
      municipio: c.municipality,
    }))
    .sort((a, b) => a.nota.localeCompare(b.nota, undefined, { numeric: true }));
}

// ---- entry point ----

/** Pure function: same input + same `today` ('YYYY-MM-DD', Brasília time) => same output. */
export function buildComplaintsMetrics(
  rows: Complaint[],
  today: string,
): ComplaintsMetrics {
  const total = rows.length;
  const pending = rows.filter((c) => c.isPending);
  const concluded = rows.filter((c) => c.isConcluded).length;

  const states = countStates(rows, today);
  const pendingStates = countStates(pending, today);

  const upheld = rows.filter((c) => c.outcome === 'upheld').length;
  const dismissed = rows.filter((c) => c.outcome === 'dismissed').length;

  const monthlyBacklog = buildMonthlyBacklog(rows, today);

  return {
    // KPIs
    total,
    empreiteirasCount: new Set(rows.map((c) => c.contractor).filter(Boolean))
      .size,
    regionaisCount: new Set(rows.map((c) => c.region).filter(Boolean)).size,
    pendentes: pending.length,
    pendentesDentroPrazo: pendingStates.onTime,
    pendentesForaPrazo: pendingStates.overdue,
    pendentesSemVencimento: pendingStates.noDueDate,
    concluidas: concluded,
    taxaConclusao: pct1(concluded, total),
    foraDoPrazo: states.overdue,
    dentroDoPrazo: states.onTime,
    semVencimento: states.noDueDate,
    pctDentroDoPrazo: pct1(states.onTime, states.onTime + states.overdue), // only rows with a due date
    procedentes: upheld,
    improcedentes: dismissed,
    pctProcedencia: pct1(upheld, upheld + dismissed),
    reclamacoes: rows.filter((c) => c.recordType === 'complaint').length,
    ouvidorias: rows.filter((c) => c.recordType === 'ombudsman').length,

    // Distributions
    statusCounts: countBy(rows, (c) => c.status),
    regionalCounts: countBy(rows, (c) => c.region),
    empreiteiraCounts: countBy(rows, (c) => c.contractor).slice(0, 10),
    tipoCounts: countBy(rows, (c) => c.complaintType).slice(0, 10),
    resultadoCounts: countBy(rows, (c) => OUTCOME_LABEL[c.outcome]),
    prazoCounts: countBy(rows, (c) => DEADLINE_LABEL[c.deadlineState(today)]),
    tipoRegistroCounts: countBy(rows, (c) => RECORD_TYPE_LABEL[c.recordType]),

    // Time series and breakdowns
    acumuladoPorMes: monthlyBacklog,
    empreiteiraTrends: buildContractorTrends(rows, monthlyBacklog, today),
    cenarioAtual: buildCurrentScenario(pending, today),
    motivosPendentes: buildPendingReasons(pending),
    notasPorResultado: {
      procedente: buildNotes(rows, 'upheld'),
      improcedente: buildNotes(rows, 'dismissed'),
    },
  };
}
