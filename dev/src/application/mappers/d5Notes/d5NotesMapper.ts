import moment from 'moment';
import { mapMotivosD5 } from 'src/domain/constants/d5Notes/reasonsD5';

import { resolveOrdemDiagrama } from 'src/domain/services/workOrder.rules';
import type {
  D5NoteDetail,
  D5NoteListItem,
  D5NoteSummary,
} from 'src/domain/types';
import type {
  D5NoteDetailOutput,
  D5NoteInScheduleOutput,
  D5NoteListItemOutput,
} from '../../types/index';

export type D5NoteTimeInfo = Pick<
  D5NoteListItemOutput,
  'tmAberto' | 'tmExecucao' | 'statusPrazo'
>;

export interface D5NoteScheduleTotals {
  totalProgramado: number;
  totalExecutado: number;
}

// ═══ Lista de notas ════════════════════════════════════════════════

export const toD5NoteListItemOutput = (
  n: D5NoteListItem,
  time: D5NoteTimeInfo,
): D5NoteListItemOutput => ({
  id: n.id,
  local_instalacao: n.installationSite,
  criado_em: n.createdAt,
  conclusao_nota: n.completedAt,
  status_sap: n.sapStatus,
  validacao_anual: n.annualValidation,
  mo_planejada: n.plannedLabor,
  nota_d5: n.noteNumber,
  moRetida: n.plannedLabor,
  ordemDiagrama: resolveOrdemDiagrama(n.work),
  obra: n.work?.ovnota ?? null,
  municipio: n.municipality,
  regional: n.region,
  parceira: n.partner,
  tipoObra: n.workType,
  status: n.status,
  tmAberto: time.tmAberto,
  tmExecucao: time.tmExecucao,
  statusPrazo: time.statusPrazo,
  usuarioModificador: n.responsibleName,
  motivos: mapMotivosD5(n.reasonIds),
});

// ═══ Detalhe da nota ═══════════════════════════════════════════════

export const toD5NoteDetailOutput = (
  n: D5NoteDetail,
  totals: D5NoteScheduleTotals,
): D5NoteDetailOutput => ({
  id: n.id,
  id_parceira: n.partnerId,
  id_status: n.statusId,
  local_instalacao: n.installationSite,
  criado_em: n.createdAt,
  conclusao_nota: n.completedAt,
  status_sap: n.sapStatus,
  validacao_anual: n.annualValidation,
  mo_planejada: n.plannedLabor,
  nota_d5: n.noteNumber,
  descricao: n.description,
  obra: n.work?.ovnota ?? null,
  ordemDiagrama: resolveOrdemDiagrama(n.work),
  municipio: n.municipality,
  regional: n.region,
  parceira: n.partner,
  tipoObra: n.workType,
  status: n.status,
  moRetida: n.plannedLabor,
  usuarioModificador: n.responsibleName,
  totalProgramado: totals.totalProgramado,
  totalExecutado: totals.totalExecutado,
  observacao: n.description,
  prazo: moment(n.createdAt).add(7, 'days').toDate(), // 6d: regra do prazo vai para domain/rules
  motivos: mapMotivosD5(n.reasonIds),
});

// ═══ Nota dentro da listagem de programações ═══════════════════════

export const toD5NoteInScheduleOutput = (
  n: D5NoteSummary,
  time: D5NoteTimeInfo,
): D5NoteInScheduleOutput => ({
  id: n.id,
  nota_d5: n.noteNumber,
  local_instalacao: n.installationSite,
  criado_em: n.createdAt,
  conclusao_nota: n.completedAt,
  status_sap: n.sapStatus,
  tmExecucao: time.tmExecucao,
  tmAberto: time.tmAberto,
  statusPrazo: time.statusPrazo,
  moRetida: n.plannedLabor,
  municipio: n.municipality,
  regional: n.region,
  tipo_obra: n.workType,
  turma: n.partner,
  status: n.status,
  responsavel: n.responsibleName,
  ovnota: n.work?.ovnota ?? null,
  ordemDiagrama: resolveOrdemDiagrama(n.work),
});
