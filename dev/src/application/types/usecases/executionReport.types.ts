import { ExecutionReportProps } from 'src/domain/types';

export type CreateExecutionReportInput = Omit<ExecutionReportProps, 'files'> & {
  files?: string[];
};

export type UpdateExecutionReportInput = Omit<
  ExecutionReportProps,
  'idSchedule' | 'idWork' | 'files'
>;

/** Formato atual da API (snake_case). Não mudar sem alinhar com o front. */
export interface ExecutionReportListItemOutput {
  id: number;
  criado_em: Date;
  id_usuario: number | null;
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
  alteracoes_execucao: boolean | null;
  observacoes_gerais: string | null;
  chave_provisoria_instalada: boolean | null;
  referencia_chave_provisoria: string | null;
  chave_provisoria_retirada: boolean | null;
  referencia_chave_provisoria_retirada: string | null;
  motivo: string | null;
  caminho_arquivo: string | null;
  caminhos_arquivos: string[];
  nome_usuario: string | null;
  ovnota: string | null;
  ordem_dci: string | null;
  tipo_obra: string | null;
  data_exec: Date | null;
  prog: number | null;
  exec: number | null;
  status: string | null;
  num_dp: string | null;
  hora_ini: Date | null;
  hora_ter: Date | null;
  chave_provisoria: boolean | null;
}
