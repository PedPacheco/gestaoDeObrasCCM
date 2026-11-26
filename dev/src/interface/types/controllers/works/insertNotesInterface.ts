export interface InsertNotes {
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
}

export interface NotesEntriesInterface {
  obra: string;
  dci: string;
  dcd: string;
  dca: string;
  dcim: string;
  entrada: Date;
  prazo: string;
  referencia: string;
  aux_gpm: number;
  aux_empreendimento: number;
  aux_tipo: number;
  aux_turma: number;
  aux_circuito: number;
  aux_tecnico: number;
  anoplan: number;
  ehRda: boolean;
}
