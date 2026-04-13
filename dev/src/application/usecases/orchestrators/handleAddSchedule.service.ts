import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { SchedulesDataDTO } from 'src/interface/dtos/scheduleDTO';

import { Inject, Injectable } from '@nestjs/common';
import { AddSchedulesService } from '../schedule/addSchedules.service';

@Injectable()
export class HandleAddScheduleService {
  constructor(
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
    private readonly prisma: PrismaService,
    private readonly addScheduleService: AddSchedulesService,
  ) {}

  async add(data: SchedulesDataDTO) {
    await this.prisma.$transaction(async (tx) => {
      await this.addScheduleService.add(data, tx);

      await this.statusFlowRepository.updateStatusWorks(43, data.idWork, tx);
    });
  }
}
