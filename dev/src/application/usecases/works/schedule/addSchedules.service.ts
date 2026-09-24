import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { WorkScheduleMapper } from 'src/application/mappers/scheduleMapper';
import { WorkSchedule } from 'src/domain/entities/schedules/workSchedule.entity';
import {
  ADD_SCHEDULES_REPOSITORY,
  IAddSchedulesRepository,
} from 'src/domain/repositories/schedule/IAddSchedulesRepository';
import { SchedulesDataDTO } from 'src/interface/dtos/scheduleDTO';

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

    const schedule = WorkSchedule.create(
      WorkScheduleMapper.fromCreateInput(data),
    );

    const formattedData = WorkScheduleMapper.toPersistenceCreate(schedule);

    return await this.addSchedulesRepository.addSchedules(formattedData, tx);
  }
}
