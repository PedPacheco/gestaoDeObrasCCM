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

@Injectable()
export class UpdateSchedulesService {
  constructor(
    @Inject(UPDATE_SCHEDULES_REPOSITORY)
    private readonly updateSchedulesRepository: IUpdateSchedulesRepository,
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

      const executed = executionValues.reduce((total, item) => {
        return total + (item || 0);
      }, 0);

      await this.executionValidator.validateExecutionAndUpdateStatus(
        data,
        executed,
        tx,
      );
    }

    let schedule: Schedule;

    try {
      schedule = Schedule.create({
        ...data,
        startTime: parseTimeToDate(data.startTime),
        finishTime: parseTimeToDate(data.finishTime),
        dataProg: new Date(data.dataProg),
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
      observ_programacao: schedule.equipment,
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
    };

    try {
      await this.updateSchedulesRepository.update(formattedData, tx);

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
