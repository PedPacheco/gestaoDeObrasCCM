export type OperationType = 'insert' | 'update';

export type AuxiliaryBaseMarketResponse = {
  id: number;
  obra: string | null;
  pep: string | null;
  diagrama: string | null;
  entrada: Date | null;
  municipio: number | null;
  tipo: number | null;
  parceira: number | null;
  circuito: number | null;
  prazo: number | null;
  prazoTotal: Date | null;
  prazoTexto: string | null;
  moEmpresa: number | null;
  moCliente: number | null;
  moPlanejada: number | null;
  referencia: string | null;
  observacao: string | null;
  statusOv: number | null;
  statusPep: string | null;
  statusDiagrama: string | null;
  equipeNumPedido: string | null;
};

export type AuxiliaryBaseNotesResponse = {
  obra: string;
  pep: string;
  dci: string;
  dcd: string;
  dca: string;
  dcim: string;
  entrada: Date;
  prazo: string;
  referencia: string;
  mo_plan: number;
  qtde_plan: number;
  municipio: number;
  empreendimento: number;
  tipo: number;
  parceira: number;
  circuito: number;
  tecnico: number;
  capex_mo_plan: number;
  capex_mat_plan: number;
  anoplan: number;
  ehRda: boolean;
};

export type NotesInput = {
  campo_ordenacao: string;
  pep: string;
  ordem_dci: string;
  ordem_dcd: string;
  ordem_dca: string;
  ordem_dcim: string;
  conjunto: string;
  texto_breve: string;
  grp_plnj_pm: string;
  denominacao: string;
};

export type NoteInsertInput = NotesInput & {
  ehRda: boolean;
};

export type InsertAuxiliaryMarketInput = {
  obra: string;
  pep: string;
  diagrama: string;
  entrada: Date;
  gpm: string;
  tipo: string;
  circuito: string;
  prazoTexto: string;
  statusOv: number;
  statusDiagrama: string;
  statusPep: string;
  equipeNumPedido: string;
  moCliente: number;
  moEmpresa: number;
};

export type InsertNotesOutput = {
  insertedCount: number;
  skippedNotes: string[];
};

export type ValidationResult = {
  validatedData: NotesInput[];
  skippedNotes: string[];
};

export type SkipItemResult = {
  noteExists: boolean;
  orderExists: boolean;
};

export type ExistingOrderInput = {
  ordem_dci?: string;
  ordem_dcd?: string;
  ordem_dca?: string;
  ordem_dcim?: string;
};
