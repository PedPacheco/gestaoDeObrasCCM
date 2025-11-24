export interface UndefinedItemsResponse {
  id: number;
  ovnota: string;
  data_conclusao: Date;
  municipios: { municipio: string };
  tipos: { tipo_obra: string };
  turmas: { turma: string };
  circuitos: { circuito: string };
}

export interface ScheduleErrorResponse {
  id: number;
  ovnota: string;
  turmas: { turma: string };
  executado: number;
  programacoes: { prog: number }[];
}

export interface ZeroCapexResponse {
  id: number;
  ovnota: string;
  diagrama: string;
  ordem_dci: string;
  ordem_dcim: string;
  entrada: Date;
  municipios: { mun: string };
  tipos: { tipo_obra: string };
  mo_planejada: number;
  qtde_planejada: number;
}

export interface ExecutionDifferentialResponse {
  id: number;
  ovnota: string;
  executado: number;
  programacoes: { exec: number }[];
}

export interface DivergentConclusionResponse {
  id: number;
  ovnota: string;
  data_conclusao: Date;
  programacoes: { data_prog: Date }[];
}

export interface WorksWithoutYearPlanResponse {
  id: number;
  ovnota: string;
  ordem_dci: string;
  ano_plan: number;
}

export interface RepeatedWorksResponse {
  id: number;
  ovnota: string;
  diagrama: string;
  ordem_dci: string;
  ordem_dca: string;
  ordem_dcd: string;
  ordem_dcim: string;
}
