import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import { AddSchedulesService } from 'src/application/schedule/addSchedules.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { SchedulesDataDTO } from 'src/interface/dtos/scheduleDTO';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class HandleAddScheduleService {
  constructor(
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
    private readonly prisma: PrismaService,
    private readonly addScheduleService: AddSchedulesService,
  ) {}

  async add(data: SchedulesDataDTO) {
    return await this.prisma.$transaction(async (tx) => {
      const id = await this.addScheduleService.add(data, tx);

      await this.statusFlowRepository.updateStatusWorks(43, data.idWork, tx);

      return id;
    });
  }
}
