import { toD5NoteInScheduleOutput } from 'src/application/mappers/d5Notes/d5NotesMapper';
import { isDocumentMissing } from 'src/domain/services/requireDpNumber.service';
import { parseTimeToDate } from 'src/utils/parseTimeToDate';

import { BadRequestException } from '@nestjs/common';

import type {
  D5NoteSchedule,
  D5ScheduleProps,
} from 'src/domain/entities/schedules/d5NotesSchedule.entity';

import type {
  CreateD5ScheduleInput,
  D5NoteScheduleListItemOutput,
  D5NoteScheduleOutput,
  D5NoteTimeInfo,
  D5RejectionListItemOutput,
  D5ScheduleListFieldsOutput,
  UpdateD5ScheduleInput,
} from 'src/application/types';
import type {
  CreateD5ScheduleRejectionData,
  D5ScheduleDetail,
  D5ScheduleRejection,
  D5ScheduleRejectionSource,
  D5ScheduleWithNote,
} from 'src/domain/types';

export interface D5ScheduleUpdateContext {
  id: number;
  d5NoteId: number;
  creatorUserId?: number;
  modifyingUserId: number;
  filePaths: string[];
  current: D5NoteSchedule;
}

export interface D5ScheduleRejectionContext {
  restrictionId: number;
  description: string;
  rejectingUserId: number;
}

export class D5NoteScheduleMapper {
  /* ═══ Entrada: input → props da entidade ═══ */

  static fromCreateInput(input: CreateD5ScheduleInput): D5ScheduleProps {
    const {
      scheduledDate,
      startTime,
      endTime,
      technicalId,
      restrictionId,
      restrictionResponsible,
      ...common
    } = input;

    return {
      ...common,
      dataProg: D5NoteScheduleMapper.parseScheduledDate(scheduledDate),
      startTime: parseTimeToDate(startTime),
      finishTime: parseTimeToDate(endTime),
      idTechnical: technicalId,
      idExecutionRestriction: restrictionId,
      responsibility: restrictionResponsible,
      rejected: false,
      filePaths: [],
    };
  }

  static fromUpdateInput(
    input: UpdateD5ScheduleInput,
    context: D5ScheduleUpdateContext,
  ): D5ScheduleProps {
    const {
      scheduledDate,
      startTime,
      endTime,
      technicalId,
      restrictionId,
      restrictionResponsible,
      rejected,
      keptFiles: _resolvedByUseCase,
      ...common
    } = input;
    const current = context.current;

    return {
      ...current.toPublicProps(),
      ...D5NoteScheduleMapper.stripUndefined(common),
      id: context.id,
      d5NoteId: context.d5NoteId,
      creatorUserId: context.creatorUserId,
      modifyingUserId: context.modifyingUserId,
      filePaths: context.filePaths,
      dataProg:
        D5NoteScheduleMapper.parseScheduledDate(scheduledDate) ??
        current.dataProg,
      startTime:
        startTime !== undefined
          ? parseTimeToDate(startTime)
          : current.startTime,
      finishTime:
        endTime !== undefined ? parseTimeToDate(endTime) : current.finishTime,
      idTechnical: technicalId ?? current.idTechnical,
      idExecutionRestriction: restrictionId ?? current.idExecutionRestriction,
      responsibility: restrictionResponsible ?? current.responsibility,
      rejected: rejected ?? false,
    };
  }

  /** Cópia da programação no momento da reprovação (lê o D5ScheduleDetail do getByD5NoteId). */
  static toRejectionData(
    schedule: D5ScheduleRejectionSource,
    context: D5ScheduleRejectionContext,
  ): CreateD5ScheduleRejectionData {
    return {
      d5NoteId: schedule.d5NoteId,
      description: context.description,
      scheduledDate: schedule.scheduledDate,
      planned: schedule.planned,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      lmTeams: schedule.lmTeams,
      lvTeams: schedule.lvTeams,
      regTeams: schedule.regTeams,
      provisionalKey: schedule.provisionalKey,
      chi: schedule.chi,
      dpNumber: schedule.dpNumber,
      serviceType: schedule.serviceType,
      scheduleNote: schedule.scheduleNote,
      rejectedByUserId: context.rejectingUserId,
      restrictionId: context.restrictionId,
    };
  }

  /* ═══ Saída: programações de uma nota ═══ */

  static toResponse(s: D5ScheduleDetail): D5NoteScheduleOutput {
    return {
      id: s.id,
      id_nota_d5: s.d5NoteId,
      criado_em: s.createdAt,
      data_prog: s.scheduledDate,
      hora_ini: s.startTime,
      hora_ter: s.endTime,
      prog: s.planned,
      exec: s.executed,
      equipe_lm: s.lmTeams,
      equipe_lv: s.lvTeams,
      equipe_reg: s.regTeams,
      chave_provisoria: s.provisionalKey,
      chi: s.chi,
      num_dp: s.dpNumber,
      tipo_servico: s.serviceType,
      observacao_execucao: s.executionNote,
      observacao_programacao: s.scheduleNote,
      usuarioModificador: s.modifierName,
      usuarioCriador: s.creatorName,
      idTecnico: s.technician?.id ?? null,
      tecnico: s.technician?.name ?? null,
      idRestricao: s.restriction?.id ?? null,
      restricao: s.restriction?.name ?? null,
      responsavel_restricao: s.restrictionOwner,
      caminhos_arquivos: s.filePaths,
      reprovada: s.rejected,
      fiscalizacao: s.inspection,
    };
  }

  static toResponseList(items: D5ScheduleDetail[]): D5NoteScheduleOutput[] {
    return items.map(D5NoteScheduleMapper.toResponse);
  }

  /* ═══ Saída: listagem (programação + nota) ═══ */

  static toListItem(
    s: D5ScheduleWithNote,
    time: D5NoteTimeInfo,
  ): D5NoteScheduleListItemOutput {
    return {
      ...D5NoteScheduleMapper.toListFields(s),
      ...toD5NoteInScheduleOutput(s.note, time), // a parte da nota é do mapper das notas
    };
  }

  static toListItems(
    items: D5ScheduleWithNote[],
    getTimeMetrics: (item: D5ScheduleWithNote) => D5NoteTimeInfo,
  ): D5NoteScheduleListItemOutput[] {
    return items.map((item) =>
      D5NoteScheduleMapper.toListItem(item, getTimeMetrics(item)),
    );
  }

  /* ═══ Saída: reprovações ═══ */

  static toRejectionResponse(
    r: D5ScheduleRejection,
  ): D5RejectionListItemOutput {
    return {
      id: r.id,
      dataReprovacao: r.rejectedAt,
      dataProgramacao: r.scheduledDate,
      horaInicio: r.startTime,
      horaTermino: r.endTime,
      programacao: r.planned,
      descricao: r.description,
      tipoServico: r.serviceType,
      chaveProvisoria: r.provisionalKey,
      chi: r.chi,
      numDp: r.dpNumber,
      observacaoProgramacao: r.scheduleNote,
      equipeLm: r.lmTeams,
      equipeLv: r.lvTeams,
      equipeReg: r.regTeams,
      restricao: r.restriction,
      reprovadoPor: r.rejectedBy,
    };
  }

  static toRejectionsResponseList(
    rows: D5ScheduleRejection[],
  ): D5RejectionListItemOutput[] {
    return rows.map(D5NoteScheduleMapper.toRejectionResponse);
  }

  /* ═══ Auxiliares ═══ */

  private static toListFields(
    s: D5ScheduleWithNote,
  ): D5ScheduleListFieldsOutput {
    return {
      data_prog: s.scheduledDate,
      hora_ini: s.startTime,
      hora_ter: s.endTime,
      prog: s.planned,
      exec: s.executed,
      equipe_lm: s.lmTeams,
      equipe_lv: s.lvTeams,
      equipe_reg: s.regTeams,
      chave_provisoria: s.provisionalKey,
      chi: s.chi,
      num_dp: s.dpNumber,
      tipo_servico: s.serviceType,
      observacao_programacao: s.scheduleNote,
      precisaDp: isDocumentMissing(s.dpNumber, s.serviceType),
      tecnico: s.technicianName,
    };
  }

  private static parseScheduledDate(value?: string): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException('Data de programação inválida');
    }
    return date;
  }

  private static stripUndefined<T extends Record<string, unknown>>(
    obj: T,
  ): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, value]) => value !== undefined),
    ) as Partial<T>;
  }
}
