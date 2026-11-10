// domain/types/exportacaoObrasCarteira.types.ts

export type ExportWorksInPortfolioResponse = {
  id: bigint;
  id_obra: number | null;
  ovnota: string | null;
  pep: string | null;
  ordemdiagrama: string | null;
  ordem_dcd: string | null;
  ordem_dca: string | null;
  ordem_dcim: string | null;
  mun: string | null;
  regional: string | null;
  prazofim: Date | null;
  atraso: number | null;
  tipo_obra: string | null;
  qtde_planejada: number | null;
  qtde_pend: number | null;
  circuito: string | null;
  mo_planejada: number | null;
  mo_exec: number | null;
  mo_suspensa: number | null;
  observ_obra: string | null;
  turma: string | null;
  executado: number | null;
  entrada: Date | null;
  min_data_prog: Date | null;
  max_data_prog: Date | null;
  status: string | null;
  capex_plan: number | null;
  capex_pend: number | null;
  capex_mat_plan: number | null;
  capex_mo_plan: number | null;
  capex_mat_pend: number | null;
  capex_mo_pend: number | null;
  contagem_de_ocorrencias: bigint | null;
  hora_ini: Date | null;
  hora_ter: Date | null;
  conjunto: string | null;
  tipo_servico: string | null;
  chi: number | null;
  equipe_linha_morta: number | null;
  equipe_regularizacao: number | null;
  equipe_linha_viva: number | null;
  num_dp: string | null;
  grupo: string | null;
  referencia: string | null;
  data_empreitamento: Date | null;
  empreendimento: string | null;
  data_envio: Date | null;
  prazo_viabilidade: string | null;
  ano_plan: number | null;
};

export type ExportCompletedWorksResponse = {
  id: bigint;
  ovnota: string;
  pep: string | null;
  ordemdiagrama: string | null;
  ordem_dcd: string | null;
  ordem_dca: string | null;
  ordem_dcim: string | null;
  regional: string;
  mun: string;
  entrada: Date | null;
  data_conclusao: Date | null;
  prazofim: Date | null;
  tipo_obra: string;
  qtde_planejada: number | null;
  qtde_pend: number | null;
  circuito: string;
  mo_planejada: number | null;
  mo_exec: number | null;
  mo_suspensa: number | null;
  observ_obra: string | null;
  turma: string;
  executado: number | null;
  status: string;
  capex_plan: number | null;
  capex_pend: number | null;
  capex_mat_plan: number | null;
  capex_mo_plan: number | null;
  capex_mat_pend: number | null;
  capex_mo_pend: number | null;
  conjunto: string;
  empreendimento: string;
  data_empreitamento: Date | null;
  data_envio: Date | null;
  prazo_viabilidade: string | null;
  ano_plan: number | null;
};

export type ExportSchedulesResponse = {
  id: bigint;
  ovnota: string;
  pep: string | null;
  ordemdiagrama: string | null;
  ordem_dcd: string | null;
  ordem_dca: string | null;
  ordem_dcim: string | null;
  municipio: string;
  regional: string;
  data_conclusao: Date | null;
  parceira: string;
  mo_planejada: number | null;
  referencia: string | null;
  data_prog: Date | null;
  hora_ini: Date | null;
  hora_ter: Date | null;
  prog: number | null;
  exec: number | null;
  tipo_servico: string | null;
  num_dp: string | null;
  chi: number | null;
  chave_provisoria: boolean | null;
  equipe_linha_morta: number | null;
  equipe_linha_viva: number | null;
  equipe_regularizacao: number | null;
  equip_desligado: string | null;
  restricao_execucao: string;
  nome_do_responsavel_execucao: string | null;
  restricao_programacao: string;
  responsabilidade: string | null;
  nome_do_responsavel: string | null;
  area_responsavel: string | null;
  status_restricao: string | null;
  data_resolucao: Date | null;
  status: string;
  tipo_obra: string;
  grupo: string;
  circuito: string;
  capex_mo_plan: number | null;
  restricao_programacao2: string;
  responsabilidade2: string | null;
  nome_responsavel2: string | null;
  area_responsavel2: string | null;
  status_restricao2: string | null;
  data_resolucao2: Date | null;
  observacao_restricao: string | null;
  observacao_execucao: string | null;
  status_programacao: string;
  observacao_programacao: string | null;
  id_obra: number;
};

export type ExportExecutionCapacityResponse = {
  id: bigint;
  ano: string | null;
  regional: string | null;
  turma: string | null;
  equipe: string | null;
  total_shouldcost: number | null;
  total_qtde_equipes_rfp: bigint | null;
  jan: number | null;
  financeiro_jan: number | null;
  fev: number | null;
  financeiro_fev: number | null;
  mar: number | null;
  financeiro_mar: number | null;
  abr: number | null;
  financeiro_abr: number | null;
  mai: number | null;
  financeiro_mai: number | null;
  jun: number | null;
  financeiro_jun: number | null;
  jul: number | null;
  financeiro_jul: number | null;
  ago: number | null;
  financeiro_ago: number | null;
  set: number | null;
  financeiro_set: number | null;
  out: number | null;
  financeiro_out: number | null;
  nov: number | null;
  financeiro_nov: number | null;
  dez: number | null;
  financeiro_dez: number | null;
};

export type ExportForecastResponse = {
  row_id: bigint;
  ovnota: string;
  diagrama: string | null;
  ordem_dci: string | null;
  ordem_dcd: string | null;
  ordem_dca: string | null;
  ordem_dcim: string | null;
  municipio: string;
  regional: string;
  conjunto: string;
  circuito: string;
  prazo_fim: Date | null;
  status_ov_sap: number | null;
  tipo_obra: string;
  grupo: string;
  qtde_planejada: number | null;
  qtde_pend: number | null;
  qtde_prog: number | null;
  mo_planejada: number | null;
  mo_prog: number | null;
  capex_mat_plan: number | null;
  capex_mat_pend: number | null;
  mat_prog: number | null;
  capex_mo_plan: number | null;
  capex_mo_pend: number | null;
  servico_prog: number | null;
  parceira: string;
  executado: number | null;
  status: string;
  status_programacao: string;
  criado_em: Date | null;
  usuario_criador: string;
  usuario_ultima_atualizacao: string;
  reprovada: boolean | null;
  validada: boolean | null;
  confirmada: boolean | null;
  data_prog: Date | null;
  prog: number | null;
  exec: number | null;
  chi: number | null;
  chave_provisoria: boolean | null;
  num_dp: string | null;
  hora_ini: Date | null;
  hora_ter: Date | null;
  equipe_linha_morta: number | null;
  equipe_linha_viva: number | null;
  equipe_regularizacao: number | null;
  tecnico: string;
  restricao_execucao: string;
  nome_responsavel_execucao: string | null;
  restricao_prog1: string;
  responsabilidade1: string | null;
  nome_responsavel: string | null;
  area_responsavel1: string | null;
  status_restricao1: string | null;
  data_resolucao1: Date | null;
  restricao_prog2: string;
  responsabilidade2: string | null;
  nome_responsavel2: string | null;
  area_responsavel2: string | null;
  status_restricao2: string | null;
  data_resolucao2: Date | null;
  id_grupo: number;
};

export type ExportRejectionsResponse = {
  obras: { ovnota: string };
  data_prog: Date;
  motivo: string;
  hora_ini: Date;
  hora_ter: Date;
  prog: number;
  descricao: string;
  equip_desligado: string;
  equipe_linha_morta: number;
  equipe_linha_viva: number;
  equipe_regularizacao: number;
  tipo_servico: string;
  observacao_programacao: string;
};

export type ExportSuspensionsResponse = {
  obras: {
    ovnota: string;
    status: { status: string };
    tipos: { tipo_obra: string };
    turmas: { turma: string };
    municipios: {
      municipio: string;
      regionais: { regional: string };
    };
  };
  data: Date;
  motivo: string;
};

export type ExportSuspensionsRemovedResponse = {
  obras: {
    ovnota: string;
    tipos: { tipo_obra: string };
    turmas: { turma: string };
    municipios: {
      municipio: string;
      regionais: { regional: string };
    };
  };
  status: { status: string };
  data_retirada: Date;
};

export type ExportFinedWorkResponse = {
  obras: {
    ovnota: string;
    ordem_dci: string | null;
    diagrama: string | null;
    municipios: {
      regionais: {
        regional: string;
      };
    };
    tipos: {
      tipo_obra: string;
    };
    turmas: {
      turma: string;
    };
  };
  data_prog: Date;
  hora_ini: Date | null;
  hora_ter: Date | null;
  prog: number | null;
  exec: number | null;
  num_dp: string | null;
  programacoes_restricao_execucao: {
    restricao: string;
  };
  nome_responsavel_execucao: string | null;
};

export type ExportExecutionReportResponse = {
  id: number;
  criado_em: Date;
  supervisor: string | null;
  liberado_ligacao_parcial: boolean | null;
  hora_inicio: Date | null;
  hora_conclusao: Date | null;
  contato_inicio: string | null;
  contato_termino: string | null;
  atraso: boolean | null;
  justificativa_atraso: string | null;
  possui_equipamentos_instalados: boolean | null;
  equipamentos_aplicados: string | null;
  potencia_equipamento_aplicado: string | null;
  patrimonio_equipamento_aplicado: string | null;
  instalacao_equipamento_aplicado: string | null;
  possui_equipamentos_retirados: boolean | null;
  equipamentos_retirados: string | null;
  potencia_equipamento_retirado: string | null;
  patrimonio_equipamento_retirado: string | null;
  instalacao_equipamento_retirado: string | null;
  alteracoes_execucao: boolean;
  observacoes_gerais: string | null;
  chave_provisoria_instalada: boolean | null;
  referencia_chave_provisoria: string | null;
  chave_provisoria_retirada: boolean | null;
  referencia_chave_provisoria_retirada: string | null;
  motivo: string | null;
  usuario: {
    nome: string;
  };
  obras: {
    ovnota: string;
    diagrama: string | null;
    ordem_dci: string | null;
    ordem_dca: string | null;
    ordem_dcd: string | null;
    ordem_dcim: string | null;
    executado: number | null;
    entrada: Date | null;
    prazo: number | null;
    tipos: {
      tipo_obra: string;
    };
    status: {
      status: string;
    };
    turmas: {
      turma: string;
    };
  };
  programacoes: {
    data_prog: Date;
    prog: number | null;
    exec: number | null;
    num_dp: string | null;
    hora_ini: Date | null;
    hora_ter: Date | null;
    chave_provisoria: boolean | null;
  };
};

export type ExportOrdersResponse = {
  ovnota: string;
  grupo: string;
  tipo_obra: string;
  status: string;
  ordemdiagrama: string | null;
  data_conclusao: Date | null;
  regional: string;
  turma: string;
  data_prog: Date | null;
};
