import { Schedule } from 'src/domain/entities/schedule.entity';
import {
  IUpdateSchedulesRepository,
  UPDATE_SCHEDULES_REPOSITORY,
} from 'src/domain/contracts/schedule/IUpdateSchedulesRepository';
import { UpdateSchedulesInterface } from 'src/interface/types/schedule/updateSchedulesInterface';
import { parseTimeToDate } from 'src/utils/parseTimeToDate';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/contracts/schedule/IFindScheduleByIdRepository';
import { FindScheduleByIdRepository } from 'src/infra/repositories/schedule/findScheduleByIdRepository';
import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/contracts/IStatusFlowRepository';
import { ScheduleExecutionValidatorService } from './scheduleExecutionValidator.service';

@Injectable()
export class UpdateSchedulesService {
  constructor(
    @Inject(UPDATE_SCHEDULES_REPOSITORY)
    private readonly updateSchedulesRepository: IUpdateSchedulesRepository,
    @Inject(FIND_SCHEDULE_BY_ID_REPOSITORY)
    private readonly findScheduleByIdRepository: FindScheduleByIdRepository,
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
    private readonly executionValidator: ScheduleExecutionValidatorService,
  ) {}

  async update(data: UpdateSchedulesInterface, tx: Prisma.TransactionClient) {
    if (!data) {
      throw new BadRequestException(
        'Nenhuma programação fornecida para inserção.',
      );
    }

    if (data.exec || data.exec === 0) {
      const executionValues =
        await this.updateSchedulesRepository.findExecutionOfSchedules(
          data.id,
          data.idWork,
        );

      const executed = executionValues.reduce(
        (total, item) => ({
          exec: total.exec + (item.exec || 0),
          prog: total.prog + (item.prog || 0),
        }),
        { exec: 0, prog: 0 },
      );

      await this.executionValidator.validateExecutionAndUpdateStatus(
        data,
        executed,
        tx,
      );
    }

    const { reprovada, id_status_programacao } =
      await this.findScheduleByIdRepository.findById(data.id);

    let schedule: Schedule;

    try {
      schedule = Schedule.create({
        ...data,
        startTime: parseTimeToDate(data.startTime),
        finishTime: parseTimeToDate(data.finishTime),
        dataProg: new Date(data.dataProg),
        reject: reprovada,
      });
    } catch (error: any) {
      throw new BadRequestException(
        `Erro ao criar programação: ${error.message}`,
      );
    }

    const formattedData = {
      id: schedule.id,
      data_prog: schedule.dataProg,
      prog: schedule.prog,
      exec: schedule.exec,
      observacao_programacao: schedule.observation,
      equip_desligado: schedule.equipment,
      num_dp: schedule.numDp,
      hora_ini: schedule.startTime,
      hora_ter: schedule.finishTime,
      chave_provisoria: schedule.temporaryKey,
      tipo_servico: schedule.serviceType,
      chi: schedule.chi,
      nome_responsavel_execucao: schedule.responsibility,
      id_restricao_execucao: schedule.idExecutionRestriction,
      observacao_execucao: schedule.executionObservation,
      id_restricao_prog1: schedule.idProgRestriction1,
      responsabilidade1: schedule.responsibilityProg,
      nome_responsavel: schedule.responsibleName,
      area_responsavel1: schedule.responsibleArea,
      status_restricao1: schedule.restrictionStatus,
      data_resolucao1: schedule.resolutionDate,
      id_restricao_prog2: schedule.idProgRestriction2,
      responsabilidade2: schedule.responsibilityProg2,
      nome_responsavel2: schedule.responsibleName2,
      area_responsavel2: schedule.responsibleArea2,
      status_restricao2: schedule.restrictionStatus2,
      data_resolucao2: schedule.resolutionDate2,
      id_tecnico: schedule.idTechnical,
      observacao_restricao: schedule.observationRestriction,
      reprovada: false,
      id_usuario_ultima_atualizacao: schedule.idUser,
    };

    if (reprovada === true) {
      formattedData.reprovada = false;
    }

    try {
      await this.updateSchedulesRepository.update(formattedData, tx);

      if (id_status_programacao === 7) {
        await this.statusFlowRepository.updateScheduleStatus(1, data.id, tx);
        await this.statusFlowRepository.updateStatusWorks(43, data.idWork, tx);
      }

      return {
        success: true,
        scheduleId: schedule.id,
        scheduleFinishTime: schedule.finishTime,
        idWork: schedule.idWork,
      };
    } catch (err: any) {
      throw new BadRequestException(`Erro ao criar relatório: ${err.message}`);
    }
  }
}
