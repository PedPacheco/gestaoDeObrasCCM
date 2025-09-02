import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Schedule } from 'src/domain/entities/schedule.entity';
import {
  ADD_SCHEDULES_REPOSITORY,
  IAddSchedulesRepository,
} from 'src/domain/repositories/schedule/IAddSchedulesRepository';
import { SchedulesDataDTO } from 'src/interface/dtos/scheduleDTO';
import { parseTimeToDate } from 'src/utils/parseTimeToDate';

@Injectable()
export class AddSchedulesService {
  constructor(
    @Inject(ADD_SCHEDULES_REPOSITORY)
    private readonly addSchedulesRepository: IAddSchedulesRepository,
  ) {}

  async add(data: SchedulesDataDTO, tx: Prisma.TransactionClient) {
    if (!data) {
      throw new BadRequestException(
        'Nenhuma programação fornecida para inserção.',
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

    await this.addSchedulesRepository.addSchedules(formattedData, tx);
  }
}
