import type { ExecutionReport } from 'src/domain/entities/executionReport.entity';

import {
  EquipmentItem,
  ExecutionReportDetail,
  ExecutionReportFiles,
  ScheduleWorkMode,
} from 'src/domain/types';
import type { Prisma } from 'src/infra/generated/prisma/client';
import { toNumberOrNull } from 'src/utils/toNumberToNull';
import {
  ExecutionReportDetailRow,
  ExecutionReportFilesRow,
  ScheduleWorkModeRow,
} from '../types';

const LIST_SEPARATOR = ';';

// ─── Ficheiros (transição do Passo 2.5) ────────────────────────────
export const parseStoredNames = (value?: string | null): string[] =>
  (value ?? '')
    .split(LIST_SEPARATOR)
    .map((name) => name.trim())
    .filter(Boolean);

export const storedFilesOf = (row: {
  caminhos_arquivos?: string[] | null;
  caminho_arquivo?: string | null;
}): string[] =>
  row.caminhos_arquivos?.length
    ? row.caminhos_arquivos
    : parseStoredNames(row.caminho_arquivo);

const toFileColumns = (files: string[]) => ({
  caminhos_arquivos: files,
  caminho_arquivo: files.length ? files.join(LIST_SEPARATOR) : null, // remover quando a coluna antiga sair
});

// ─── Equipamentos (antigo ExecutionReport.formatEquipment) ─────────
const toEquipmentColumns = (items: EquipmentItem[]) => ({
  names: items.map((i) => i.equipment).join(LIST_SEPARATOR),
  power: items.map((i) => i.power).join(LIST_SEPARATOR),
  patrimony: items.map((i) => i.patrimony).join(LIST_SEPARATOR),
  installation: items.map((i) => i.installation).join(LIST_SEPARATOR),
});

// ─── Entidade → Prisma (antigo ExecutionReport.toPersistenceObject) ─
export const toExecutionReportPersistence = (report: ExecutionReport) => {
  const s = report.toSnapshot();
  const applied = toEquipmentColumns(s.appliedEquipment);
  const removed = toEquipmentColumns(s.equipmentRemoved);

  return {
    id_usuario: s.userId,
    modificado_por: s.userId,
    id_obra: s.workId,
    id_programacao: s.idSchedule,
    supervisor: s.supervisor,
    liberado_ligacao_parcial: s.partialConnectionReleased,
    hora_inicio: s.startTime,
    hora_conclusao: s.finishTime,
    contato_inicio: s.startContact,
    contato_termino: s.endContact,
    atraso: s.delayed,
    justificativa_atraso: s.delayJustification,
    possui_equipamentos_instalados: s.hasEquipmentInstalled,
    equipamentos_aplicados: applied.names,
    potencia_equipamento_aplicado: applied.power,
    patrimonio_equipamento_aplicado: applied.patrimony,
    instalacao_equipamento_aplicado: applied.installation,
    possui_equipamentos_retirados: s.hasEquipmentRemoved,
    equipamentos_retirados: removed.names,
    potencia_equipamento_retirado: removed.power,
    patrimonio_equipamento_retirado: removed.patrimony,
    instalacao_equipamento_retirado: removed.installation,
    alteracoes_execucao: s.changesExecution,
    observacoes_gerais: s.generalObservation,
    chave_provisoria_instalada: s.provisionalKeyInstalled,
    referencia_chave_provisoria: s.provisionalKeyReference,
    chave_provisoria_retirada: s.provisionalKeyWithdrawn,
    referencia_chave_provisoria_retirada: s.provisionalKeyReferenceWithdrawn,
    motivo: s.reason,
    ...toFileColumns(s.files),
  } satisfies Prisma.relatorio_execucaoUncheckedCreateInput;
};

// ─── Rows → domínio ────────────────────────────────────────────────
export const toExecutionReportFiles = (
  r: ExecutionReportFilesRow,
): ExecutionReportFiles => ({
  id: r.id,
  workId: r.id_obra,
  scheduleId: r.id_programacao,
  filePaths: storedFilesOf(r),
});

export const toScheduleWorkMode = (
  r: ScheduleWorkModeRow,
): ScheduleWorkMode => ({
  workId: r.id_obra,
  pointToPoint: r.obras?.programacao_ponto_a_ponto ?? null,
});

export const toExecutionReportDetail = (
  r: ExecutionReportDetailRow,
): ExecutionReportDetail => ({
  id: r.id,
  createdAt: r.criado_em,
  userId: r.id_usuario,
  supervisor: r.supervisor,
  partialConnectionReleased: r.liberado_ligacao_parcial,
  startTime: r.hora_inicio,
  finishTime: r.hora_conclusao,
  startContact: r.contato_inicio,
  endContact: r.contato_termino,
  delay: r.atraso,
  delayJustification: r.justificativa_atraso,
  hasEquipmentInstalled: r.possui_equipamentos_instalados,
  appliedEquipment: r.equipamentos_aplicados,
  appliedEquipmentPower: r.potencia_equipamento_aplicado,
  appliedEquipmentPatrimony: r.patrimonio_equipamento_aplicado,
  appliedEquipmentInstallation: r.instalacao_equipamento_aplicado,
  hasEquipmentRemoved: r.possui_equipamentos_retirados,
  removedEquipment: r.equipamentos_retirados,
  removedEquipmentPower: r.potencia_equipamento_retirado,
  removedEquipmentPatrimony: r.patrimonio_equipamento_retirado,
  removedEquipmentInstallation: r.instalacao_equipamento_retirado,
  changesExecution: r.alteracoes_execucao,
  generalObservation: r.observacoes_gerais,
  provisionalKeyInstalled: r.chave_provisoria_instalada,
  provisionalKeyReference: r.referencia_chave_provisoria,
  provisionalKeyWithdrawn: r.chave_provisoria_retirada,
  provisionalKeyReferenceWithdrawn: r.referencia_chave_provisoria_retirada,
  reason: r.motivo,
  legacyFilePath: r.caminho_arquivo,
  filePaths: r.caminhos_arquivos,
  userName: r.usuario?.nome ?? null,
  work: r.obras && {
    orderNumber: r.obras.ovnota,
    dciOrder: r.obras.ordem_dci,
    type: r.obras.tipos?.tipo_obra ?? null,
    status: r.obras.status?.status ?? null,
  },
  schedule: r.programacoes && {
    date: r.programacoes.data_prog,
    planned: toNumberOrNull(r.programacoes.prog),
    executed: toNumberOrNull(r.programacoes.exec),
    dpNumber: r.programacoes.num_dp,
    startTime: r.programacoes.hora_ini,
    endTime: r.programacoes.hora_ter,
    provisionalKey: r.programacoes.chave_provisoria,
  },
});
