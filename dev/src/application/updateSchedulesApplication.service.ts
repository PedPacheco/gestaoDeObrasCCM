import { ExecutionReportService } from 'src/domain/services/executionReport.service';
import { UpdateSchedulesService } from 'src/domain/services/schedule/updateSchedules.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { UpdateSchedulesDataDTO } from 'src/interface/dtos/scheduleDTO';

import { Injectable } from '@nestjs/common';

@Injectable()
export class UpdateSchedulesApplicationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly updateSchedulesService: UpdateSchedulesService,
    private readonly executionReportService: ExecutionReportService,
  ) {}

  async update(data: UpdateSchedulesDataDTO) {
    return await this.prisma.$transaction(async (tx) => {
      try {
        const result = await this.updateSchedulesService.update(data, tx);

        if (result.executionReportRequired) {
          await this.executionReportService.create(
            {
              idSchedule: result.scheduleId,
              idUser: data.idUser,
              idWork: result.idWork,
            },
            tx,
          );
        }

        return result;
      } catch (error) {
        console.error('Erro na transação:', error);
        throw error;
      }
    });
  }
}
