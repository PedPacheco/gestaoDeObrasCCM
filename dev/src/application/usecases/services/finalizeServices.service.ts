import {
  IWorkServicesExecutionRepository,
  WORK_SERVICES_EXECUTION_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesExecutionRepository';
import {
  IWorkServicesQueryRepository,
  WORK_SERVICES_QUERY_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { PerformServicesDTO } from 'src/interface/dtos/workServicesDTO';
import {
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryResponse,
} from 'src/interface/types/servicesInterface';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { ExecutionReportService } from '../executionReport.service';
import { ScheduleExecutionValidatorService } from '../schedule/scheduleExecutionValidator.service';

interface ScheduleTotalsById {
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
    private readonly executionReportService: ExecutionReportService,
    private readonly executionValidator: ScheduleExecutionValidatorService,
  ) {}

  async performServices(data: PerformServicesDTO[]): Promise<void> {
    if (data.length === 0) return;

    await this.worksServicesExecutionRepository.performServices(data);
  }

  private isService(item: GetServiceScheduleHistoryResponse): boolean {
    return item.servicos?.materiais === null;
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

    const totalPlanned = this.sumServiceQuantities(services);

    const scheduleTotals = this.calculateScheduleTotalsById(
      history,
      updateData.idSchedule,
    );

    const pendingExecServices = this.getPendingExecServices(
      history,
      updateData.idSchedule,
    );

    const dateProg = history.find(
      (item) => item.id_programacao === updateData.idSchedule,
    );

    const finalizationData = this.buildFinalizationData(
      updateData.idSchedule,
      workId,
      dateProg.programacoes.data_prog,
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
      .filter((service) => service.qtde_real !== 0 && !service.id_material)
      .reduce(
        (sum, service) =>
          sum + (service.viabilizado ?? 0) + (service.qtde_adicional ?? 0),
        0,
      );
  }

  private calculateScheduleTotalsById(
    history: any[],
    scheduleId: number,
  ): ScheduleTotalsById {
    return history
      .filter(
        (service) =>
          service.id_programacao === scheduleId &&
          this.isService(service) &&
          service.real !== 0,
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
          service.real !== 0 &&
          (service.real === null || service.prog > service.real),
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
    scheduleTotalsById: ScheduleTotalsById,
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
      prog: this.calculatePercentage(scheduleTotalsById.prog, totalPlanned),
      exec: this.calculatePercentage(scheduleTotalsById.exec, totalPlanned),
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
  ): ScheduleTotalsById {
    const totals: ScheduleTotalsById = history
      .filter(
        (item) =>
          item.id_programacao !== currentScheduleId &&
          item.real !== 0 &&
          this.isService(item),
      )
      .reduce(
        (acc, item) => ({
          exec: acc.exec + (item.real ?? 0),
          prog: acc.prog + (item.prog ?? 0),
        }),
        {
          exec: 0,
          prog: 0,
        },
      );

    return {
      exec: Math.min(this.calculatePercentage(totals.exec, totalPlanned), 100),
      prog: Math.min(this.calculatePercentage(totals.prog, totalPlanned), 100),
    };
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
