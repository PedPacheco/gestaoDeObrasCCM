import {
  ExecutionReportDataInput,
  FinalizeServicesData,
  FinalizeServicesInput,
  PerformServicesInput,
} from 'src/application/types';
import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/contracts/IStatusFlowRepository';
import {
  IWorkServicesExecutionRepository,
  WORK_SERVICES_EXECUTION_REPOSITORY,
} from 'src/domain/contracts/worksService/IWorkServicesExecutionRepository';
import {
  IWorkServicesQueryRepository,
  WORK_SERVICES_QUERY_REPOSITORY,
} from 'src/domain/contracts/worksService/IWorkServicesQueryRepository';
import {
  IWorkServicesRepository,
  WORK_SERVICES_REPOSITORY,
} from 'src/domain/contracts/worksService/IWorkServicesRepository';
import { ScheduleProgressCalculatorService } from 'src/domain/services/scheduleProgressCalculator.service';
import {
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryResponse,
} from 'src/domain/types';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  isMaterial,
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/serviceType.utils';

import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { ExecutionReportService } from '../executionReport.service';
import { ScheduleExecutionValidatorService } from '../schedule/scheduleExecutionValidator.service';

@Injectable()
export class FinalizeServicesService {
  private readonly logger = new Logger(FinalizeServicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WORK_SERVICES_EXECUTION_REPOSITORY)
    private readonly worksServicesExecutionRepository: IWorkServicesExecutionRepository,
    @Inject(WORK_SERVICES_REPOSITORY)
    private readonly workServicesRepository: IWorkServicesRepository,
    @Inject(WORK_SERVICES_QUERY_REPOSITORY)
    private readonly workServicesQueryRepository: IWorkServicesQueryRepository,
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
    private readonly executionReportService: ExecutionReportService,
    private readonly executionValidator: ScheduleExecutionValidatorService,
    private readonly scheduleProgressCalculator: ScheduleProgressCalculatorService,
  ) {}

  async performServices(data: PerformServicesInput[]): Promise<void> {
    if (data.length === 0) return;

    await this.worksServicesExecutionRepository.performServices(data);
  }

  async reascheduleServices(workId: number, scheduleId: number): Promise<void> {
    const history =
      await this.workServicesQueryRepository.getServiceScheduleHistory(workId);

    const servicesToBeReascheduled = history
      .filter(
        (item) =>
          (item.real < item.prog || !item.real) &&
          item.id_programacao === scheduleId,
      )
      .map((item) => ({ id: item.id, id_servico: item.id_servico }));

    await this.prisma.$transaction(async (tx) => {
      try {
        await this.worksServicesExecutionRepository.reascheduleServices(
          servicesToBeReascheduled,
          scheduleId,
          tx,
        );

        await this.statusFlowRepository.updateStatusWorks(
          WorkStatus.SERVICOS_REAGENDADOS,
          workId,
          tx,
        );
        await this.statusFlowRepository.updateScheduleStatus(
          ScheduleStatus.REAGENDADA,
          scheduleId,
          tx,
        );
      } catch (error: any) {
        this.logger.error(error);
        throw error;
      }
    });
  }

  async finalizeServices(
    workId: number,
    data: FinalizeServicesInput,
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

    const dateProg = history.find(
      (item) => item.id_programacao === updateData.idSchedule,
    );

    if (!dateProg) {
      throw new NotFoundException(
        `Nenhum histórico encontrado para a programação ${updateData.idSchedule} nesta obra.`,
      );
    }

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
      .filter((service) => service.qtde_real !== 0 && !isMaterial(service))
      .reduce(
        (sum, service) =>
          sum + (service.viabilizado ?? 0) + (service.qtde_adicional ?? 0),
        0,
      );
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
  ): FinalizeServicesData {
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
    finalizationData: FinalizeServicesData,
    executionReportData: ExecutionReportDataInput,
    totalPlanned: number,
    history: GetServiceScheduleHistoryResponse[],
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
          tx,
        );

        // Finalizar pode zerar o `real` de algum serviço (setado antes,
        // via performServices) — isso exclui o serviço do totalPlanned e
        // invalida o prog/exec de TODAS as outras programações, não só
        // a que está sendo finalizada agora. `history`/`totalPlanned` já
        // refletem esse zeramento (foram lidos após o performServices).
        await this.recalculateOtherSchedulesProgress(
          history,
          totalPlanned,
          scheduleId,
          tx,
        );
      } catch (error) {
        this.logger.error(error);
        throw error;
      }
    });
  }

  // A programação atual já foi persistida por
  // worksServicesExecutionRepository.finalizeServices logo acima — aqui só
  // atualizamos as DEMAIS, em lote.
  private async recalculateOtherSchedulesProgress(
    history: GetServiceScheduleHistoryResponse[],
    totalPlanned: number,
    currentScheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const otherSchedulesProgress = this.scheduleProgressCalculator
      .calculateAllSchedulesProgress(history, totalPlanned)
      .filter((item) => item.idProgramacao !== currentScheduleId);

    await this.workServicesRepository.updateSchedulesProgress(
      otherSchedulesProgress,
      tx,
    );
  }
}
