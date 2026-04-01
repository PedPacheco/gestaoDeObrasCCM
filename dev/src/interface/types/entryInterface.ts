interface Grupo {
  grupo: string;
}

interface Tipos {
  tipo_obra: string;
  grupos: Grupo;
}

export interface entryResponse {
  ovnota: string;
  mo_pend: number | null;
  mo_planejada: number;
  entrada: Date;
  tipos: Tipos;
}

interface TiposEntryDay {
  tipo_obra: string;
}

interface TurmasEntryDay {
  turma: string;
}

interface MunicipiosEntryDay {
  mun: string;
}

export interface EntryDayResponse {
  id: number;
  ovnota: string;
  pep: string;
  diagrama: string | null;
  ordem_dci: string;
  ordem_dcd: string;
  ordem_dca: string | null;
  ordem_dcim: string | null;
  entrada: Date;
  prazo: number;
  qtde_planejada: number;
  mo_planejada: number;
  observ_obra: string | null;
  tipos: TiposEntryDay;
  turmas: TurmasEntryDay;
  municipios: MunicipiosEntryDay;
}

export interface ReturnGetValuesFromEntry {
  tipo: string;
  grupo: string;
  total_entrada: number;
  total_entrada_qtde: number;
  jan_entrada: number;
  jan_entrada_qtde: number;
  fev_entrada: number;
  fev_entrada_qtde: number;
  mar_entrada: number;
  mar_entrada_qtde: number;
  abr_entrada: number;
  abr_entrada_qtde: number;
  mai_entrada: number;
  mai_entrada_qtde: number;
  jun_entrada: number;
  jun_entrada_qtde: number;
  jul_entrada: number;
  jul_entrada_qtde: number;
  ago_entrada: number;
  ago_entrada_qtde: number;
  set_entrada: number;
  set_entrada_qtde: number;
  out_entrada: number;
  out_entrada_qtde: number;
  nov_entrada: number;
  nov_entrada_qtde: number;
  dez_entrada: number;
  dez_entrada_qtde: number;
}
