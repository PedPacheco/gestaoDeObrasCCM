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
import {
  findSchedulingViolation,
  hasLockedExecution,
  isRescheduled,
  SchedulingViolation,
} from 'src/domain/services/pointByPointRules.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  AddServicesDTO,
  ApplyAdditonalDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';
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

import { Prisma } from 'src/infra/generated/prisma/client';
import { ProgressRecalculationService } from './progressRecalculation.service';

const TX_OPTIONS = { maxWait: 10000, timeout: 30000 };

type ScheduleHistoryRow = {
  id_programacao: number;
  id_servico: number;
  id_equipe: number;
  prog: number | null;
  real: number | null;
  status: string | null;
};

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
    history: ScheduleHistoryRow[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const serviceIds = [...new Set(data.map((item) => item.id))];

    const services =
      await this.workServicesQueryRepository.findServicesForScheduling(
        serviceIds,
        tx,
      );

    const violation = findSchedulingViolation(workId, data, services, history);

    if (violation) {
      throw new BadRequestException(this.toViolationMessage(violation));
    }
  }

  /** As mensagens são iguais às que existiam antes. */
  private toViolationMessage(violation: SchedulingViolation): string {
    switch (violation.type) {
      case 'not_owned':
        return `O item ${violation.serviceId} não pertence a esta obra.`;
      case 'discarded':
        return `O item ${violation.label} foi descartado e não pode ser programado.`;
      case 'insufficient_balance':
        return `Saldo insuficiente para o item ${violation.label}: disponível ${Number(
          Math.max(violation.available, 0).toFixed(4),
        )}, solicitado ${Number(violation.requested.toFixed(4))}.`;
    }
  }

  /**
   * idSchedule + id_servico + id_equipe identifica o vínculo ATIVO.
   * Linhas REPROGRAMADO são só histórico e não impedem programar de novo.
   */
  private validateNotDuplicated(
    data: ScheduleServicesDTO[],
    history: ScheduleHistoryRow[],
  ): void {
    const scheduledServices = new Set(
      history
        .filter((item) => !isRescheduled(item))
        .map(
          (item) =>
            `${item.id_programacao}-${item.id_servico}-${item.id_equipe}`,
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
