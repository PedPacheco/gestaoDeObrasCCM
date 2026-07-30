import {
  IWorkServicesQueryRepository,
  WORK_SERVICES_QUERY_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import {
  IWorkServicesRepository,
  WORK_SERVICES_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesRepository';
import {
  AddServicesDTO,
  ApplyAdditonalDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class WorksServicesService {
  constructor(
    @Inject(WORK_SERVICES_REPOSITORY)
    private readonly workServicesRepository: IWorkServicesRepository,
    @Inject(WORK_SERVICES_QUERY_REPOSITORY)
    private readonly workServicesQueryRepository: IWorkServicesQueryRepository,
  ) {}

  async scheduleServices(
    workId: number,
    data: ScheduleServicesDTO[],
    scheduleProg?: number,
  ): Promise<void> {
    const idSchedule = data[0]?.idSchedule;

    const prog =
      scheduleProg ?? (await this.calculateScheduledProgress(workId, data));

    await this.validateScheduleServices(workId, data, prog);

    const progressValue = scheduleProg ? prog : { increment: prog };

    await this.workServicesRepository.scheduleServices(
      data,
      progressValue,
      idSchedule,
    );
  }

  async calculateScheduledProgress(
    workId: number,
    servicesSelected: any[],
  ): Promise<number> {
    const services =
      await this.workServicesQueryRepository.getAllServicesOfWork(workId);

    const validServices = services.filter((item) => item.qtde_real !== 0);

    const totalPlan = this.sumServiceQuantities(validServices);

    const selectedPlan = servicesSelected.reduce(
      (sum, item) => sum + item.prog,
      0,
    );

    const result = Math.round(
      totalPlan > 0 ? (selectedPlan / totalPlan) * 100 : 0,
    );

    return Math.min(result, 100);
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
    const { idService, point, idWork } = data;

    const items =
      await this.workServicesQueryRepository.getAllServicesOfWork(idWork);

    const itemsMap = new Map(
      items.map((item) => [
        `${
          type === 'service' ? item.id_contrato_servico : item.id_material
        }:${item.ponto}`,
        item,
      ]),
    );

    if (itemsMap.has(`${idService}:${point}`)) {
      throw new BadRequestException(
        `Esse ${type === 'service' ? 'serviço' : 'material'} já existe nesse ponto.`,
      );
    }

    await this.workServicesRepository.addItem(data, type);
  }

  getServicesToReschedule(
    history: any[],
    scheduleId: number,
  ): { id: number; id_servico: number }[] {
    return history
      .filter(
        (item) =>
          (item.real < item.prog || !item.real) &&
          item.id_programacao === scheduleId,
      )
      .map((item) => ({ id: item.id, id_servico: item.id_servico }));
  }

  private sumServiceQuantities(services: any[]): number {
    return services.reduce(
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
      history.map((item) => `${item.id_programacao}-${item.id_servico}`),
    );

    const hasDuplicate = data.some((service) =>
      scheduledServices.has(`${service.idSchedule}-${service.id}`),
    );

    if (hasDuplicate) {
      throw new BadRequestException(
        'Esse serviço já foi programado, nessa programação atual!!',
      );
    }
  }
}
