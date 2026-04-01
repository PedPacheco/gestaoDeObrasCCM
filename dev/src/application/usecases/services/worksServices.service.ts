import {
  IWorksServicesRepository,
  WORKS_SERVICE_REPOSITORY,
} from 'src/domain/repositories/IWorksServiceRepository';
import {
  AddServicesDTO,
  ApplyAdditonalDTO,
  PerformServicesDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class WorksServicesService {
  constructor(
    @Inject(WORKS_SERVICE_REPOSITORY)
    private readonly worksServicesRepository: IWorksServicesRepository,
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

  async calculateScheduledProgress(
    workId: number,
    servicesSelected: any[],
  ): Promise<number> {
    const services =
      await this.worksServicesRepository.getAllServicesOfWork(workId);

    const totalPlan = this.sumServiceQuantities(services);

    const selectedPlan = servicesSelected.reduce(
      (sum, item) => sum + (item.prog + item.additional),
      0,
    );

    return Math.round(totalPlan > 0 ? (selectedPlan / totalPlan) * 100 : 0);
  }

  private sumServiceQuantities(services: any[]): number {
    return services.reduce(
      (sum, service) =>
        sum + ((service.qtde_plan ?? 0) + (service.qtde_adicional ?? 0)),
      0,
    );
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

  async applyAdditional(data: ApplyAdditonalDTO[]): Promise<void> {
    await this.worksServicesRepository.applyAdditional(data);
  }

  async performServices(data: PerformServicesDTO[]): Promise<void> {
    await this.worksServicesRepository.performServices(data);
  }

  async reascheduleServices(data: { id: number }[]): Promise<void> {
    await this.worksServicesRepository.reascheduleServices(data);
  }

  async addServices(data: AddServicesDTO): Promise<void> {
    const { idService, point, idWork } = data;

    const services =
      await this.worksServicesRepository.getAllServicesOfWork(idWork);

    const servicesMap = new Map(
      services.map((s) => [`${s.id_contrato_servico}:${s.ponto}`, s]),
    );

    if (servicesMap.has(`${idService}:${point}`)) {
      throw new BadRequestException('Esse serviço já existe nesse ponto.');
    }

    await this.worksServicesRepository.addServices(data);
  }

  async cancelServices(id: number): Promise<void> {
    await this.worksServicesRepository.cancelServices(id);
  }
}
