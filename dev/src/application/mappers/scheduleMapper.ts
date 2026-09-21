// application/mappers/work-schedule.mapper.ts
import { BadRequestException } from '@nestjs/common';
import {
  WorkSchedule,
  WorkScheduleProps,
} from 'src/domain/entities/schedules/workSchedule.entity';
import { SchedulesDataDTO } from 'src/interface/dtos/scheduleDTO';
import { UpdateSchedulesInterface } from 'src/interface/types/schedule/updateSchedulesInterface';
import { parseTimeToDate } from 'src/utils/parseTimeToDate';

export class WorkScheduleMapper {
  static toDomain(row: any): WorkSchedule {
    if (!row.hora_ini || !row.hora_ter) {
      throw new BadRequestException(
        `Programação ${row.id}: horário de início e fim são obrigatórios`,
      );
    }

    return WorkSchedule.create({
      id: row.id,
      idWork: row.id_obra,
      dataProg: new Date(row.data_prog),
      startTime: new Date(row.hora_ini),
      finishTime: new Date(row.hora_ter),
      prog: row.prog,
      exec: row.exec ?? undefined,

      observation: row.observacao_programacao ?? undefined,
      executionObservation: row.observacao_execucao ?? undefined,
      equipment: row.equip_desligado ?? undefined,
      numDp: row.num_dp ?? undefined,
      serviceType: row.tipo_servico ?? undefined,
      chi: row.chi ?? undefined,
      temporaryKey: row.chave_provisoria ?? false,

      lmTeam: row.equipe_linha_morta ?? 0,
      lvTeam: row.equipe_linha_viva ?? 0,
      regulTeam: row.equipe_regularizacao ?? 0,

      idTechnical: row.id_tecnico ?? 1,
      idExecutionRestriction: row.id_restricao_execucao ?? 1,
      responsibility: row.nome_responsavel_execucao ?? undefined,

      idScheduleStatus: row.id_status_programacao ?? 1,
      rejected: row.reprovada ?? false,
      observationRestriction: row.observacao_restricao ?? undefined,
      idUser: row.id_usuario_ultima_atualizacao ?? undefined,

      idProgRestriction1: row.id_restricao_prog1 ?? 1,
      responsibilityProg: row.responsabilidade1 ?? undefined,
      responsibleName: row.nome_responsavel ?? undefined,
      responsibleArea: row.area_responsavel1 ?? undefined,
      restrictionStatus: row.status_restricao1 ?? undefined,
      resolutionDate: row.data_resolucao1 ?? undefined,

      idProgRestriction2: row.id_restricao_prog2 ?? 1,
      responsibilityProg2: row.responsabilidade2 ?? undefined,
      responsibleName2: row.nome_responsavel2 ?? undefined,
      responsibleArea2: row.area_responsavel2 ?? undefined,
      restrictionStatus2: row.status_restricao2 ?? undefined,
      resolutionDate2: row.data_resolucao2 ?? undefined,
    });
  }

  static toPersistenceUpdate(entity: WorkSchedule) {
    return {
      id: entity.id,
      data_prog: entity.dataProg,
      prog: entity.prog,
      exec: entity.exec,
      observacao_programacao: entity.observation,
      equip_desligado: entity.equipment,
      num_dp: entity.numDp,
      hora_ini: entity.startTime,
      hora_ter: entity.finishTime,
      chave_provisoria: entity.temporaryKey,
      tipo_servico: entity.serviceType,
      chi: entity.chi,
      nome_responsavel_execucao: entity.responsibility,
      equipe_linha_morta: entity.lmTeam,
      equipe_linha_viva: entity.lvTeam,
      equipe_regularizacao: entity.regulTeam,
      id_restricao_execucao: entity.idExecutionRestriction,
      observacao_execucao: entity.executionObservation,

      id_restricao_prog1: entity.idProgRestriction1,
      responsabilidade1: entity.responsibilityProg,
      nome_responsavel: entity.responsibleName,
      area_responsavel1: entity.responsibleArea,
      status_restricao1: entity.restrictionStatus,
      data_resolucao1: entity.resolutionDate,

      id_restricao_prog2: entity.idProgRestriction2,
      responsabilidade2: entity.responsibilityProg2,
      nome_responsavel2: entity.responsibleName2,
      area_responsavel2: entity.responsibleArea2,
      status_restricao2: entity.restrictionStatus2,
      data_resolucao2: entity.resolutionDate2,

      id_tecnico: entity.idTechnical,
      observacao_restricao: entity.observationRestriction,
      reprovada: entity.rejected,
      id_usuario_ultima_atualizacao: entity.idUser,
    };
  }

  /** Persistência em INSERT: inclui id_obra e id_usuario (criador). */
  static toPersistenceCreate(entity: WorkSchedule) {
    return {
      id_obra: entity.idWork,
      data_prog: entity.dataProg,
      prog: entity.prog,
      equip_desligado: entity.equipment,
      num_dp: entity.numDp,
      hora_ini: entity.startTime,
      hora_ter: entity.finishTime,
      chave_provisoria: entity.temporaryKey,
      tipo_servico: entity.serviceType,
      chi: entity.chi,
      equipe_linha_morta: entity.lmTeam,
      equipe_linha_viva: entity.lvTeam,
      equipe_regularizacao: entity.regulTeam,
      observacao_execucao: entity.executionObservation,
      observacao_programacao: entity.observation,
      id_tecnico: entity.idTechnical,
      id_usuario: entity.idUser,
      id_usuario_ultima_atualizacao: entity.idUser,
    };
  }

  /** Converte o payload de update (strings de hora) em props de domínio. */
  static fromCreateInput(data: SchedulesDataDTO): WorkScheduleProps {
    return {
      ...data,
      ...this.parseDates(data),
      rejected: false,
    };
  }

  /** Atualização: o estado de reprovação vem do registo persistido. */
  static fromUpdateInput(
    data: UpdateSchedulesInterface,
    extras: { rejected: boolean },
  ): WorkScheduleProps {
    return {
      ...data,
      ...this.parseDates(data),
      rejected: extras.rejected,
    };
  }

  /** Conversão e validação das datas — partilhada pelos dois fluxos. */
  private static parseDates(data: {
    dataProg: string | Date;
    startTime: string;
    finishTime: string;
  }) {
    const dataProg = new Date(data.dataProg);
    const startTime = parseTimeToDate(data.startTime);
    const finishTime = parseTimeToDate(data.finishTime);

    if (isNaN(dataProg.getTime())) {
      throw new BadRequestException('Data de programação inválida');
    }
    if (!startTime || isNaN(startTime.getTime())) {
      throw new BadRequestException('Hora de início inválida');
    }
    if (!finishTime || isNaN(finishTime.getTime())) {
      throw new BadRequestException('Hora de término inválida');
    }

    return { dataProg, startTime, finishTime };
  }
}
