import type { Prisma } from 'src/infra/generated/prisma/client';

export const EXECUTION_REPORT_FILES_SELECT = {
  id: true,
  id_obra: true,
  id_programacao: true,
  caminho_arquivo: true,
  caminhos_arquivos: true,
} satisfies Prisma.relatorio_execucaoSelect;

export type ExecutionReportFilesRow = Prisma.relatorio_execucaoGetPayload<{
  select: typeof EXECUTION_REPORT_FILES_SELECT;
}>;

export const EXECUTION_REPORT_DETAIL_SELECT = {
  id: true,
  criado_em: true,
  id_usuario: true,
  supervisor: true,
  liberado_ligacao_parcial: true,
  hora_inicio: true,
  hora_conclusao: true,
  contato_inicio: true,
  contato_termino: true,
  atraso: true,
  justificativa_atraso: true,
  possui_equipamentos_instalados: true,
  equipamentos_aplicados: true,
  potencia_equipamento_aplicado: true,
  patrimonio_equipamento_aplicado: true,
  instalacao_equipamento_aplicado: true,
  possui_equipamentos_retirados: true,
  equipamentos_retirados: true,
  potencia_equipamento_retirado: true,
  patrimonio_equipamento_retirado: true,
  instalacao_equipamento_retirado: true,
  alteracoes_execucao: true,
  observacoes_gerais: true,
  chave_provisoria_instalada: true,
  referencia_chave_provisoria: true,
  chave_provisoria_retirada: true,
  referencia_chave_provisoria_retirada: true,
  motivo: true,
  caminho_arquivo: true,
  caminhos_arquivos: true,
  usuario: { select: { nome: true } },
  obras: {
    select: {
      ovnota: true,
      ordem_dci: true,
      tipos: { select: { tipo_obra: true } },
      status: { select: { status: true } },
    },
  },
  programacoes: {
    select: {
      data_prog: true,
      prog: true,
      exec: true,
      num_dp: true,
      hora_ini: true,
      hora_ter: true,
      chave_provisoria: true,
    },
  },
} satisfies Prisma.relatorio_execucaoSelect;

export type ExecutionReportDetailRow = Prisma.relatorio_execucaoGetPayload<{
  select: typeof EXECUTION_REPORT_DETAIL_SELECT;
}>;

export const SCHEDULE_WORK_MODE_SELECT = {
  id_obra: true,
  obras: { select: { programacao_ponto_a_ponto: true } },
} satisfies Prisma.programacoesSelect;

export type ScheduleWorkModeRow = Prisma.programacoesGetPayload<{
  select: typeof SCHEDULE_WORK_MODE_SELECT;
}>;
