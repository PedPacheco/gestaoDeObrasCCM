import {
  IUpdateSchedulesRepository,
  UPDATE_SCHEDULES_REPOSITORY,
} from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { ExecutionReportService } from '../executionReport.service';
import { ScheduleExecutionValidatorService } from '../schedule/scheduleExecutionValidator.service';
import {
  IWorkServicesQueryRepository,
  WORK_SERVICES_QUERY_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import {
  IWorkServicesExecutionRepository,
  WORK_SERVICES_EXECUTION_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesExecutionRepository';
import { PerformServicesDTO } from 'src/interface/dtos/workServicesDTO';
import { GetServicesByWorkIdResponse } from 'src/interface/types/servicesInterface';

interface ScheduleTotals {
  exec: number;
  prog: number;
}

interface FinalizationData {
  id: number;
  idWork: number;
  dataProg: Date;
  prog: number;
  exec: number;
  idExecutionRestriction: number;
  responsibility: string;
  executionObservation: string;
  userId: number;
}

@Injectable()
export class FinalizeServicesService {
  private readonly logger = new Logger(FinalizeServicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WORK_SERVICES_EXECUTION_REPOSITORY)
    private readonly worksServicesExecutionRepository: IWorkServicesExecutionRepository,
    @Inject(WORK_SERVICES_QUERY_REPOSITORY)
    private readonly workServicesQueryRepository: IWorkServicesQueryRepository,
    @Inject(UPDATE_SCHEDULES_REPOSITORY)
    private readonly updateSchedulesRepository: IUpdateSchedulesRepository,
    private readonly executionReportService: ExecutionReportService,
    private readonly executionValidator: ScheduleExecutionValidatorService,
  ) {}

  async performServices(data: PerformServicesDTO[]): Promise<void> {
    if (data.length === 0) return;

    await this.worksServicesExecutionRepository.performServices(data);
  }

  async finalizeServices(
    workId: number,
    data: any,
    files?: Express.Multer.File[],
  ): Promise<void> {
    const { executionReportData, userId, ...updateData } = data;

    const [services, history] = await Promise.all([
      this.workServicesQueryRepository.getAllServicesOfWork(workId),
      this.workServicesQueryRepository.getServiceScheduleHistory(workId),
    ]);

    const validServices = services.filter((item) => item.qtde_real !== 0);

    const totalPlanned = this.sumServiceQuantities(validServices);

    const scheduleTotals = this.calculateScheduleTotals(
      history,
      updateData.idSchedule,
    );

    const pendingExecServices = this.getPendingExecServices(
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
      updateData.executionObservation,
      userId,
    );

    await this.executeFinalization(
      workId,
      updateData.idSchedule,
      finalizationData,
      pendingExecServices,
      executionReportData,
      totalPlanned,
      history,
      files,
    );
  }

  private sumServiceQuantities(
    services: GetServicesByWorkIdResponse[],
  ): number {
    return services
      .filter((service) => service.qtde_real !== 0)
      .reduce(
        (sum, service) =>
          sum + (service.viabilizado ?? 0) + (service.qtde_adicional ?? 0),
        0,
      );
  }

  private calculateScheduleTotals(
    history: any[],
    scheduleId: number,
  ): ScheduleTotals {
    return history
      .filter(
        (service) =>
          service.id_programacao === scheduleId && service.real !== 0,
      )
      .reduce(
        (acc, service) => ({
          exec: acc.exec + (service.real ?? 0),
          prog: acc.prog + (service.prog ?? 0),
        }),
        { prog: 0, exec: 0 },
      );
  }

  private getPendingExecServices(history: any[], scheduleId: number): number[] {
    return history
      .filter(
        (service) =>
          service.id_programacao === scheduleId &&
          (service.real == null || service.prog > service.real),
      )
      .map((service) => service.id_servico);
  }

  private calculatePercentage(value: number, total: number): number {
    if (total <= 0) {
      return 0;
    }

    const percentage = (value / total) * 100;

    return Number(percentage.toFixed(4));
  }

  private buildFinalizationData(
    scheduleId: number,
    workId: number,
    scheduleDate: Date,
    totals: ScheduleTotals,
    totalPlanned: number,
    idExecutionRestriction: number,
    responsibility: string,
    executionObservation: string,
    userId: number,
  ): FinalizationData {
    return {
      id: scheduleId,
      idWork: workId,
      dataProg: scheduleDate,
      prog: this.calculatePercentage(totals.prog, totalPlanned),
      exec: this.calculatePercentage(totals.exec, totalPlanned),
      idExecutionRestriction,
      responsibility,
      executionObservation,
      userId,
    };
  }

  private calculateExecutedFromQuantities(
    history: any[],
    totalPlanned: number,
    currentScheduleId: number,
  ): number {
    const totalReal = history
      .filter((item) => item.id_programacao !== currentScheduleId)
      .reduce((sum, item) => sum + (item.real ?? 0), 0);

    return Math.min(this.calculatePercentage(totalReal, totalPlanned), 100);
  }

  private async executeFinalization(
    workId: number,
    scheduleId: number,
    finalizationData: FinalizationData,
    pendingExecServices: number[],
    executionReportData: any,
    totalPlanned: number,
    history: any[],
    files?: Express.Multer.File[],
  ): Promise<void> {
    // Calcula o total executado a partir das quantidades brutas (não das % arredondadas)
    const executed = this.calculateExecutedFromQuantities(
      history,
      totalPlanned,
      scheduleId,
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

        await this.worksServicesExecutionRepository.finalizeServices(
          finalizationData,
          pendingExecServices,
          tx,
        );
      } catch (error) {
        this.logger.error(error);
        throw error;
      }
    });
  }
}
