import { PrismaService } from 'src/infra/prisma/prisma.service';

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { UpdateSchedulesService } from '../schedule/updateSchedules.service';
import { GetWorkDetailsService } from '../works/getWorkDetails.service';
import { ExecutionReportService } from '../executionReport.service';

@Injectable()
export class HandleSchedulesUpdateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly updateSchedulesService: UpdateSchedulesService,
    private readonly executionReportService: ExecutionReportService,
    private readonly getDetailsWorkService: GetWorkDetailsService,
  ) {}

  async newUpdate(data: any, permission: boolean) {
    const work = await this.getDetailsWorkService.get(data.idWork);

    if ([2, 3, 4, 37, 42].includes(work.id_status) && permission) {
      throw new BadRequestException(
        'Usuário não tem permissão para atualizar essa obra',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      try {
        await this.updateSchedulesService.update(data, tx);
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
    });
  }

  async oldUpdate(
    data: any,
    permission: boolean,
    files?: Express.Multer.File[],
  ) {
    const { updateData, executionReportData } = data;

    const work = await this.getDetailsWorkService.get(updateData.idWork);

    if ([2, 3, 4, 37, 42].includes(work.id_status) && permission) {
      throw new BadRequestException(
        'Usuário não tem permissão para atualizar essa obra',
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      try {
        const result = await this.updateSchedulesService.update(updateData, tx);

        if (executionReportData) {
          await this.executionReportService.create(
            {
              idSchedule: result.scheduleId,
              idWork: result.idWork,
              ...executionReportData,
            },
            result.scheduleFinishTime,
            files,
            tx,
          );
        }
      } catch (error) {
        throw new InternalServerErrorException(error);
      }
    });
  }
}
