// ── goals.ts ─────────────────────────────────────────────────────────────────
// Fonte única de verdade para todos os tipos do domínio de Metas/Recomposição.
// Importado por hooks, services e componentes — nunca redefinido inline.

export interface MonthValues {
  meta: number;
  prog: number;
  real: number;
}

export type MonthKey =
  | "jan"
  | "fev"
  | "mar"
  | "abr"
  | "mai"
  | "jun"
  | "jul"
  | "ago"
  | "set"
  | "out"
  | "nov"
  | "dez";

export interface Goal {
  id_tipo: number;
  id_parceira: number;
  id_regional: number;
  tipo_obra: string;
  turma: string;
  regional: string;
  empreendimento?: string;
  anocalc: number;
  carteira: number;
  jan: MonthValues;
  fev: MonthValues;
  mar: MonthValues;
  abr: MonthValues;
  mai: MonthValues;
  jun: MonthValues;
  jul: MonthValues;
  ago: MonthValues;
  set: MonthValues;
  out: MonthValues;
  nov: MonthValues;
  dez: MonthValues;
}

export interface FilterOption {
  id: string;
  [key: string]: string | number;
}

export interface FiltersData {
  regional: { id: string; regional: string }[];
  parceira: { id: string; turma: string }[];
  tipo: { id: string; tipo_obra: string; id_grupo: number }[];
}

export interface GroupedRow {
  regional: string;
  meta: number;
  prog: number;
  real: number;
  carteira: number;
  taxa: number;
  children: ParceiraRowInterface[];
}

export interface ParceiraRowInterface {
  turma: string;
  meta: number;
  prog: number;
  real: number;
  carteira: number;
  taxa: number;
  children: TipoRow[];
}

export interface TipoRow {
  tipo_obra: string;
  meta: number;
  prog: number;
  real: number;
  carteira: number;
  taxa: number;
}

// Dados derivados para os gráficos (calculados no hook, não no componente)
export interface MonthlyTotal {
  mes: string;
  Meta: number;
  Programado: number;
  Realizado: number;
}

export interface CumulativePoint {
  mes: string;
  "Meta Acum.": number;
  // "Prog Acum.": number;
  // "Diferença Acum.": number;
  "Prog+Real Acum."?: number;
  Projeção?: number;
}

export interface PieSlice {
  name: string;
  value: number;
}

export interface BarParceira {
  name: string;
  Meta: number;
  Realizado: number;
}

// Agregado financeiro por parceira (usado no KPI drill-down)
export interface ParceiraAggregate {
  meta: number;
  prog: number;
  real: number;
}

export interface DashboardMetrics {
  // KPIs
  totalMeta: number;
  totalReal: number;
  totalProg: number;
  totalCarteira: number;
  taxaReal: number;
  // Dados de gráfico
  monthlyTotals: MonthlyTotal[];
  cumulative: CumulativePoint[];
  pieByTipo: PieSlice[];
  barByParceira: BarParceira[];
  tipoKpiMap: Map<string, ParceiraAggregate>;
  groupedRows: GroupedRow[];
  // Projeção — Curva S
  totalMetaFull: number;
  lastDataIdx: number;
  // cumulativeDataAtCutoff: number;
  // avgMonthlyRate: number;
  // remaining: number;
  monthsToEnd: number;
  // rateNeededForDec: number;
  naturallyHitsThisYear: boolean;
  // projByDec: number;
  projectedCrossMonth: string | null;
}
