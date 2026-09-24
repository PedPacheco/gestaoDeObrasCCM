import { BadRequestException } from '@nestjs/common';
import {
  D5NoteSchedule,
  D5ScheduleProps,
} from 'src/domain/entities/schedules/d5NotesSchedule.entity';

import {
  CreateProgramacaoD5Dto,
  UpdateScheduleD5Dto,
} from 'src/interface/dtos/d5NotesDTO';
import {
  D5NoteScheduleCreateData,
  D5NoteScheduleListItem,
  D5NoteScheduleResponse,
  D5NoteScheduleUpdateData,
  SchedulesD5NotesByIdQueryResult,
  SchedulesD5NotesByNoteIdQueryResult,
  SchedulesD5NotesQueryResult,
} from 'src/interface/types/d5notes/types';
import { parseTimeToDate } from 'src/utils/parseTimeToDate';

export interface D5ScheduleUpdateContext {
  id: number;
  d5NoteId: number;
  creatorUserId?: number;
  modifyingUserId: number;
  filePaths: string[];
  current: D5NoteSchedule;
}

export class D5NoteScheduleMapper {
  /* ---------------- Entrada: DTO → props de domínio ---------------- */

  static fromCreateInput(dto: CreateProgramacaoD5Dto): D5ScheduleProps {
    const {
      scheduledDate,
      startTime,
      endTime,
      technicalId,
      restrictionId,
      restrictionResponsible,
      ...common
    } = dto;

    return {
      ...common,
      dataProg: D5NoteScheduleMapper.parseScheduledDate(scheduledDate),
      startTime: parseTimeToDate(startTime),
      finishTime: parseTimeToDate(endTime),
      idTechnical: technicalId,
      idExecutionRestriction: restrictionId,
      responsibility: restrictionResponsible,
      filePaths: [],
    };
  }

  static fromUpdateInput(
    dto: UpdateScheduleD5Dto,
    context: D5ScheduleUpdateContext,
  ): D5ScheduleProps {
    const {
      scheduledDate,
      startTime,
      endTime,
      technicalId,
      restrictionId,
      restrictionResponsible,
      keptFiles: _resolvedByUseCase,
      ...common
    } = dto;

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
    };
  }

  /* ---------------- Leitura: BD → entidade ---------------- */

  static toDomain(row: SchedulesD5NotesByIdQueryResult): D5NoteSchedule {
    return D5NoteSchedule.create({
      id: row.id,
      d5NoteId: row.id_nota_d5,
      creatorUserId: row.id_usuario_criador,
      modifyingUserId: row.id_usuario_modificador,
      filePaths: row.caminhos_arquivos ?? [],
      dataProg: row.data_prog,
      prog: row.prog,
      exec: row.exec,
      startTime: row.hora_ini,
      finishTime: row.hora_ter,
      observation: row.observacao_programacao,
      executionObservation: row.observacao_execucao,
      numDp: row.num_dp,
      serviceType: row.tipo_servico,
      chi: row.chi,
      lvTeam: row.equipe_lv,
      lmTeam: row.equipe_lm,
      regulTeam: row.equipe_reg,
      temporaryKey: row.chave_provisoria,
      idTechnical: row.id_tecnico,
      idExecutionRestriction: row.id_restricao,
      responsibility: row.responsavel_restricao,
    });
  }

  /* ---------------- Persistência: entidade → colunas ---------------- */

  static toPersistenceCreate(entity: D5NoteSchedule): D5NoteScheduleCreateData {
    return {
      id_nota_d5: entity.d5NoteId,
      ...D5NoteScheduleMapper.toCommonColumns(entity),
      id_usuario_criador: entity.creatorUserId,
      id_usuario_modificador: entity.modifyingUserId,
    };
  }

  static toPersistenceUpdate(entity: D5NoteSchedule): D5NoteScheduleUpdateData {
    return {
      ...D5NoteScheduleMapper.toCommonColumns(entity),
      id_usuario_modificador: entity.modifyingUserId,
    };
  }

  /* ---------------- Leitura: linha → resposta da API ---------------- */

  static toResponse(
    row: SchedulesD5NotesByNoteIdQueryResult,
  ): D5NoteScheduleResponse {
    const {
      tecnicos,
      restricoes,
      usuario_criador,
      usuario_modificador,
      ...schedule
    } = row;

    return {
      ...schedule,
      idTecnico: tecnicos?.id ?? null,
      tecnico: tecnicos?.tecnico ?? null,
      idRestricao: restricoes?.id ?? null,
      restricao: restricoes?.restricao ?? null,
      usuarioCriador: usuario_criador?.nome ?? null,
      usuarioModificador: usuario_modificador?.nome ?? null,
    };
  }

  static toResponseList(
    rows: SchedulesD5NotesByNoteIdQueryResult[],
  ): D5NoteScheduleResponse[] {
    return rows.map(D5NoteScheduleMapper.toResponse);
  }

  static toListItem(row: SchedulesD5NotesQueryResult): D5NoteScheduleListItem {
    const { tecnicos, notas_d5, ...schedule } = row;
    const obras = notas_d5.obras;

    return {
      ...schedule,
      tecnico: tecnicos?.tecnico ?? null,
      id: notas_d5.id,
      nota_d5: notas_d5.nota_d5,
      local_instalacao: notas_d5.local_instalacao,
      criado_em: notas_d5.criado_em,
      conclusao_nota: notas_d5.conclusao_nota,
      status_sap: notas_d5.status_sap,
      tme_executado: notas_d5.tme_executado,
      tme_abertura: notas_d5.tme_abertura,
      validacao_anual: notas_d5.validacao_anual,
      mo_planejada: notas_d5.mo_planejada?.toNumber() ?? 0,
      municipio: notas_d5.municipios.mun_minusculo,
      regional: notas_d5.municipios.regionais.regional,
      tipo_obra: notas_d5.tipos.tipo_obra,
      turma: notas_d5.turmas.turma,
      status: notas_d5.status.status,
      responsavel: notas_d5.novo_tabela_usuarios?.nome ?? null,
      ovnota: obras?.ovnota ?? null,
      ordemDiagrama:
        obras?.diagrama ??
        obras?.ordem_dci ??
        obras?.ordem_dca ??
        obras?.ordem_dcd ??
        obras?.ordem_dcim ??
        null,
    };
  }

  static toListItems(
    rows: SchedulesD5NotesQueryResult[],
  ): D5NoteScheduleListItem[] {
    return rows.map(D5NoteScheduleMapper.toListItem);
  }

  /* ---------------- Auxiliares ---------------- */

  private static parseScheduledDate(value?: string): Date | undefined {
    if (!value) return undefined;

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      throw new BadRequestException('Data de programação inválida');
    }

    return date;
  }

  private static stripUndefined<T extends Record<string, any>>(
    obj: T,
  ): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, value]) => value !== undefined),
    ) as Partial<T>;
  }

  private static toCommonColumns(entity: D5NoteSchedule) {
    return {
      data_prog: entity.dataProg,
      prog: entity.prog,
      exec: entity.exec,
      hora_ini: entity.startTime,
      hora_ter: entity.finishTime,
      observacao_programacao: entity.observation,
      observacao_execucao: entity.executionObservation,
      num_dp: entity.numDp,
      tipo_servico: entity.serviceType,
      chi: entity.chi,
      equipe_lv: entity.lvTeam,
      equipe_lm: entity.lmTeam,
      equipe_reg: entity.regulTeam,
      chave_provisoria: entity.temporaryKey,
      id_tecnico: entity.idTechnical,
      id_restricao: entity.idExecutionRestriction,
      responsavel_restricao: entity.responsibility,
      caminhos_arquivos: entity.filePaths,
    };
  }
}
