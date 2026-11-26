import { D5NoteSchedule } from 'src/domain/entities/schedules/d5NotesSchedule.entity';
import type {
  CreateD5ScheduleRejectionData,
  D5ScheduleDetail,
  D5ScheduleFields,
  D5ScheduleFilter,
  D5ScheduleRejection,
  D5ScheduleStateFilter,
  D5ScheduleWithNote,
  NoteScheduledWork,
} from 'src/domain/types';
import type { Prisma } from 'src/infra/generated/prisma/client';

import type {
  D5ScheduleByNoteRow,
  D5ScheduleFieldsRow,
  D5ScheduleRejectionRow,
  D5ScheduleRow,
  D5ScheduleWithNoteRow,
  NoteScheduledWorkRow,
} from 'src/infra/types';
import { toD5NoteSummary, toD5NoteWhere, toDateWhere } from './d5Notes.mapper';

type ScheduleWhere = Prisma.programacoes_d5WhereInput;

// ═══ Filtro → where (antigo buildWhereClause do FindD5SchedulesService) ═══

const toStateConditions = ({
  states,
  today,
}: D5ScheduleStateFilter): ScheduleWhere[] =>
  states.flatMap((state): ScheduleWhere[] => {
    switch (state) {
      case 'upcoming':
        return [{ exec: null }, { reprovada: false }];
      case 'rejected':
        return [{ reprovada: true }];
      case 'executed':
        return [{ exec: { not: null } }];
      case 'pending':
        return [{ exec: null }, { data_prog: { lt: today } }];
    }
  });

export const toD5ScheduleWhere = (f: D5ScheduleFilter): ScheduleWhere => {
  const and: ScheduleWhere[] = [];

  const scheduledDate = toDateWhere(f.scheduledDate);
  if (scheduledDate) and.push({ data_prog: scheduledDate });

  if (f.note) {
    const noteWhere = toD5NoteWhere(f.note);
    if (Object.keys(noteWhere).length)
      and.push({ notas_d5: { is: noteWhere } });
  }

  if (f.noteIds?.length) and.push({ id_nota_d5: { in: f.noteIds } });
  if (f.scheduleIds?.length) and.push({ id: { in: f.scheduleIds } });
  if (f.state) and.push(...toStateConditions(f.state));

  return { AND: and };
};

// ═══ Row → entidade (antigo toDomain) ══════════════════════════════

export const toD5NoteSchedule = (r: D5ScheduleRow): D5NoteSchedule =>
  D5NoteSchedule.create({
    id: r.id,
    d5NoteId: r.id_nota_d5,
    creatorUserId: r.id_usuario_criador,
    modifyingUserId: r.id_usuario_modificador,
    filePaths: r.caminhos_arquivos ?? [],
    dataProg: r.data_prog,
    prog: r.prog,
    exec: r.exec,
    startTime: r.hora_ini,
    finishTime: r.hora_ter,
    observation: r.observacao_programacao,
    executionObservation: r.observacao_execucao,
    numDp: r.num_dp,
    serviceType: r.tipo_servico,
    chi: r.chi,
    lvTeam: r.equipe_lv,
    lmTeam: r.equipe_lm,
    regulTeam: r.equipe_reg,
    temporaryKey: r.chave_provisoria,
    idTechnical: r.id_tecnico,
    idExecutionRestriction: r.id_restricao,
    responsibility: r.responsavel_restricao,
    rejected: r.reprovada,
    fiscalization: r.fiscalizacao,
  });

// ═══ Entidade → colunas (antigos toPersistence* e toCommonColumns) ═

const toCommonColumns = (e: D5NoteSchedule) => ({
  data_prog: e.dataProg,
  prog: e.prog,
  exec: e.exec,
  hora_ini: e.startTime,
  hora_ter: e.finishTime,
  observacao_programacao: e.observation,
  observacao_execucao: e.executionObservation,
  num_dp: e.numDp,
  tipo_servico: e.serviceType,
  chi: e.chi,
  equipe_lv: e.lvTeam,
  equipe_lm: e.lmTeam,
  equipe_reg: e.regulTeam,
  chave_provisoria: e.temporaryKey,
  id_tecnico: e.idTechnical,
  id_restricao: e.idExecutionRestriction,
  responsavel_restricao: e.responsibility,
  caminhos_arquivos: e.filePaths ?? [],
  fiscalizacao: e.fiscalization ?? false,
});

export const toD5ScheduleCreateInput = (e: D5NoteSchedule) =>
  ({
    id_nota_d5: e.d5NoteId,
    ...toCommonColumns(e),
    id_usuario_criador: e.creatorUserId,
    id_usuario_modificador: e.modifyingUserId,
  }) satisfies Prisma.programacoes_d5UncheckedCreateInput;

/** A coluna reprovada é limpa no repositório (reprovada: false), como hoje. */
export const toD5ScheduleUpdateInput = (e: D5NoteSchedule) =>
  ({
    ...toCommonColumns(e),
    id_usuario_modificador: e.modifyingUserId,
  }) satisfies Prisma.programacoes_d5UncheckedUpdateInput;

// ═══ Reprovação: domínio → colunas ═════════════════════════════════

export const toD5ScheduleRejectionCreateInput = (
  d: CreateD5ScheduleRejectionData,
) =>
  ({
    id_nota_d5: d.d5NoteId,
    descricao: d.description,
    data_prog: d.scheduledDate,
    prog: d.planned,
    hora_ini: d.startTime,
    hora_ter: d.endTime,
    equipe_lm: d.lmTeams,
    equipe_lv: d.lvTeams,
    equipe_reg: d.regTeams,
    chave_provisoria: d.provisionalKey,
    chi: d.chi,
    num_dp: d.dpNumber,
    tipo_servico: d.serviceType,
    observacao_programacao: d.scheduleNote,
    id_usuario_reprovador: d.rejectedByUserId,
    id_restricao: d.restrictionId,
  }) satisfies Prisma.programacoes_d5_reprovacoesCreateManyInput;

// ═══ Rows de leitura → domínio ═════════════════════════════════════

const toScheduleFields = (r: D5ScheduleFieldsRow): D5ScheduleFields => ({
  scheduledDate: r.data_prog,
  startTime: r.hora_ini,
  endTime: r.hora_ter,
  planned: r.prog,
  executed: r.exec,
  lmTeams: r.equipe_lm,
  lvTeams: r.equipe_lv,
  regTeams: r.equipe_reg,
  provisionalKey: r.chave_provisoria,
  chi: r.chi,
  dpNumber: r.num_dp,
  serviceType: r.tipo_servico,
  scheduleNote: r.observacao_programacao,
});

export const toD5ScheduleDetail = (
  r: D5ScheduleByNoteRow,
): D5ScheduleDetail => ({
  ...toScheduleFields(r),
  id: r.id,
  d5NoteId: r.id_nota_d5,
  createdAt: r.criado_em,
  executionNote: r.observacao_execucao,
  restrictionOwner: r.responsavel_restricao,
  creatorName: r.usuario_criador?.nome ?? null,
  modifierName: r.usuario_modificador?.nome ?? null,
  restriction: r.restricoes
    ? { id: r.restricoes.id, name: r.restricoes.restricao }
    : null,
  technician: r.tecnicos
    ? { id: r.tecnicos.id, name: r.tecnicos.tecnico }
    : null,
  filePaths: r.caminhos_arquivos ?? [],
  rejected: r.reprovada,
  inspection: r.fiscalizacao,
});

export const toD5ScheduleWithNote = (
  r: D5ScheduleWithNoteRow,
): D5ScheduleWithNote => ({
  ...toScheduleFields(r),
  technicianName: r.tecnicos?.tecnico ?? null,
  note: toD5NoteSummary(r.notas_d5),
});

export const toD5ScheduleRejection = (
  r: D5ScheduleRejectionRow,
): D5ScheduleRejection => ({
  id: r.id,
  rejectedAt: r.data_reprovacao,
  scheduledDate: r.data_prog,
  startTime: r.hora_ini,
  endTime: r.hora_ter,
  planned: r.prog,
  description: r.descricao,
  lmTeams: r.equipe_lm,
  lvTeams: r.equipe_lv,
  regTeams: r.equipe_reg,
  serviceType: r.tipo_servico,
  provisionalKey: r.chave_provisoria,
  chi: Number(r.chi),
  dpNumber: r.num_dp,
  scheduleNote: r.observacao_programacao,
  restriction: r.restricoes.restricao,
  rejectedBy: r.novo_tabela_usuarios?.nome ?? null,
});

// ═══ Totais (antigo map dentro do getTotals) ═══════════════════════

export const toNoteScheduledWork = (
  r: NoteScheduledWorkRow,
): NoteScheduledWork => ({
  noteId: r.id,
  moRetida: Number(r.mo_planejada ?? 0),
  progs: r.programacoes_d5.map((p) => Number(p.prog ?? 0)),
});
