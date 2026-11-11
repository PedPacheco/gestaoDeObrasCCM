export type FilterCondition = string;

export type GetFiltersInput = {
  regional?: boolean;
  parceira?: boolean;
  tipo?: boolean;
  municipio?: boolean;
  grupo?: boolean;
  circuito?: boolean;
  status?: boolean;
  statusProgramacao?: boolean;
  conjunto?: boolean;
  ovnota?: boolean;
  empreendimento?: boolean;
  restricao?: boolean;
  tipoRestricao?: string[];
  tecnico?: boolean;
  statusSap?: boolean;
  equipes?: boolean;
  notaD5?: boolean;
};

export type SelectOption = {
  id: number;
};

export type RegionalFilterOutput = {
  id: number;
  regional: string;
};

export type TypesOfWorkFilterOutput = {
  id: number;
  tipo_obra: string;
};

export type PartnerFilterOutput = {
  id: number;
  turma: string;
};

export type CityFilterOutput = {
  id: number;
  municipio: string;
  id_regional: number;
};

export type StatusFilterOutput = {
  id: number;
  status: string;
};

export type StatusProgramadoFilterOutput = {
  id: number;
  status_programacao: string;
};

export type ConjuntoFilterOutput = {
  id: number;
  conjunto: string;
};

export type OvnotaFilterRow = {
  id: number;
  ovnota: string | null;
  data_conclusao: Date | null;
  diagrama: string | null;
  ordem_dci: string | null;
  ordem_dca: string | null;
  ordem_dcd: string | null;
  ordem_dcim: string | null;
};

/** Item devolvido ao cliente no filtro de OV/Nota. */
export type OvnotaFilterOutput = {
  id: number;
  ovnota: string | null;
  concluida: boolean;
  ordemDiagrama: string | null;
};

export type EmpreendimentoFilterOutput = {
  id: number;
  empreendimento: string;
  id_regional: number;
  id_grupo: number;
};

export type RestricaoFilterOutput = {
  id: number;
  restricao: string;
  tipo_restricao: string;
  responsabilidade: string;
};

export type TecnicoFilterOutput = {
  id: number;
  tecnico: string;
};

export type StatusSapFilterOutput = {
  id: number;
  status_sap: string;
};

export type NotasD5FilterOutput = {
  id: number;
  nota_d5: string;
};

export type GetFiltersOutput = {
  regional?: RegionalFilterOutput[];
  tiposObra?: TypesOfWorkFilterOutput[];
  parceira?: PartnerFilterOutput[];
  municipio?: CityFilterOutput[];
  status?: StatusFilterOutput[];
  statusProgramacao?: StatusProgramadoFilterOutput[];
  conjunto?: ConjuntoFilterOutput[];
  ovnota?: OvnotaFilterOutput[];
  empreendimento?: EmpreendimentoFilterOutput[];
  restricao?: RestricaoFilterOutput[];
  tecnico?: TecnicoFilterOutput[];
  statusSap?: StatusSapFilterOutput[];
  notaD5?: NotasD5FilterOutput[];
};
