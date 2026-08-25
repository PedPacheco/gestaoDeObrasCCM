export type FilterCondition = string | number | number[];

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
  ovnotaExec?: boolean;
  empreendimento?: boolean;
  restricao?: boolean;
  tipoRestricao?: string[];
  tecnico?: boolean;
  statusSap?: boolean;
};

export type SelectOption = {
  id: number;
};

export type RegionalFilterOutput = {
  id: number;
  regional: string;
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

export type OvnotaFilterOutput = {
  id: number;
  ovnota: string;
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

export type GetFiltersOutput = {
  regional?: RegionalFilterOutput[];
  parceira?: PartnerFilterOutput[];
  municipio?: CityFilterOutput[];
  status?: StatusFilterOutput[];
  statusProgramacao?: StatusProgramadoFilterOutput[];
  conjunto?: ConjuntoFilterOutput[];
  ovnota?: OvnotaFilterOutput[];
  ovnotaExec?: OvnotaFilterOutput[];
  empreendimento?: EmpreendimentoFilterOutput[];
  restricao?: RestricaoFilterOutput[];
  tecnico?: TecnicoFilterOutput[];
  statusSap?: StatusSapFilterOutput[];
};
