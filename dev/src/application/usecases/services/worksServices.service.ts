import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import {
  FIND_SCHEDULE_BY_ID_REPOSITORY,
  IFindScheduleByIdRepository,
} from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import {
  IWorkServicesQueryRepository,
  WORK_SERVICES_QUERY_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import {
  IWorkServicesRepository,
  WORK_SERVICES_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesRepository';
import { hasLockedExecution } from 'src/domain/services/pointByPointRules.service';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  AddServicesDTO,
  ApplyAdditonalDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';
import { PROGRESS_EPSILON } from 'src/utils/pointByPoint/progress.utils';
import {
  FINALIZED_SCHEDULE_STATUSES,
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ProgressRecalculationService } from './progressRecalculation.service';

const TX_OPTIONS = { maxWait: 10000, timeout: 30000 };

export class WorksServicesService {
  private readonly logger = new Logger(WorksServicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressRecalculationService, // ALTERADO
    @Inject(WORK_SERVICES_REPOSITORY)
    private readonly workServicesRepository: IWorkServicesRepository,
    @Inject(WORK_SERVICES_QUERY_REPOSITORY)
    private readonly workServicesQueryRepository: IWorkServicesQueryRepository,
    @Inject(FIND_SCHEDULE_BY_ID_REPOSITORY)
    private readonly schedulesRepository: IFindScheduleByIdRepository,
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
  ) {}

  /**
   * Programa os itens numa programação existente.
   *
   * Quando é chamado a partir de outro caso de uso que já tem transação (ex.:
   * criação da programação), recebe o `tx` dela: a programação recém-criada só
   * é visível dentro dessa transação. Sem `tx`, abre a própria.
   */
  async scheduleServices(
    workId: number,
    data: ScheduleServicesDTO[],
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    if (!data || data.length === 0) {
      throw new BadRequestException('Programação não enviada.');
    }

    if (tx) {
      await this.scheduleServicesInTransaction(workId, data, tx);
      return;
    }

    await this.prisma.$transaction(
      (innerTx) => this.scheduleServicesInTransaction(workId, data, innerTx),
      TX_OPTIONS,
    );
  }

  // ALTERADO: a orquestração saiu do repositório
  async cancelServices(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const schedule = await this.workServicesRepository.findScheduleStatus(
        id,
        tx,
      );

      if (!schedule) {
        throw new NotFoundException(`Programação com ID ${id} não encontrada`);
      }

      const rows = await this.workServicesRepository.findScheduleItemsExecution(
        id,
        tx,
      );

      // Regra 2: o executado não pode ser perdido. Uma programação com execução
      // lançada (real preenchido, inclusive 0 = descartado) ou já finalizada
      // como executada/parcial só pode ser alterada desfazendo a finalização.
      if (hasLockedExecution(schedule.id_status_programacao, rows)) {
        throw new ConflictException(
          'Programação com execução lançada ou finalizada não pode ter os serviços cancelados. Desfaça a finalização antes.',
        );
      }

      await this.workServicesRepository.deleteScheduleItems(id, tx);
      await this.workServicesRepository.resetScheduleProgress(id, tx);

      await this.progress.recomputeAll(
        rows.map((row) => row.id_servico),
        schedule.id_obra,
        tx,
      );
    }, TX_OPTIONS);
  }

  async applyAdditional(
    workId: number,
    data: ApplyAdditonalDTO[],
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      try {
        await this.workServicesRepository.applyAdditional(data, tx);
        await this.progress.recomputeWorkProgress(workId, tx); // ALTERADO
      } catch (error) {
        this.logger.error(error);
        throw error;
      }
    }, TX_OPTIONS);
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
        `${type === 'service' ? item.id_contrato_servico : item.id_material}:${item.ponto}:${item.descricao_operacao}`,
        item,
      ]),
    );

    if (itemsMap.has(`${idService}:${point}:${operationDescription}`)) {
      throw new BadRequestException(
        `Esse ${type === 'service' ? 'serviço' : 'material'} já existe nesse ponto.`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      try {
        await this.workServicesRepository.addItem(data, type, tx);
        await this.progress.recomputeWorkProgress(idWork, tx); // ALTERADO
      } catch (error) {
        this.logger.error(error);
        throw error;
      }
    }, TX_OPTIONS);
  }

  async delete(id: number, workId: number) {
    if (!id) {
      throw new BadRequestException(
        'Nenhum serviço/material fornecida para exclusão.',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      try {
        await this.workServicesRepository.delete(id, tx);
        await this.progress.recomputeWorkProgress(workId, tx); // ALTERADO
      } catch (error) {
        this.logger.error(error);
        throw error;
      }
    }, TX_OPTIONS);
  }

  async deleteAll(workId: number) {
    await this.prisma.$transaction(async (tx) => {
      try {
        await this.workServicesRepository.deleteAll(workId, tx);
        await this.progress.recomputeWorkProgress(workId, tx); // ALTERADO
      } catch (error) {
        this.logger.error(error);
        throw error;
      }
    }, TX_OPTIONS);
  }

  private async scheduleServicesInTransaction(
    workId: number,
    data: ScheduleServicesDTO[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    this.validatePayload(data);

    const idSchedule = data[0].idSchedule;
    const schedule = await this.schedulesRepository.findById(idSchedule, tx);

    if (!schedule) {
      throw new NotFoundException(
        `Programação com ID ${idSchedule} não encontrada.`,
      );
    }

    if (schedule.id_obra !== workId) {
      throw new BadRequestException(
        'A programação informada não pertence a esta obra.',
      );
    }

    if (FINALIZED_SCHEDULE_STATUSES.includes(schedule.id_status_programacao)) {
      throw new ConflictException(
        'Programação já finalizada: não é possível programar novos serviços.',
      );
    }

    const realWorkId = schedule.id_obra;

    const history =
      await this.workServicesQueryRepository.getServiceScheduleHistory(
        realWorkId,
        tx,
      );

    await this.validateOwnershipAndBalance(realWorkId, data, history, tx);
    this.validateNotDuplicated(data, history);

    const newStatus =
      schedule.id_status_programacao === ScheduleStatus.PENDENTE_REVISAO
        ? ScheduleStatus.APROVADA
        : undefined;

    // ALTERADO: antes era workServicesRepository.scheduleServices(...)
    if (newStatus !== undefined) {
      await this.workServicesRepository.updateScheduleStatus(
        idSchedule,
        newStatus,
        tx,
      );
    }

    await this.workServicesRepository.createScheduleItems(idSchedule, data, tx);

    // O adicional informado na programação passa a valer para o serviço.
    await this.workServicesRepository.updateServicesAdditional(
      data
        .filter(
          ({ additional }) => additional !== undefined && additional !== null,
        )
        .map(({ id, additional }) => ({ id, additional })),
      tx,
    );

    // Fonte única dos totalizadores: qtde_prog/qtde_real dos serviços,
    // prog/exec de todas as programações e executado da obra.
    await this.progress.recomputeAll(
      data.map(({ id }) => id),
      realWorkId,
      tx,
    );
    // fim ALTERADO

    // Sair de "reprovada" reabre a programação, e a obra acompanha (mesmo
    // comportamento do PATCH de cabeçalho da programação).
    if (newStatus !== undefined) {
      await this.statusFlowRepository.updateStatusWorks(
        WorkStatus.PROGRAMADA,
        realWorkId,
        tx,
      );
    }
  }

  private validatePayload(data: ScheduleServicesDTO[]): void {
    const scheduleIds = new Set(data.map((item) => item.idSchedule));

    if (scheduleIds.size !== 1 || scheduleIds.has(undefined)) {
      throw new BadRequestException(
        'Todos os serviços devem pertencer à mesma programação.',
      );
    }

    for (const item of data) {
      if (!Number.isFinite(item.id) || !Number.isFinite(item.idTeam)) {
        throw new BadRequestException(
          'Serviço e equipe devem ser informados para cada item.',
        );
      }

      if (!Number.isFinite(item.prog) || item.prog < 0) {
        throw new BadRequestException(
          'A quantidade programada deve ser um número maior ou igual a zero.',
        );
      }
    }
  }

  /**
   * Garante, dentro da transação, que:
   * - todo item pertence à obra da programação;
   * - item descartado (real = 0) não volta a ser programado;
   * - a soma programada não ultrapassa o saldo do item
   *   (viabilizado + adicional - o que já está programado/executado).
   */
  private async validateOwnershipAndBalance(
    workId: number,
    data: ScheduleServicesDTO[],
    history: { id_servico: number; prog: number; real: number }[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const serviceIds = [...new Set(data.map((item) => item.id))];

    const services =
      await this.workServicesQueryRepository.findServicesForScheduling(
        serviceIds,
        tx,
      );
    const servicesById = new Map(
      services.map((service) => [service.id, service]),
    );

    const consumedByService = new Map<number, number>();
    for (const row of history) {
      consumedByService.set(
        row.id_servico,
        (consumedByService.get(row.id_servico) ?? 0) +
          (row.real ?? row.prog ?? 0),
      );
    }

    const requestedByService = new Map<number, number>();
    const additionalByService = new Map<number, number>();
    for (const item of data) {
      requestedByService.set(
        item.id,
        (requestedByService.get(item.id) ?? 0) + item.prog,
      );
      if (item.additional !== undefined && item.additional !== null) {
        additionalByService.set(item.id, item.additional);
      }
    }

    for (const serviceId of serviceIds) {
      const service = servicesById.get(serviceId);

      if (!service || service.id_obra !== workId) {
        throw new BadRequestException(
          `O item ${serviceId} não pertence a esta obra.`,
        );
      }

      const label = `${service.operacao ?? ''} ${service.ponto ?? ''}`.trim();

      // Regra 1: item com real = 0 foi descartado.
      if (service.qtde_real === 0) {
        throw new BadRequestException(
          `O item ${label || serviceId} foi descartado e não pode ser programado.`,
        );
      }

      if (service.viabilizado === null || service.viabilizado === undefined) {
        continue;
      }

      const total =
        service.viabilizado +
        (additionalByService.get(serviceId) ?? service.qtde_adicional ?? 0);
      const available = total - (consumedByService.get(serviceId) ?? 0);
      const requested = requestedByService.get(serviceId) ?? 0;

      if (requested > available + PROGRESS_EPSILON) {
        throw new BadRequestException(
          `Saldo insuficiente para o item ${label || serviceId}: disponível ${Number(
            Math.max(available, 0).toFixed(4),
          )}, solicitado ${Number(requested.toFixed(4))}.`,
        );
      }
    }
  }
  private validateNotDuplicated(
    data: ScheduleServicesDTO[],
    history: {
      id_programacao: number;
      id_servico: number;
      id_equipe: number;
    }[],
  ): void {
    // idSchedule + id_servico + id_equipe identifica unicamente o vínculo.
    const scheduledServices = new Set(
      history.map(
        (item) => `${item.id_programacao}-${item.id_servico}-${item.id_equipe}`,
      ),
    );

    const seen = new Set<string>();

    for (const service of data) {
      const key = `${service.idSchedule}-${service.id}-${service.idTeam}`;

      if (scheduledServices.has(key) || seen.has(key)) {
        throw new BadRequestException(
          'Esse serviço já foi programado, nessa programação atual!!',
        );
      }

      seen.add(key);
    }
  }
}
