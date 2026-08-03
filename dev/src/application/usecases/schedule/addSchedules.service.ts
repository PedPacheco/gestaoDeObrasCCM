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

  async add(
    data: SchedulesDataDTO,
    tx: Prisma.TransactionClient,
  ): Promise<number> {
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
    } catch (error: any) {
      throw new BadRequestException(
        `Erro ao criar programação: ${error.message}`,
      );
    }

    const formattedData = {
      id_obra: schedule.idWork,
      data_prog: schedule.dataProg,
      prog: schedule.prog,
      equip_desligado: schedule.equipment,
      num_dp: schedule.numDp,
      hora_ini: schedule.startTime,
      hora_ter: schedule.finishTime,
      chave_provisoria: schedule.temporaryKey,
      tipo_servico: schedule.serviceType,
      chi: schedule.chi,
      observacao_execucao: schedule.observationExecution,
      observacao_programacao: schedule.observation,
      id_tecnico: schedule.idTechnical,
      id_usuario: schedule.idUser,
      id_usuario_ultima_atualizacao: schedule.idUser,
    };

    return await this.addSchedulesRepository.addSchedules(formattedData, tx);
  }
}
