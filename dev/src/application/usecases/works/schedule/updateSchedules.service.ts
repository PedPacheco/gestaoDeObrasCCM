import {
  IUpdateSchedulesRepository,
  UPDATE_SCHEDULES_REPOSITORY,
} from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { UpdateSchedulesInterface } from 'src/interface/types/schedule/updateSchedulesInterface';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { FindScheduleByIdRepository } from 'src/infra/repositories/schedule/findScheduleByIdRepository';
import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import { ScheduleExecutionValidatorService } from './scheduleExecutionValidator.service';
import { WorkSchedule } from 'src/domain/entities/schedules/workSchedule.entity';
import { WorkScheduleMapper } from 'src/application/mappers/scheduleMapper';

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

    const schedule = WorkSchedule.create(
      WorkScheduleMapper.fromUpdateInput(data, { rejected: reprovada }),
    );

    const formattedData = WorkScheduleMapper.toPersistenceUpdate(schedule);

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
