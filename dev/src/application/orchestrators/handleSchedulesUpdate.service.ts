import { UpdateSchedulesService } from 'src/application/schedule/updateSchedules.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { ExecutionReportService } from '../executionReport.service';
import { GetWorkDetailsService } from '../works/getWorkDetails.service';

@Injectable()
export class HandleSchedulesUpdateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly updateSchedulesService: UpdateSchedulesService,
    private readonly executionReportService: ExecutionReportService,
    private readonly getDetailsWorkService: GetWorkDetailsService,
  ) {}

  async update(data: any, permission: boolean) {
    const { updateData, executionReportData } = data;

    const work = await this.getDetailsWorkService.get(updateData.idWork);

    if ([43, 37, 3, 4, 42].includes(work.id_status) && permission) {
      throw new BadRequestException(
        'Usuário não tem permissão para atualizar essa obra',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      try {
        const result = await this.updateSchedulesService.update(updateData, tx);

        if (Object.keys(executionReportData).length > 0) {
          await this.executionReportService.create(
            {
              idSchedule: result.scheduleId,
              idWork: result.idWork,
              ...executionReportData,
            },
            result.scheduledFinishTime,
            tx,
          );
        }
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
    });
  }
}
