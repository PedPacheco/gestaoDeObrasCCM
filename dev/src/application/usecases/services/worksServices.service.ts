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
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import {
  IWorkServicesQueryRepository,
  WORK_SERVICES_QUERY_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';

@Injectable()
export class WorksServicesService {
  private readonly logger = new Logger(WorksServicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    @Inject(WORK_SERVICES_REPOSITORY)
    private readonly workServicesRepository: IWorkServicesRepository,
    @Inject(WORK_SERVICES_QUERY_REPOSITORY)
    private readonly workServicesQueryRepository: IWorkServicesQueryRepository,
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
  ) {}

  async scheduleServices(
    workId: number,
    data: ScheduleServicesDTO[],
  ): Promise<void> {
    const idSchedule = data[0]?.idSchedule;

    const prog = await this.calculateScheduledProgress(workId, data);

    await this.validateScheduleServices(workId, data, prog);

    await this.workServicesRepository.scheduleServices(data, prog, idSchedule);
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
        await this.workServicesRepository.reascheduleServices(
          servicesToBeReascheduled,
          scheduleId,
        );

        await this.statusFlowRepository.updateStatusWorks(36, workId, tx);
        await this.statusFlowRepository.updateScheduleStatus(5, scheduleId, tx);
      } catch (error: any) {
        this.logger.error(error);
        throw error;
      }
    });
  }

  async cancelServices(id: number): Promise<void> {
    await this.workServicesRepository.cancelServices(id);
  }

  async applyAdditional(data: ApplyAdditonalDTO[]): Promise<void> {
    await this.workServicesRepository.applyAdditional(data);
  }

  async addItem(
    data: AddServicesDTO,
    type: 'service' | 'material',
  ): Promise<void> {
    const { idService, operationNumber, point, idWork } = data;

    const items =
      await this.workServicesQueryRepository.getAllServicesOfWork(idWork);

    const itemsMap = new Map(
      items.map((item) => [
        `${
          type === 'service' ? item.id_contrato_servico : item.id_material
        }:${item.ponto}:${item.numero_operacao}`,
        item,
      ]),
    );

    if (itemsMap.has(`${idService}:${point}:${operationNumber}`)) {
      throw new BadRequestException(
        `Esse ${type === 'service' ? 'serviço' : 'material'} já existe nesse ponto.`,
      );
    }

    await this.workServicesRepository.addItem(data, type);
  }

  private calculateProgress(scheduledPlan: number, totalPlan: number): number {
    if (Math.abs(totalPlan - scheduledPlan) < 0.0001) {
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
      .filter((item) => Number(item.qtde_real) !== 0)
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
