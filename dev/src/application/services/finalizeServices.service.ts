import {
  IWorksServicesRepository,
  WORKS_SERVICE_REPOSITORY,
} from 'src/domain/repositories/IWorksServiceRepository';
import {
  IUpdateSchedulesRepository,
  UPDATE_SCHEDULES_REPOSITORY,
} from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { ExecutionReportService } from '../executionReport.service';
import { ScheduleExecutionValidatorService } from '../schedule/scheduleExecutionValidator.service';

interface ScheduleTotals {
  prog: number;
  exec: number;
}

interface FinalizationData {
  id: number;
  idWork: number;
  dataProg: Date;
  prog: number;
  exec: number;
  idExecutionRestriction: number;
  responsibility: string;
}

@Injectable()
export class FinalizeServicesService {
  private readonly logger = new Logger(FinalizeServicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WORKS_SERVICE_REPOSITORY)
    private readonly worksServicesRepository: IWorksServicesRepository,
    @Inject(UPDATE_SCHEDULES_REPOSITORY)
    private readonly updateSchedulesRepository: IUpdateSchedulesRepository,
    private readonly executionReportService: ExecutionReportService,
    private readonly executionValidator: ScheduleExecutionValidatorService,
  ) {}

  async finalizeServices(
    workId: number,
    data: any,
    files?: Express.Multer.File[],
  ): Promise<void> {
    const { executionReportData, ...updateData } = data;

    const [services, history] = await Promise.all([
      this.worksServicesRepository.getAllServicesOfWork(workId),
      this.worksServicesRepository.getServiceScheduleHistory(workId),
    ]);

    const totalPlanned = this.sumServiceQuantities(services);
    const scheduleTotals = this.calculateScheduleTotals(
      history,
      updateData.idSchedule,
    );

    const finalizationData = this.buildFinalizationData(
      updateData.idSchedule,
      workId,
      history[0].programacoes.data_prog,
      scheduleTotals,
      totalPlanned,
      updateData.idExecutionRestriction,
      updateData.responsibility,
    );

    await this.executeFinalization(
      workId,
      finalizationData,
      executionReportData,
      files,
    );
  }

  private sumServiceQuantities(services: any[]): number {
    return services.reduce((sum, service) => sum + (service.qtde_plan ?? 0), 0);
  }

  private calculateScheduleTotals(
    history: any[],
    scheduleId: number,
  ): ScheduleTotals {
    return history
      .filter((service) => service.id_programacao === scheduleId)
      .reduce(
        (acc, service) => ({
          exec: acc.exec + (service.real ?? 0),
          prog: acc.prog + (service.prog ?? 0),
        }),
        { prog: 0, exec: 0 },
      );
  }

  private buildFinalizationData(
    scheduleId: number,
    workId: number,
    scheduleDate: Date,
    totals: ScheduleTotals,
    totalPlanned: number,
    idExecutionRestriction: number,
    responsibility: string,
  ): FinalizationData {
    const calculatePercentage = (value: number) =>
      totalPlanned > 0 ? (value / totalPlanned) * 100 : 0;

    return {
      id: scheduleId,
      idWork: workId,
      dataProg: scheduleDate,
      prog: calculatePercentage(totals.prog),
      exec: calculatePercentage(totals.exec),
      idExecutionRestriction,
      responsibility,
    };
  }

  private async executeFinalization(
    workId: number,
    finalizationData: FinalizationData,
    executionReportData: any,
    files?: Express.Multer.File[],
  ): Promise<void> {
    const executionValues =
      await this.updateSchedulesRepository.findExecutionOfSchedules(
        finalizationData.id,
        workId,
      );

    const executed = executionValues.reduce(
      (total, item) => ({
        exec: total.exec + (item.exec ?? 0),
        prog: total.prog + (item.prog ?? 0),
      }),
      { exec: 0, prog: 0 },
    );

    await this.prisma.$transaction(async (tx) => {
      try {
        if (Object.keys(executionReportData).length > 0) {
          await this.executionReportService.create(
            {
              idSchedule: finalizationData.id,
              idWork: workId,
              ...executionReportData,
            },
            finalizationData.dataProg,
            files,
            tx,
          );
        }

        await this.executionValidator.validateExecutionAndUpdateStatus(
          finalizationData,
          executed,
          tx,
        );

        await this.worksServicesRepository.finalizeServices(
          finalizationData,
          tx,
        );
      } catch (error) {
        this.logger.error(error);
        throw error;
      }
    });
  }
}
