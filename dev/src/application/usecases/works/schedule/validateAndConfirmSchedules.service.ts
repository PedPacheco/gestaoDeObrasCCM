import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import {
  IValidateConfirmAndRejectSchedulesRepository,
  VALIDATE_CONFIRM_AND_REJECT_SCHEDULES_REPOSITORY,
} from 'src/domain/repositories/schedule/IValidateSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { FindScheduleByIdRepository } from 'src/infra/repositories/schedule/findScheduleByIdRepository';
import {
  ConfirmSchedulesDTO,
  RejectScheduleDTO,
  ValidateSchedulesDTO,
} from 'src/interface/dtos/scheduleDTO';

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { WorkSchedule } from 'src/domain/entities/schedules/workSchedule.entity';
import { WorkScheduleMapper } from 'src/application/mappers/scheduleMapper';

@Injectable()
export class ValidateConfirmAndRejectSchedulesService {
  constructor(
    @Inject(VALIDATE_CONFIRM_AND_REJECT_SCHEDULES_REPOSITORY)
    private readonly validateAndConfirmSchedulesRepository: IValidateConfirmAndRejectSchedulesRepository,
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
    @Inject(FIND_SCHEDULE_BY_ID_REPOSITORY)
    private readonly findScheduleByIdRepository: FindScheduleByIdRepository,
    private readonly prisma: PrismaService,
  ) {}

  async validate(data: ValidateSchedulesDTO[]) {
    if (!data || data.length === 0) {
      throw new BadRequestException(
        'Nenhuma programação foi enviada para ser validada',
      );
    }

    const validatedSchedules = data.filter((item) => !item.validate);

    if (validatedSchedules.length > 0) {
      throw new BadRequestException('Existe programações não validadas');
    }

    const work = await this.findScheduleByIdRepository.findById(data[0].id);

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.validateAndConfirmSchedulesRepository.validate(data, tx);
        await this.statusFlowRepository.updateStatusWorks(37, work.id_obra, tx);
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error);
    }
  }

  async confirm(data: ConfirmSchedulesDTO[]) {
    const confirmedSchedules = data.filter((item) => item.confirm);

    if (confirmedSchedules.length === 0) {
      throw new BadRequestException('Nenhuma programação para ser confirmada');
    }

    const works = await Promise.all(
      confirmedSchedules.map((item) =>
        this.findScheduleByIdRepository.findById(item.id),
      ),
    );

    let schedules: WorkSchedule[];

    try {
      schedules = works.map((work) => WorkScheduleMapper.toDomain(work));
    } catch (error: any) {
      throw new BadRequestException(
        `Erro ao criar programação: ${error.message}`,
      );
    }

    for (const schedule of schedules) {
      schedule.validatedSchedulingConfirmation();
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.validateAndConfirmSchedulesRepository.confirm(
          confirmedSchedules,
          tx,
        );

        await this.statusFlowRepository.updateStatusWorks(
          35,
          works[0].id_obra,
          tx,
        );
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error);
    }
  }

  async reject(data: RejectScheduleDTO[]) {
    if (!data.length) return;

    await this.prisma.$transaction(async (tx) => {
      for (const item of data) {
        const schedule = await this.findScheduleByIdRepository.findById(
          item.id,
        );

        const rejectedScheduleData = {
          ...item,
          ...schedule,
        };

        await this.validateAndConfirmSchedulesRepository.reject(
          rejectedScheduleData,
          tx,
        );

        await this.statusFlowRepository.updateStatusWorks(
          36,
          schedule.id_obra,
          tx,
        );
      }
    });
  }
}
