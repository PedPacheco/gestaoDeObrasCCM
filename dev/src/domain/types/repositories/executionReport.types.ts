export type FindByScheduleResponse = {
  id: number;
  id_usuario: number;
  id_obra: number;
  id_programacao: number;
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
  possui_equipamentos_retirados: boolean | null;
  equipamentos_retirados: string | null;
  alteracoes_execucao: boolean | null;
  observacoes_gerais: string | null;
  referencia_chave_provisoria: string | null;
  chave_provisoria_retirada: boolean | null;
  motivo: string | null;
  chave_provisoria_instalada: boolean | null;
  potencia_equipamento_aplicado: string | null;
  patrimonio_equipamento_aplicado: string | null;
  potencia_equipamento_retirado: string | null;
  patrimonio_equipamento_retirado: string | null;
  instalacao_equipamento_aplicado: string | null;
  instalacao_equipamento_retirado: string | null;
  referencia_chave_provisoria_retirada: string | null;
  caminho_arquivo: string | null;
  criado_em: Date | null;
  modificado_por: number | null;
  modificado_em: Date | null;
};

export type FindByWorkIdResponse = {
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
    ordem_dci: string | null;
    tipos: {
      tipo_obra: string;
    };
    status: {
      status: string;
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

export type FindByIdResponse = {
  id: number;
  id_programacao: number;
  caminho_arquivo: string;
};
