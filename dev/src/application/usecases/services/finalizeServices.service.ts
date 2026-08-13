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
import { GetServicesByWorkIdResponse } from 'src/interface/types/servicesInterface';

import { Inject, Injectable, Logger } from '@nestjs/common';

import { ExecutionReportService } from '../executionReport.service';
import { ScheduleExecutionValidatorService } from '../schedule/scheduleExecutionValidator.service';
import { ScheduleProgressCalculatorService } from 'src/domain/services/scheduleProgressCalculator.service';

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
    private readonly scheduleProgressCalculator: ScheduleProgressCalculatorService,
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

    const totalPlanned = this.sumServiceQuantities(services);

    const scheduleTotals =
      this.scheduleProgressCalculator.calculateScheduleProgress(
        history,
        totalPlanned,
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

  private buildFinalizationData(
    scheduleId: number,
    workId: number,
    scheduleDate: Date,
    scheduleTotals: { prog: number; exec: number },
    idExecutionRestriction: number,
    responsibility: string,
    executionObservation: string,
    userId: number,
  ): FinalizationData {
    return {
      id: scheduleId,
      idWork: workId,
      dataProg: scheduleDate,
      prog: scheduleTotals.prog,
      exec: scheduleTotals.exec,
      idExecutionRestriction,
      responsibility,
      executionObservation,
      userId,
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
    // Calcula o total já executado nas DEMAIS programações (agregado,
    // capado em 100) para validar a finalização da atual contra isso.
    const executed = this.scheduleProgressCalculator.calculateAggregateProgress(
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
