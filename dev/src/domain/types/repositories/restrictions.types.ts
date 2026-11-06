export type ScheduleRestrictions = {
  id: number;
  ovnota: string;
  diagrama: string | null;
  ordem_dci: string | null;
  ordem_dcim: string | null;
  executado: number;
  mun: string;
  tipo_obra: string;
  parceira: string;
  prog_id: number;
  data_prog: Date;
  prog: number;
  exec: number | null;
  observacao_restricao: string | null;
  id_restricao_prog1: number;
  restricao1: string;
  responsabilidade1: string | null;
  nome_responsavel: string | null;
  area_responsavel1: string | null;
  status_restricao1: string | null;
  data_resolucao1: Date | null;
  id_restricao_prog2: number;
  restricao2: string;
  responsabilidade2: string | null;
  nome_responsavel2: string | null;
  area_responsavel2: string | null;
  status_restricao2: string | null;
  data_resolucao2: Date | null;
};

export type PublicationRestriction = {
  id: number;
  ovnota: string | null;
  ordemdiagrama: string | null;
  executado: boolean;
  status: string;
  data_conclusao: Date | null;
  mun: string;
  regional: string;
  id_turma: number;
  prazo_fim: Date | null;
  id_grupo: number;
  tipo_obra: string;
  parceira: string;
  id_restricao_publicacao: number;
  restricao: string;
  criado_em: Date;
  id_restricao: number;
  responsabilidade: string | null;
  nome_responsavel: string | null;
  status_restricao: string | null;
  data_resolucao: Date | null;
  observacao: string | null;
  observacao_construcao: string | null;
  nome: string;
};

export type ScheduleRestrictionsTotalsResponse = {
  total_obras: string;
};

export type GetScheduleRestrictionsResponse = {
  works: ScheduleRestrictions[];
  totals: ScheduleRestrictionsTotalsResponse;
};

export type GetPublicationRestricionResponse = {
  works: PublicationRestriction[];
};

export type GetPublicationRestrictionByWorkIdResponse = {
  restricoes: {
    restricao: string;
  };
  usuario: {
    nome: string;
  };
  responsabilidade: string | null;
  nome_responsavel: string | null;
  status_restricao: string | null;
  data_resolucao: Date | null;
  criado_em: Date;
  observacao: string | null;
  observacao_construcao: string | null;
};
