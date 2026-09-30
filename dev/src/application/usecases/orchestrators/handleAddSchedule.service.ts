import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Inject, Injectable } from '@nestjs/common';

import { AddSchedulesService } from '../works/schedule/addSchedules.service';
import { WorksServicesService } from '../services/worksServices.service';
import {
  CreateScheduleWithServicesDTO,
  SchedulesDataDTO,
} from 'src/interface/dtos/scheduleDTO';

const SCHEDULE_STATUS_ID = 43;
@Injectable()
export class HandleAddScheduleService {
  constructor(
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
    private readonly worksServicesService: WorksServicesService,
    private readonly prisma: PrismaService,
    private readonly addScheduleService: AddSchedulesService,
  ) {}

  async add(data: SchedulesDataDTO) {
    await this.prisma.$transaction(async (tx) => {
      await this.addScheduleService.add(data, tx);

      await this.statusFlowRepository.updateStatusWorks(43, data.idWork, tx);
    });
  }

  async newAdd(data: CreateScheduleWithServicesDTO): Promise<number> {
    const { schedule, services } = data;

    return this.prisma.$transaction(async (tx) => {
      const scheduleId = await this.addScheduleService.add(
        { ...schedule, prog: 0 },
        tx,
      );

      await this.statusFlowRepository.updateStatusWorks(
        SCHEDULE_STATUS_ID,
        schedule.idWork,
        tx,
      );

      await this.worksServicesService.scheduleServices(
        schedule.idWork,
        this.attachScheduleId(services, scheduleId),
      );

      return 1;
    });
  }

  private attachScheduleId(services: any[], scheduleId: number): any[] {
    return services.map((service) => ({ ...service, idSchedule: scheduleId }));
  }
}
