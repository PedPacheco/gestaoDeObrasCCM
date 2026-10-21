import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import {
  FIND_SCHEDULE_BY_ID_REPOSITORY,
  IFindScheduleByIdRepository,
} from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import {
  FinalizationData,
  IWorkServicesExecutionRepository,
  WORK_SERVICES_EXECUTION_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesExecutionRepository';
import {
  IWorkServicesQueryRepository,
  WORK_SERVICES_QUERY_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import {
  calculateAggregateProgress,
  calculateScheduleProgress,
  fromHistoryRow,
  planReschedule,
  ScheduleItem,
} from 'src/domain/services/pointByPointRules.service';
import { Prisma } from 'src/infra/generated/prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { PerformServicesDTO } from 'src/interface/dtos/workServicesDTO';
import { GetServicesByWorkIdResponse } from 'src/interface/types/servicesInterface';
import {
  FINALIZED_SCHEDULE_STATUSES,
  isMaterial,
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { ExecutionReportService } from '../executionReport.service';
import { ScheduleExecutionValidatorService } from '../works/schedule/scheduleExecutionValidator.service';
import { ProgressRecalculationService } from './progressRecalculation.service';

const EXECUTION_BATCH_SIZE = 50; // ALTERADO: veio do repositório
const FINALIZE_TX_OPTIONS = { maxWait: 10000, timeout: 30000 };

@Injectable()
export class FinalizeServicesService {
  private readonly logger = new Logger(FinalizeServicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressRecalculationService, // ALTERADO
    @Inject(WORK_SERVICES_EXECUTION_REPOSITORY)
    private readonly worksServicesExecutionRepository: IWorkServicesExecutionRepository,
    @Inject(WORK_SERVICES_QUERY_REPOSITORY)
    private readonly workServicesQueryRepository: IWorkServicesQueryRepository,
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
    @Inject(FIND_SCHEDULE_BY_ID_REPOSITORY)
    private readonly findScheduleByIdRepository: IFindScheduleByIdRepository,
    private readonly executionReportService: ExecutionReportService,
    private readonly executionValidator: ScheduleExecutionValidatorService,
    // REMOVIDOS: workServicesRepository e scheduleProgressCalculator
  ) {}

  async performServices(data: PerformServicesDTO[]): Promise<void> {
    if (data.length === 0) return;

    this.validatePerformPayload(data);

    await this.prisma.$transaction(
      (tx) => this.registerExecutions(data, tx), // ALTERADO
      FINALIZE_TX_OPTIONS,
    );
  }

  /**
   * Reagenda os itens pendentes de uma programação SEM perder o executado
   * (regras 1 e 2). A programação fica PARCIAL se mantiver execução; caso
   * contrário, fica REAGENDADA.
   */
  async reascheduleServices(workId: number, scheduleId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      try {
        // ALTERADO: a orquestração saiu do repositório
        const schedule =
          await this.worksServicesExecutionRepository.findScheduleWork(
            scheduleId,
            tx,
          );

        if (!schedule) {
          throw new NotFoundException(
            `Programação ${scheduleId} não encontrada.`,
          );
        }

        if (schedule.id_obra !== workId) {
          throw new BadRequestException(
            'A programação informada não pertence a esta obra.',
          );
        }

        const rows =
          await this.worksServicesExecutionRepository.findScheduleItems(
            scheduleId,
            tx,
          );
        const plan = planReschedule(rows);

        if (!plan.hasPendingItems) {
          throw new BadRequestException(
            'Não há itens pendentes para reagendar nesta programação.',
          );
        }

        if (plan.releasedRowIds.length > 0) {
          await this.worksServicesExecutionRepository.deleteScheduleItemsByIds(
            plan.releasedRowIds,
            tx,
          );
        }

        // Sem nenhuma linha restante, a programação não aparece no recálculo.
        if (plan.emptiesSchedule) {
          await this.worksServicesExecutionRepository.zeroScheduleProgress(
            scheduleId,
            tx,
          );
        }

        await this.progress.recomputeAll(
          plan.affectedServiceIds,
          schedule.id_obra,
          tx,
        );
        // fim ALTERADO

        await this.statusFlowRepository.updateScheduleStatus(
          plan.hasExecution
            ? ScheduleStatus.PARCIAL
            : ScheduleStatus.REAGENDADA,
          scheduleId,
          tx,
        );

        await this.statusFlowRepository.updateStatusWorks(
          WorkStatus.SERVICOS_REAGENDADOS,
          workId,
          tx,
        );
      } catch (error: any) {
        this.logger.error(error);
        throw error;
      }
    }, FINALIZE_TX_OPTIONS);
  }

  /**
   * Finaliza a programação numa ÚNICA transação: executado dos itens (quando
   * vem em `executions`), relatório de execução, estado e recálculo de todas
   * as programações da obra. Se algum passo falhar, nada é gravado.
   */
  async finalizeServices(
    workId: number,
    data: any,
    files?: Express.Multer.File[],
  ): Promise<void> {
    const { executionReportData, executions, userId, ...updateData } = data;

    await this.prisma.$transaction(async (tx) => {
      try {
        if (executions?.length) {
          await this.registerExecutions(executions, tx); // ALTERADO
        }

        await this.assertScheduleCanBeFinalized(updateData.idSchedule, tx);

        // Lidos DEPOIS de o executado ser gravado, dentro da transação.
        const [services, history] = await Promise.all([
          this.workServicesQueryRepository.getAllServicesOfWork(workId, tx),
          this.workServicesQueryRepository.getServiceScheduleHistory(
            workId,
            tx,
          ),
        ]);

        const totalPlanned = this.sumServiceQuantities(services);
        const scheduleItems = history.map(fromHistoryRow); // ALTERADO

        const scheduleTotals = calculateScheduleProgress(
          // ALTERADO
          scheduleItems,
          totalPlanned,
          updateData.idSchedule,
        );

        const dateProg = history.find(
          (item) => item.id_programacao === updateData.idSchedule,
        );

        if (!dateProg) {
          throw new NotFoundException(
            `Nenhum histórico encontrado para a programação ${updateData.idSchedule} nesta obra.`,
          );
        }

        const finalizationData = this.buildFinalizationData(
          updateData.idSchedule,
          workId,
          dateProg.programacoes.data_prog,
          scheduleTotals,
          updateData.idExecutionRestriction,
          updateData.responsibility,
          updateData.executionObservation,
          userId,
        );

        await this.executeFinalization(
          workId,
          finalizationData,
          executionReportData,
          totalPlanned,
          scheduleItems, // ALTERADO
          tx,
          files,
        );
      } catch (error) {
        this.logger.error(error);
        throw error;
      }
    }, FINALIZE_TX_OPTIONS);
  }

  // ─── Privados ───────────────────────────────────────────────────────

  /**
   * ALTERADO: veio do repositório. Grava o realizado em lotes e recalcula os
   * totalizadores dos serviços pela fonte única.
   */
  private async registerExecutions(
    data: PerformServicesDTO[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    for (let i = 0; i < data.length; i += EXECUTION_BATCH_SIZE) {
      const batch = data.slice(i, i + EXECUTION_BATCH_SIZE);

      // 1. Resolve a linha exata (serviço + programação) de cada item e
      //    valida que a programação ainda aceita execução.
      const resolved = await Promise.all(
        batch.map(async ({ id, idSchedule, qtdeRealizada }) => {
          const rows =
            await this.worksServicesExecutionRepository.findExecutionTargets(
              id,
              idSchedule,
              tx,
            );

          if (rows.length === 0) {
            throw new BadRequestException(
              `O item ${id} não está programado na programação ${idSchedule}.`,
            );
          }

          if (rows.length > 1) {
            throw new BadRequestException(
              `O item ${id} está programado para mais de uma equipe na programação ${idSchedule}: informe a equipe (idTeam).`,
            );
          }

          if (
            FINALIZED_SCHEDULE_STATUSES.includes(
              rows[0].programacoes.id_status_programacao,
            )
          ) {
            throw new ConflictException(
              `A programação ${idSchedule} já foi finalizada. Desfaça a finalização para alterar o executado.`,
            );
          }

          return { rowId: rows[0].id, serviceId: id, real: qtdeRealizada };
        }),
      );

      // 2. Grava o realizado.
      await this.worksServicesExecutionRepository.updateItemsReal(resolved, tx);

      // 3. Recalcula os totalizadores pela fonte única.
      await this.progress.recomputeServiceTotals(
        resolved.map(({ serviceId }) => serviceId),
        tx,
      );
    }
  }

  private async assertScheduleCanBeFinalized(
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const schedule = await this.findScheduleByIdRepository.findById(
      scheduleId,
      tx,
    );

    if (!schedule) {
      throw new NotFoundException(`Programação ${scheduleId} não encontrada.`);
    }

    if (FINALIZED_SCHEDULE_STATUSES.includes(schedule.id_status_programacao)) {
      throw new ConflictException(
        'Programação já finalizada. Desfaça a finalização para finalizar novamente.',
      );
    }
  }

  // ALTERADO: as regras 1 e 4 vivem no domínio; aqui fica só o mapeamento.
  private sumServiceQuantities(
    services: GetServicesByWorkIdResponse[],
  ): number {
    return services
      .filter((service) => service.qtde_real !== 0 && !isMaterial(service))
      .reduce(
        (sum, service) =>
          sum + (service.viabilizado ?? 0) + (service.qtde_adicional ?? 0),
        0,
      );
  }

  private buildFinalizationData(
    scheduleId: number,
    workId: number,
    scheduleDate: Date,
    scheduleTotals: { prog: number; exec: number },
    idExecutionRestriction: number,
    responsibility: string,
    executionObservation: string,
    userId: number,
  ): FinalizationData {
    return {
      id: scheduleId,
      idWork: workId,
      dataProg: scheduleDate,
      prog: scheduleTotals.prog,
      exec: scheduleTotals.exec,
      idExecutionRestriction,
      responsibility,
      executionObservation,
      userId,
    };
  }

  private async executeFinalization(
    workId: number,
    finalizationData: FinalizationData,
    executionReportData: any,
    totalPlanned: number,
    scheduleItems: ScheduleItem[], // ALTERADO
    tx: Prisma.TransactionClient,
    files?: Express.Multer.File[],
  ): Promise<void> {
    // Total já executado nas DEMAIS programações (agregado, limitado a 100),
    // para validar a finalização da atual.
    const executed = calculateAggregateProgress(
      scheduleItems,
      totalPlanned,
      finalizationData.id,
    ); // ALTERADO

    // O relatório é opcional: sem `executionReport` no payload não há nada a criar.
    if (executionReportData && Object.keys(executionReportData).length > 0) {
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

    await this.executionValidator.validatePointByPointExecution(
      finalizationData,
      executed,
      tx,
    );

    // ALTERADO: a NotFoundException saiu do repositório.
    const updated =
      await this.worksServicesExecutionRepository.finalizeServices(
        finalizationData,
        tx,
      );
    if (!updated) {
      throw new NotFoundException(
        `Agendamento com ID ${finalizationData.id} não encontrado`,
      );
    }

    // Fonte única: recalcula prog/exec de TODAS as programações e o executado da obra.
    await this.progress.recomputeWorkProgress(workId, tx); // ALTERADO
  }

  private validatePerformPayload(data: PerformServicesDTO[]): void {
    if (!Array.isArray(data)) {
      throw new BadRequestException('Lista de serviços realizados inválida.');
    }

    const seen = new Set<string>();

    for (const item of data) {
      if (!Number.isFinite(item?.id) || !Number.isFinite(item?.idSchedule)) {
        throw new BadRequestException(
          'Serviço e programação devem ser informados.',
        );
      }

      // real = 0 é válido: significa item DESCARTADO (regra 1).
      if (!Number.isFinite(item.qtdeRealizada) || item.qtdeRealizada < 0) {
        throw new BadRequestException(
          'A quantidade realizada deve ser um número maior ou igual a zero.',
        );
      }

      const key = `${item.idSchedule}-${item.id}`;

      if (seen.has(key)) {
        throw new BadRequestException(
          `O item ${item.id} foi enviado mais de uma vez na programação ${item.idSchedule}.`,
        );
      }

      seen.add(key);
    }
  }
}
