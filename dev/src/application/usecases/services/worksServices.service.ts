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

    const totalPlan = this.sumServiceQuantities(services);

    const selectedPlan = servicesSelected.reduce(
      (sum, item) => sum + item.prog,
      0,
    );

    const result = Math.round(
      totalPlan > 0 ? (selectedPlan / totalPlan) * 100 : 0,
    );

    return Math.min(result, 100);
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

  async addServices(data: AddServicesDTO): Promise<void> {
    const { idService, point, idWork } = data;

    const services =
      await this.workServicesQueryRepository.getAllServicesOfWork(idWork);

    const servicesMap = new Map(
      services.map((s) => [`${s.id_contrato_servico}:${s.ponto}`, s]),
    );

    if (servicesMap.has(`${idService}:${point}`)) {
      throw new BadRequestException('Esse serviço já existe nesse ponto.');
    }

    await this.workServicesRepository.addServices(data);
  }

  async addMaterials(data: AddServicesDTO): Promise<void> {
    const { idService, point, idWork } = data;

    console.log(data);

    const materials =
      await this.workServicesQueryRepository.getAllMaterialsOfWork(idWork);

    const materialsMap = new Map(
      materials.map((s) => [`${s.id_material}:${s.ponto}`, s]),
    );

    if (materialsMap.has(`${idService}:${point}`)) {
      throw new BadRequestException('Esse material já existe nesse ponto.');
    }

    await this.workServicesRepository.addMaterials(data);
  }

  private sumServiceQuantities(services: any[]): number {
    return services.reduce(
      (sum, service) => sum + (service.viabilizado ?? 0),
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
