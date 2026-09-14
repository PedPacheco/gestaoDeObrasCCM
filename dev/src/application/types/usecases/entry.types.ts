export type GetEntryOfWorksInput = {
  ano: number;
  idRegional?: number[];
  idMunicipio?: number[];
  idGrupo?: number[];
  idTipo?: number[];
  idParceira?: number[];
  idCircuito?: number[];
};

export type GetEntryOfWorksByDayInput = {
  dataInicial?: string;
  dataFinal?: string;
  idRegional?: number[];
  idMunicipio?: number[];
  idGrupo?: number[];
  idTipo?: number[];
  idParceira?: number[];
};

export type GetValuesFromEntryOutput = {
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
};

export type EntryWorkOutput = {
  id: number;
  ovnota: string | null;
  pep: string | null;
  diagrama: string | null;
  ordem_dci: string | null;
  ordem_dcd: string | null;
  ordem_dca: string | null;
  ordem_dcim: string | null;
  entrada: Date;
  prazo: number;
  prazo_fim: Date;
  qtde_planejada: number;
  mo_planejada: number;
  observ_obra: string | null;
  tipos: string;
  turmas: string;
  municipios: string;
};

export type GetEntryOfWorksByDayOutput = {
  works: EntryWorkOutput[];
  totals: {
    total_obras: number;
    total_mo_planejada: number;
    total_qtde_planejada: number;
  };
};
