import { Inject, Injectable } from '@nestjs/common';
import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import {
  IWorkServicesQueryRepository,
  WORK_SERVICES_QUERY_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import {
  IWorkServicesRepository,
  WORK_SERVICES_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { WorksServicesService } from '../services/worksServices.service';
import { AppLogger } from 'src/core/logger/logger.service';

@Injectable()
export class HandleRescheduleServicesService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(WORK_SERVICES_QUERY_REPOSITORY)
    private readonly workServicesQueryRepository: IWorkServicesQueryRepository,
    @Inject(WORK_SERVICES_REPOSITORY)
    private readonly workServicesRepository: IWorkServicesRepository,
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
    private readonly worksServicesService: WorksServicesService,
    private readonly logger: AppLogger,
  ) {}

  async execute(workId: number, scheduleId: number): Promise<void> {
    try {
      const history =
        await this.workServicesQueryRepository.getServiceScheduleHistory(
          workId,
        );

      const servicesToBeRescheduled =
        this.worksServicesService.getServicesToReschedule(history, scheduleId);

      await this.prisma.$transaction(async (tx) => {
        await this.workServicesRepository.reascheduleServices(
          servicesToBeRescheduled,
          scheduleId,
        );

        await this.statusFlowRepository.updateStatusWorks(36, workId, tx);
        await this.statusFlowRepository.updateScheduleStatus(5, scheduleId, tx);
      });
    } catch (error) {
      this.logger.errorWithMetadata(
        'Falha ao orquestrar reprogramação de serviços',
        {
          workId,
          scheduleId,
          errorMessage: error instanceof Error ? error.message : String(error),
        },
        HandleRescheduleServicesService.name,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }
}
