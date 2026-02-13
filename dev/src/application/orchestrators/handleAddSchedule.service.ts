import { Inject, Injectable } from '@nestjs/common';
import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import { AddSchedulesService } from 'src/application/schedule/addSchedules.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateScheduleWithServicesDTO } from 'src/interface/dtos/scheduleDTO';
import { WorksServicesService } from '../services/worksServices.service';

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

  async add(data: CreateScheduleWithServicesDTO): Promise<number> {
    const { schedule, services } = data;

    return this.prisma.$transaction(async (tx) => {
      const progress =
        await this.worksServicesService.calculateScheduledProgress(
          schedule.idWork,
          services,
        );

      const scheduleId = await this.addScheduleService.add(
        { ...schedule, prog: progress },
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
        progress,
      );

      return scheduleId;
    });
  }

  private attachScheduleId(services: any[], scheduleId: number): any[] {
    return services.map((service) => ({ ...service, idSchedule: scheduleId }));
  }
}
