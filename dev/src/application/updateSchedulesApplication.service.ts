import { ExecutionReportService } from 'src/domain/services/executionReport.service';
import { UpdateSchedulesService } from 'src/domain/services/schedule/updateSchedules.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class UpdateSchedulesApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly updateSchedulesService: UpdateSchedulesService,
    private readonly executionReportService: ExecutionReportService,
  ) {}

  async update(data: any) {
    return await this.prisma.$transaction(async (tx) => {
      try {
        const result = await this.updateSchedulesService.update(
          data.updateData,
          tx,
        );

        if (Object.keys(data.executionReportData).length !== 0) {
          await this.executionReportService.create(
            {
              idSchedule: result.scheduleId,
              idWork: result.idWork,
              ...data.executionReportData,
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
