import { BadRequestException } from '@nestjs/common';
import {
  D5NoteSchedule,
  D5ScheduleProps,
} from 'src/domain/entities/schedules/D5NotesSchedule.entity';

import { CreateProgramacaoD5Dto } from 'src/interface/dtos/d5NotesDTO';
import { D5NoteScheduleCreateData } from 'src/interface/types/d5notes/types';

export class D5NoteScheduleMapper {
  /** DTO da API (snake_case) → props de domínio. */
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

    const dataProg = new Date(scheduledDate);
    if (isNaN(dataProg.getTime())) {
      throw new BadRequestException('Data de programação inválida');
    }

    return {
      ...common,
      dataProg,
      startTime: D5NoteScheduleMapper.parseOptionalDate(
        startTime,
        'Hora de início',
      ),
      finishTime: D5NoteScheduleMapper.parseOptionalDate(
        endTime,
        'Hora de término',
      ),
      idTechnical: technicalId,
      idExecutionRestriction: restrictionId,
      responsibility: restrictionResponsible,
    };
  }

  /** Entidade → colunas de INSERT. */
  static toPersistenceCreate(entity: D5NoteSchedule): D5NoteScheduleCreateData {
    return {
      id_nota_d5: entity.d5NoteId,
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
      id_usuario_criador: entity.creatorUserId,
      id_usuario_modificador: entity.modifyingUserId,
    };
  }

  /** Registo da BD → entidade. */
  static toDomain(row: any): D5NoteSchedule {
    return D5NoteSchedule.create({
      id: row.id,
      d5NoteId: row.id_nota_d5,
      dataProg: new Date(row.data_prog),
      prog: row.prog,
      exec: row.exec ?? undefined,
      startTime: row.hora_ini ? new Date(row.hora_ini) : undefined,
      finishTime: row.hora_ter ? new Date(row.hora_ter) : undefined,
      observation: row.observacao_programacao ?? undefined,
      executionObservation: row.observacao_execucao ?? undefined,
      numDp: row.num_dp ?? undefined,
      serviceType: row.tipo_servico ?? undefined,
      chi: row.chi ?? undefined,
      lvTeam: row.equipe_lv ?? 0,
      lmTeam: row.equipe_lm ?? 0,
      regulTeam: row.equipe_reg ?? 0,
      temporaryKey: row.chave_provisoria ?? false,
      idTechnical: row.id_tecnico ?? 1,
      idExecutionRestriction: row.id_restricao ?? 1,
      responsibility: row.responsavel_restricao ?? undefined,
      creatorUserId: row.id_usuario_criador,
      modifyingUserId: row.id_usuario_modificador,
    });
  }

  private static parseOptionalDate(
    value: string | undefined,
    label: string,
  ): Date | undefined {
    if (!value) return undefined;
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      throw new BadRequestException(`${label} inválida`);
    }
    return date;
  }
}
