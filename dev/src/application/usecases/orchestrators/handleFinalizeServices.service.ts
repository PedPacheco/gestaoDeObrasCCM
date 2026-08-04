import { Inject, Injectable } from '@nestjs/common';
import {
  IUpdateSchedulesRepository,
  UPDATE_SCHEDULES_REPOSITORY,
} from 'src/domain/contracts/schedule/IUpdateSchedulesRepository';
import {
  IWorkServicesQueryRepository,
  WORK_SERVICES_QUERY_REPOSITORY,
} from 'src/domain/contracts/worksService/IWorkServicesQueryRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { FinalizeServicesService } from '../services/finalizeServices.service';
import { ExecutionReportService } from '../executionReport.service';
import { ScheduleExecutionValidatorService } from '../schedule/scheduleExecutionValidator.service';
import { AppLogger } from 'src/core/logger/logger.service';

@Injectable()
export class HandleFinalizeServicesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WORK_SERVICES_QUERY_REPOSITORY)
    private readonly workServicesQueryRepository: IWorkServicesQueryRepository,
    @Inject(UPDATE_SCHEDULES_REPOSITORY)
    private readonly updateSchedulesRepository: IUpdateSchedulesRepository,
    private readonly finalizeServicesService: FinalizeServicesService,
    private readonly executionReportService: ExecutionReportService,
    private readonly executionValidator: ScheduleExecutionValidatorService,
    private readonly logger: AppLogger,
  ) {}

  async execute(
    workId: number,
    data: any,
    files?: Express.Multer.File[],
  ): Promise<void> {
    try {
      const { executionReportData, ...updateData } = data;

      // 1. Consultar dados necessários
      const [services, history] = await Promise.all([
        this.workServicesQueryRepository.getAllServicesOfWork(workId),
        this.workServicesQueryRepository.getServiceScheduleHistory(workId),
      ]);

      // 2. Delegar cálculos ao service de domínio
      const finalizationData =
        this.finalizeServicesService.buildFinalizationData(
          services,
          history,
          updateData,
        );

      const pendingExecServices =
        this.finalizeServicesService.getPendingExecServices(
          history,
          updateData.idSchedule,
        );

      // 3. Buscar valores de execução
      const executionValues =
        await this.updateSchedulesRepository.findExecutionOfSchedules(
          finalizationData.id,
          workId,
        );

      const executed =
        this.finalizeServicesService.sumExecutionValues(executionValues);

      // 4. Orquestrar a transação
      await this.prisma.$transaction(async (tx) => {
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

        await this.finalizeServicesService.finalizeServices(
          finalizationData,
          pendingExecServices,
          tx,
        );
      });
    } catch (error) {
      this.logger.errorWithMetadata(
        'Falha ao orquestrar finalização dos serviços',
        {
          workId,
          scheduleId: data?.idSchedule,
          executionRestrictionId: data?.idExecutionRestriction,
          filesCount: files?.length ?? 0,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        HandleFinalizeServicesService.name, // ← agora referencia o orchestrator
        error instanceof Error ? error.stack : undefined,
      );

      throw error;
    }
  }
}
