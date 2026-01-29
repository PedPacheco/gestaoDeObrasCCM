import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import { AddSchedulesService } from 'src/application/schedule/addSchedules.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Inject, Injectable } from '@nestjs/common';
import { CreateScheduleWithServicesDTO } from 'src/interface/dtos/scheduleDTO';
import { WorksServicesService } from '../worksServices.service';

@Injectable()
export class HandleAddScheduleService {
  constructor(
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
    private readonly prisma: PrismaService,
    private readonly addScheduleService: AddSchedulesService,
    private readonly servicesService: WorksServicesService,
  ) {}

  async add(data: CreateScheduleWithServicesDTO) {
    const { schedule, services } = data;

    return await this.prisma.$transaction(async (tx) => {
      const id = await this.addScheduleService.add(schedule, tx);

      await this.statusFlowRepository.updateStatusWorks(
        43,
        schedule.idWork,
        tx,
      );

      const servicesWithIdSchedule = services.map((item) => ({
        ...item,
        idSchedule: id,
      }));

      await this.servicesService.scheduleServices(servicesWithIdSchedule);

      return id;
    });
  }
}
