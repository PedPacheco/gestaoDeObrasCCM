export type GetRestrictionsAdvancePartnerResponse = {
  mes: string;
  data_ref: Date;
  total: number;
  sem_restricao: number;
};

export type GetGripPartnerResponse = {
  semana: string;
  total: number;
  executada: number;
  executada_parcial: number;
  nao_executada: number;
  nao_informada: number;
};

export type GetReaschedulingReasonsResponse = {
  ovnota: string;
  motivo: string;
  observacao_execucao: string;
  data_prog: Date;
  id_obra: number;
  responsavel: string;
  mo_nao_executada: number;
};

export type GetSparklinesByPartnerAderenciaResponse = {
  total: number;
  parceira: string;
  semana: string;
  executada: number;
};

export type GetSparklinesByPartnerEliminacaoResponse = {
  total: number;
  parceira: string;
  semana: string;
  sem_restricao: boolean;
};

export type GetWeeksByPartnerResponse = {
  parceira: string;

  semanas: number;
};
