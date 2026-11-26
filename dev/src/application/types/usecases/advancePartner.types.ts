export type GetRestrictionsAdvancePartnerInput = {
  dataInicial?: string;
  dataFinal?: string;
  idRegional?: number[];
  idParceira?: number[];
  responsabilidade?: string;
};

export type RestrictionsAdvancePartnerOutput = {
  month: string;
  total: number;
  withoutRestriction: number;
  withRestriction: number;
  pct: number;
};

export type GripPartnerOutput = {
  week: string;
  total: number;
  executed: number;
  partialExecuted: number;
  notExecuted: number;
  notInformed: number;
  pct: number;
};

export type SparklinePoint = {
  semana: string;
  pct: number;
};

export type SparklinePartnerOutput = {
  parceira: string;
  aderencia: SparklinePoint[];
  eliminacao: SparklinePoint[];
};

export type WeeksByPartnerOutput = {
  parceira: string;
  semanas: number;
};
