import {
  IWorkServicesRepository,
  WORK_SERVICES_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesRepository';
import {
  AddServicesDTO,
  ApplyAdditonalDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';

import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  IWorkServicesQueryRepository,
  WORK_SERVICES_QUERY_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import { ScheduleProgressCalculatorService } from 'src/domain/services/scheduleProgressCalculator.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class WorksServicesService {
  private readonly logger = new Logger(WorksServicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WORK_SERVICES_REPOSITORY)
    private readonly workServicesRepository: IWorkServicesRepository,
    @Inject(WORK_SERVICES_QUERY_REPOSITORY)
    private readonly workServicesQueryRepository: IWorkServicesQueryRepository,

    private readonly scheduleProgressCalculator: ScheduleProgressCalculatorService,
  ) {}

  async scheduleServices(
    workId: number,
    data: ScheduleServicesDTO[],
  ): Promise<void> {
    const idSchedule = data[0]?.idSchedule;

    const onlyServices = data.filter((item) => item.type === 'S');

    const prog = await this.calculateScheduledProgress(workId, onlyServices);

    await this.validateScheduleServices(workId, data, prog);

    await this.workServicesRepository.scheduleServices(
      data,
      { increment: prog },
      idSchedule,
    );
  }

  async cancelServices(id: number): Promise<void> {
    await this.workServicesRepository.cancelServices(id);
  }

  async applyAdditional(
    workId: number,
    data: ApplyAdditonalDTO[],
  ): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        try {
          await this.workServicesRepository.applyAdditional(data, tx);
          await this.recalculateAllSchedulesProgress(workId, tx);
        } catch (error) {
          this.logger.error(error);
          throw error;
        }
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );
  }

  async addItem(
    data: AddServicesDTO,
    type: 'service' | 'material',
  ): Promise<void> {
    const { idService, operationDescription, point, idWork } = data;

    const items =
      await this.workServicesQueryRepository.getAllServicesOfWork(idWork);

    const itemsMap = new Map(
      items.map((item) => [
        `${
          type === 'service' ? item.id_contrato_servico : item.id_material
        }:${item.ponto}:${item.descricao_operacao}`,
        item,
      ]),
    );

    if (itemsMap.has(`${idService}:${point}:${operationDescription}`)) {
      throw new BadRequestException(
        `Esse ${type === 'service' ? 'serviço' : 'material'} já existe nesse ponto.`,
      );
    }

    await this.prisma.$transaction(
      async (tx) => {
        try {
          await this.workServicesRepository.addItem(data, type, tx);
          await this.recalculateAllSchedulesProgress(idWork, tx);
        } catch (error) {
          this.logger.error(error);
          throw error;
        }
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );
  }

  async delete(id: number, workId: number) {
    if (!id) {
      throw new BadRequestException(
        'Nenhum serviço/material fornecida para exclusão.',
      );
    }

    await this.prisma.$transaction(
      async (tx) => {
        try {
          await this.workServicesRepository.delete(id, tx);
          await this.recalculateAllSchedulesProgress(workId, tx);
        } catch (error) {
          this.logger.error(error);
          throw error;
        }
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );
  }

  async deleteAll(workId: number) {
    await this.workServicesRepository.deleteAll(workId);
  }

  private async recalculateAllSchedulesProgress(
    workId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const [services, history] = await Promise.all([
      this.workServicesQueryRepository.getAllServicesOfWork(workId, tx),
      this.workServicesQueryRepository.getServiceScheduleHistory(workId, tx),
    ]);

    const totalPlanned = this.sumServiceQuantities(services);

    const schedulesProgress =
      this.scheduleProgressCalculator.calculateAllSchedulesProgress(
        history,
        totalPlanned,
      );

    const executed = history
      .filter((item) => item.real !== 0 && item.servicos?.materiais === null)
      .reduce((sum, item) => sum + (item.real ?? 0), 0);

    const workProgress =
      totalPlanned > 0
        ? Number(((executed / totalPlanned) * 100).toFixed(4))
        : 0;

    await this.workServicesRepository.updateSchedulesProgress(
      schedulesProgress,
      tx,
    );

    await this.workServicesRepository.updateWorkExecuted(
      workId,
      workProgress,
      tx,
    );
  }

  private calculateProgress(scheduledPlan: number, totalPlan: number): number {
    if (Math.abs(totalPlan - scheduledPlan) < 0.01) {
      return 100;
    }

    return Number(((scheduledPlan / totalPlan) * 100).toFixed(2));
  }

  private async calculateScheduledProgress(
    workId: number,
    servicesSelected: ScheduleServicesDTO[],
  ): Promise<number> {
    const services =
      await this.workServicesQueryRepository.getAllServicesOfWork(workId);

    const totalPlan = this.sumServiceQuantities(services);

    const scheduledPlan = servicesSelected.reduce(
      (sum, item) => sum + item.prog,
      0,
    );

    return this.calculateProgress(scheduledPlan, totalPlan);
  }

  private sumServiceQuantities(services: any[]): number {
    return services
      .filter((item) => item.qtde_real !== 0 && !item.id_material)
      .reduce(
        (sum, service) =>
          sum + (service.viabilizado ?? 0) + (service.qtde_adicional ?? 0),
        0,
      );
  }

  private async validateScheduleServices(
    workId: number,
    data: ScheduleServicesDTO[],
    progress?: number,
  ): Promise<void> {
    if (data.length === 0) {
      throw new BadRequestException('Programação não enviada.');
    }

    const scheduleIds = new Set(data.map((item) => item.idSchedule));

    if (scheduleIds.size !== 1) {
      throw new BadRequestException(
        'Todos os serviços devem pertencer à mesma programação.',
      );
    }

    if (!progress) {
      throw new BadRequestException('Valor do programado tem que ser enviado');
    }

    const history =
      await this.workServicesQueryRepository.getServiceScheduleHistory(workId);

    const scheduledServices = new Set(
      history.map(
        (item) =>
          `${item.id_programacao}-${item.id_servico}-${item.servicos.ponto}-${item.servicos.operacao}`,
      ),
    );

    const hasDuplicate = data.some((service) =>
      scheduledServices.has(
        `${service.idSchedule}-${service.id}-${service.point}-${service.operation}`,
      ),
    );

    if (hasDuplicate) {
      throw new BadRequestException(
        'Esse serviço já foi programado, nessa programação atual!!',
      );
    }
  }
}
