import { Schedule } from 'src/domain/entities/schedule.entity';
import {
  IUpdateSchedulesRepository,
  UPDATE_SCHEDULES_REPOSITORY,
} from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { UpdateSchedulesInterface } from 'src/interface/types/schedule/updateSchedulesInterface';
import { parseTimeToDate } from 'src/utils/parseTimeToDate';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ScheduleExecutionValidatorService } from './scheduleExecutionValidator.service';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { FindScheduleByIdRepository } from 'src/infra/repositories/schedule/findScheduleByIdRepository';
import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';

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

    if (data.exec) {
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
    } catch (error) {
      throw new BadRequestException(
        `Erro ao criar programação: ${error.message}`,
      );
    }

    const formattedData = {
      id: schedule.id,
      id_obra: schedule.idWork,
      data_prog: schedule.dataProg,
      prog: schedule.prog,
      exec: schedule.exec,
      observacao_programacao: schedule.observation,
      equip_desligado: schedule.equipment,
      num_dp: schedule.numDp,
      hora_ini: schedule.startTime,
      hora_ter: schedule.finishTime,
      equipe_linha_morta: schedule.lmTeam,
      equipe_linha_viva: schedule.lvTeam,
      equipe_regularizacao: schedule.regulTeam,
      chave_provisoria: schedule.temporaryKey,
      tipo_servico: schedule.serviceType,
      chi: schedule.chi,
      nome_responsavel_execucao: schedule.responsibility,
      id_restricao_execucao: schedule.idExecutionRestriction,
      observacao_execucao: schedule.observationExecution,
      id_tecnico: schedule.idTechnical,
      reprovada: false,
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
        scheduledFinishTime: schedule.finishTime,
        idWork: schedule.idWork,
      };
    } catch (err) {
      throw new BadRequestException(`Erro ao criar relatório: ${err.message}`);
    }
  }
}
