export type ScheduleStatus = {
  status_programacao: string;
};

export type WorkUser = {
  nome: string;
};

export type Technician = {
  tecnico: string | null;
};

export type ExecutionRestriction = {
  restricao: string | null;
};

export type ScheduleTeam = {
  equipes: {
    equipe: string;
  };
};

export type WorkDetailsSchedule = {
  id: number;
  criado_em: Date;
  data_prog: Date;
  hora_ini: Date;
  hora_ter: Date;
  tipo_servico: string;
  prog: number;
  exec: number | null;
  observacao_programacao: string | null;
  equip_desligado: string | null;
  chi: number | null;
  num_dp: string | null;
  chave_provisoria: boolean | null;
  equipe_linha_morta: number | null;
  equipe_linha_viva: number | null;
  equipe_regularizacao: number | null;
  tecnicos: Technician;
  programacoes_restricao_execucao: ExecutionRestriction;
  programacoes_servicos: ScheduleTeam[];
  nome_responsavel_execucao: string | null;
  confirmada: boolean;
  validada: boolean;
  reprovada: boolean;
  status_programacao: ScheduleStatus;
  observacao_restricao: string | null;
  observacao_execucao: string | null;
  id_restricao_execucao: number;
  id_restricao_prog1: number;
  responsabilidade1: string | null;
  nome_responsavel: string | null;
  area_responsavel1: string | null;
  status_restricao1: string | null;
  data_resolucao1: Date | null;
  id_restricao_prog2: number;
  responsabilidade2: string | null;
  nome_responsavel2: string | null;
  area_responsavel2: string | null;
  status_restricao2: string | null;
  data_resolucao2: Date | null;
  usuario: WorkUser | null;
  usuario_ultima_atualizacao?: WorkUser | null;
};

export type WorkDetailsRepositoryResponse = {
  id: number;
  ovnota: string;
  pep: string | null;
  status_pep: string | null;
  diagrama: string | null;
  ordem_dci: string | null;
  ordem_dcd: string | null;
  ordem_dca: string | null;
  ordem_dcim: string | null;
  status_ov_sap: number | null;
  status_diagrama: string | null;
  status_usuario_diagrama: string | null;
  status_150: string | null;
  status_usuario_150: string | null;
  status_170: string | null;
  status_usuario_170: string | null;
  status_180: string | null;
  status_usuario_180: string | null;
  status_190: string | null;
  status_usuario_190: string | null;
  entrada: Date | null;
  prazo: number | null;
  executado: number | null;
  data_conclusao: Date | null;
  observ_obra: string | null;
  qtde_planejada: number | null;
  qtde_pend: number | null;
  mo_planejada: number | null;
  mo_pend: number | null;
  mo_final: number | null;
  referencia: string | null;
  capex_mat_pend: number | null;
  capex_mat_plan: number | null;
  capex_mo_pend: number | null;
  capex_mo_plan: number | null;
  data_empreitamento: Date | null;
  ano_plan: number | null;
  programacao_ponto_a_ponto: boolean | null;
  circuitos: { circuito: string; conjuntos: { conjunto: string | null } };
  relatorio_viabilidade?: {
    data_envio: Date;
    prazo_viabilidade: string;
    aprovada: boolean;
  } | null;
  empreendimento: { empreendimento: string | null };
  municipios: { municipio: string; regionais: { id: number } };
  tipos: { tipo_obra: string; id_grupo: number };
  id_turma: number;
  id_status: number;
  programacoes: WorkDetailsSchedule[];
};
