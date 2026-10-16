export type ComplaintOutcome = 'upheld' | 'dismissed' | 'undefined';
export type ComplaintRecordType = 'complaint' | 'ombudsman' | 'undefined';
export type DeadlineState = 'onTime' | 'overdue' | 'noDueDate';

// As datas são sempre 'YYYY-MM-DD' (sem hora nem fuso): a comparação de prazos é lexicográfica.
export interface ComplaintProps {
  id: string;
  note: string;
  contractor: string;
  region: string;
  municipality: string;
  status: string;
  complaintType: string | null;
  rootCause: string | null;
  observation: string | null;
  outcomeLabel: string | null; // valor bruto de procedente_improcedente
  recordTypeLabel: string | null; // valor bruto de reclamacao_ou_ouvidoria
  openedDate: string | null;
  completionDate: string | null;
  dueDate: string | null;
}

const PENDING_STATUSES = [
  'pendente atendimento',
  'pendente area',
  'pendente obra',
];
const CONCLUDED_STATUSES = ['encerrado', 'medida transferida'];

/** Minúsculas, sem acentos e sem espaços nas pontas: só para comparações. */
const norm = (s: string | null | undefined) =>
  (s ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();

/** Texto limpo para exibição; vazio passa a null. */
const clean = (s: string | null | undefined): string | null => {
  const t = (s ?? '').trim();
  return t || null;
};

export class Complaint {
  readonly id: string;
  readonly note: string;
  readonly contractor: string;
  readonly region: string;
  readonly municipality: string;
  readonly status: string;
  readonly complaintType: string;
  readonly rootCause: string | null;
  readonly observation: string | null;
  readonly outcomeLabel: string;
  readonly openedDate: string | null;
  readonly completionDate: string | null;
  readonly dueDate: string | null;
  private readonly recordTypeLabel: string | null;

  private constructor(p: ComplaintProps) {
    this.id = p.id;
    this.note = clean(p.note) ?? '';
    this.contractor = clean(p.contractor) ?? '';
    this.region = clean(p.region) ?? '';
    this.municipality = clean(p.municipality) ?? '';
    this.status = clean(p.status) ?? '';
    this.complaintType = clean(p.complaintType) ?? '';
    this.rootCause = clean(p.rootCause);
    this.observation = clean(p.observation);
    this.outcomeLabel = clean(p.outcomeLabel) ?? '';
    this.recordTypeLabel = clean(p.recordTypeLabel);
    this.openedDate = p.openedDate;
    this.completionDate = p.completionDate;
    this.dueDate = p.dueDate;
  }

  /** Reidrata a partir da persistência (sem validação: os dados já foram aceites na importação). */
  static restore(props: ComplaintProps): Complaint {
    return new Complaint(props);
  }

  // ---- regras de negócio ----

  get isPending(): boolean {
    return PENDING_STATUSES.includes(norm(this.status));
  }

  get isConcluded(): boolean {
    return CONCLUDED_STATUSES.includes(norm(this.status));
  }

  /** 'improcedente' contém 'procedente': a ordem das verificações importa. */
  get outcome(): ComplaintOutcome {
    const s = norm(this.outcomeLabel);
    if (s.startsWith('improcedente')) return 'dismissed';
    if (s.startsWith('procedente')) return 'upheld';
    return 'undefined';
  }

  get recordType(): ComplaintRecordType {
    const s = norm(this.recordTypeLabel);
    if (s.startsWith('ouvidoria')) return 'ombudsman';
    if (s.startsWith('reclamacao')) return 'complaint';
    return 'undefined';
  }

  /** Causa raiz; se não houver, observação; depois tipo de reclamação. */
  get reason(): string {
    return (
      this.rootCause ??
      this.observation ??
      (this.complaintType || 'Não especificado')
    );
  }

  get openedMonth(): string | null {
    return this.openedDate?.slice(0, 7) ?? null;
  }

  get completionMonth(): string | null {
    return this.completionDate?.slice(0, 7) ?? null;
  }

  /** Compara o vencimento com a conclusão real (ou com hoje, se ainda estiver aberta). */
  deadlineState(today: string): DeadlineState {
    if (!this.dueDate) return 'noDueDate';
    return (this.completionDate ?? today) > this.dueDate ? 'overdue' : 'onTime';
  }

  isOverdue(today: string): boolean {
    return this.deadlineState(today) === 'overdue';
  }
}
