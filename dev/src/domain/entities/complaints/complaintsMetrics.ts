// Type names are English; the JSON keys below are the API contract already consumed by the
// frontend charts (some double as chart labels), so they are intentionally unchanged.
// New keys are additive only; existing keys are never renamed.

export interface NameValue {
  name: string;
  value: number;
}

export interface MonthlyBacklog {
  key: string; // 'YYYY-MM'
  label: string; // e.g. 'out 26'
  Entradas: number;
  Encerradas: number;
  Passivos: number;
  ForaPrazo: number;
}

export interface ContractorTrendPoint {
  key: string;
  label: string;
  Entradas: number;
  ForaPrazo: number;
}

export interface ContractorTrend {
  empreiteira: string;
  data: ContractorTrendPoint[];
}

export interface CurrentScenarioItem {
  empreiteira: string;
  dentroPrazo: number;
  foraPrazo: number;
  semVencimento: number; // additive: pending items without a due date
}

export interface ReasonItem {
  motivo: string;
  count: number;
}

export interface ReasonsByContractor {
  empreiteira: string;
  itens: ReasonItem[];
}

export interface NoteSummary {
  id: string;
  nota: string;
  empreiteira: string;
  municipio: string;
}

export interface ComplaintsMetrics {
  // ---- KPIs ----
  total: number;
  empreiteirasCount: number;
  regionaisCount: number;
  pendentes: number;
  pendentesDentroPrazo: number;
  pendentesForaPrazo: number;
  pendentesSemVencimento: number; // additive
  concluidas: number;
  taxaConclusao: number;
  foraDoPrazo: number;
  dentroDoPrazo: number;
  semVencimento: number; // additive
  pctDentroDoPrazo: number; // over items with a due date only
  procedentes: number;
  improcedentes: number;
  pctProcedencia: number;
  reclamacoes: number; // additive
  ouvidorias: number; // additive

  // ---- Distributions ----
  statusCounts: NameValue[];
  regionalCounts: NameValue[];
  empreiteiraCounts: NameValue[];
  tipoCounts: NameValue[];
  resultadoCounts: NameValue[];
  prazoCounts: NameValue[];
  tipoRegistroCounts: NameValue[]; // additive

  // ---- Time series and breakdowns ----
  acumuladoPorMes: MonthlyBacklog[];
  empreiteiraTrends: ContractorTrend[];
  cenarioAtual: CurrentScenarioItem[];
  motivosPendentes: ReasonsByContractor[];
  notasPorResultado: {
    procedente: NoteSummary[];
    improcedente: NoteSummary[];
  };
}
