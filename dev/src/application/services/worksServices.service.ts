import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  WORKS_SERVICE_REPOSITORY,
  IWorksServicesRepository,
} from 'src/domain/repositories/IWorksServiceRepository';
import {
  AddServicesDTO,
  PerformServicesDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';
import { ScheduleExecutionValidatorService } from '../schedule/scheduleExecutionValidator.service';
import {
  IUpdateSchedulesRepository,
  UPDATE_SCHEDULES_REPOSITORY,
} from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { ExecutionReportService } from '../executionReport.service';

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
export class WorksServicesService {
  private readonly logger = new Logger(WorksServicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WORKS_SERVICE_REPOSITORY)
    private readonly worksServicesRepository: IWorksServicesRepository,
    @Inject(UPDATE_SCHEDULES_REPOSITORY)
    private readonly updateSchedulesRepository: IUpdateSchedulesRepository,
    private readonly executionReportService: ExecutionReportService,
    private readonly executionValidator: ScheduleExecutionValidatorService,
  ) {}

  async scheduleServices(
    workId: number,
    data: ScheduleServicesDTO[],
    scheduleProg?: number,
  ): Promise<void> {
    const prog =
      scheduleProg ?? (await this.calculateScheduledProgress(workId, data));

    if (!prog) {
      throw new BadRequestException('Valor do programado tem que ser enviado');
    }

    await this.validateNoDuplicateSchedules(workId, data);

    const progressValue = scheduleProg ? prog : { increment: prog };
    await this.worksServicesRepository.scheduleServices(data, progressValue);
  }

  private async validateNoDuplicateSchedules(
    workId: number,
    services: ScheduleServicesDTO[],
  ): Promise<void> {
    const history =
      await this.worksServicesRepository.getServiceScheduleHistory(workId);

    const scheduledServices = new Set(
      history.map((h) => `${h.id_programacao}-${h.id_servico}`),
    );

    const hasDuplicate = services.some((service) =>
      scheduledServices.has(`${service.idSchedule}-${service.id}`),
    );

    if (hasDuplicate) {
      throw new BadRequestException(
        'Esse serviço já foi programado, nessa programação atual!!',
      );
    }
  }

  async performServices(data: PerformServicesDTO[]): Promise<void> {
    await this.worksServicesRepository.performServices(data);
  }

  async reascheduleServices(data: { id: number }[]): Promise<void> {
    await this.worksServicesRepository.reascheduleServices(data);
  }

  async addServices(data: AddServicesDTO): Promise<void> {
    console.log('entrou');
    await this.worksServicesRepository.addServices(data);
  }

  async cancel(id: number): Promise<void> {
    await this.worksServicesRepository.cancel(id);
  }

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

  async calculateScheduledProgress(
    workId: number,
    servicesSelected: any[],
  ): Promise<number> {
    const services =
      await this.worksServicesRepository.getAllServicesOfWork(workId);

    const totalPlan = this.sumServiceQuantities(services);

    const selectedPlan = servicesSelected.reduce(
      (sum, item) => sum + item.prog,
      0,
    );

    return totalPlan > 0 ? (selectedPlan / totalPlan) * 100 : 0;
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
