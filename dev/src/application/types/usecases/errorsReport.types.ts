export type FindRepeatedWorksResponse = {
  id: number;
  ovnota: string | null;
  diagrama: string | null;
  ordem_dci: string | null;
  ordem_dca: string | null;
  ordem_dcd: string | null;
  ordem_dcim: string | null;
};

export type UndefinedItemOutput = {
  id: number;
  ovnota: string | null;
  municipio: string;
  circuito: string;
  parceira: string;
  tipo: string;
  dataConclusao: Date | null;
};

export type ScheduleErrorOutput = {
  id: number;
  ovnota: string | null;
  parceira: string | null;
  executado: number | null;
  prog: number;
  total: number;
};

export type ZeroCapexOutput = {
  id: number;
  ovnota: string | null;
  ordemDiagrama: string | null;
  entrada: Date;
  municipio: string;
  tipo: string;
  moPlanejada: number;
  qtdePlanejada: number;
};

export type ExecutionDifferentialOutput = {
  id: number;
  ovnota: string | null;
  executado: number;
  somaExec: number;
};

export type DivergentConclusionOutput = {
  id: number;
  ovnota: string | null;
  dataConclusao: Date;
  dataProgramada: Date;
};

export type WorkWithoutYearPlanOutput = {
  id: number;
  ovnota: string | null;
  ordemDci: string | null;
  anoPlano: number | null;
};
