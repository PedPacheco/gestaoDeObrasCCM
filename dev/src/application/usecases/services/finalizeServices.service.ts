import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
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
  calculateScheduleProgress,
  calculateTotalPlanned,
  calculateWorkExecutionTotals,
  fromHistoryRow,
  planReschedule,
  ReschedulePlan,
  resolveScheduleOutcome,
  WorkExecutionTotals,
  WorkItem,
} from 'src/domain/services/pointByPointRules.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { PerformServicesDTO } from 'src/interface/dtos/workServicesDTO';
import { GetServicesByWorkIdResponse } from 'src/interface/types/servicesInterface';
import {
  FINALIZED_SCHEDULE_STATUSES,
  isMaterial,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';
import { ExecutionReportService } from '../executionReport.service';
import { ScheduleExecutionValidatorService } from '../works/schedule/scheduleExecutionValidator.service';
import { ProgressRecalculationService } from './progressRecalculation.service';

const EXECUTION_BATCH_SIZE = 50;
const FINALIZE_TX_OPTIONS = { maxWait: 10000, timeout: 30000 };

@Injectable()
export class FinalizeServicesService {
  private readonly logger = new Logger(FinalizeServicesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly progress: ProgressRecalculationService,
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
  ) {}

  async performServices(data: PerformServicesDTO[]): Promise<void> {
    if (data.length === 0) return;

    this.validatePerformPayload(data);

    await this.prisma.$transaction(
      (tx) => this.registerExecutions(data, tx),
      FINALIZE_TX_OPTIONS,
    );
  }

  /**
   * Reagenda os itens de uma programação SEM perder o executado (regras 1 e 2).
   * Linhas sem apontamento e parciais passam a REPROGRAMADO (prog/real intactos).
   * A programação fica PARCIAL se mantiver execução; caso contrário, REAGENDADA.
   */
  async reascheduleServices(workId: number, scheduleId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      try {
        const schedule = await this.findScheduleByIdRepository.findById(
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

        if (
          FINALIZED_SCHEDULE_STATUSES.includes(schedule.id_status_programacao)
        ) {
          throw new ConflictException('Esta programação já foi encerrada.');
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

        await this.applyReschedulePlan(plan, tx);

        await this.progress.recomputeAll(
          plan.affectedServiceIds,
          schedule.id_obra,
          tx,
        );

        await this.statusFlowRepository.updateScheduleStatus(
          resolveScheduleOutcome(plan), // PARCIAL ou REAGENDADA
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
   * vem em `executions`), encerramento das linhas, relatório de execução,
   * estado e recálculo. Se algum passo falhar, nada é gravado.
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
          this.validatePerformPayload(executions);
          await this.registerExecutions(executions, tx);
        }

        await this.assertScheduleCanBeFinalized(updateData.idSchedule, tx);

        // Linhas sem apontamento e parciais passam a REPROGRAMADO;
        // o estado da programação vem das linhas.
        const rows =
          await this.worksServicesExecutionRepository.findScheduleItems(
            updateData.idSchedule,
            tx,
          );
        const plan = planReschedule(rows);
        await this.applyReschedulePlan(plan, tx);
        const outcome = resolveScheduleOutcome(plan);

        // Lidos DEPOIS de marcar as linhas, dentro da transação.
        const [services, history] = await Promise.all([
          this.workServicesQueryRepository.getAllServicesOfWork(workId, tx),
          this.workServicesQueryRepository.getServiceScheduleHistory(
            workId,
            tx,
          ),
        ]);

        const scheduleItems = history.map(fromHistoryRow);

        const totalPlanned = calculateTotalPlanned(
          services.map(this.toWorkItem),
          scheduleItems,
        );

        const scheduleTotals = calculateScheduleProgress(
          scheduleItems,
          totalPlanned,
          updateData.idSchedule,
        );
        const workTotals = calculateWorkExecutionTotals(
          scheduleItems,
          totalPlanned,
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
          outcome,
          workTotals,
          plan.affectedServiceIds,
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

  /** Marca as linhas do plano como REPROGRAMADO (sem mexer em prog/real). */
  private async applyReschedulePlan(
    plan: ReschedulePlan,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (plan.releasedRowIds.length === 0) return;

    const updated =
      await this.worksServicesExecutionRepository.markScheduleItemsAsRescheduled(
        plan.releasedRowIds,
        tx,
      );

    // Outro pedido alterou as linhas entretanto → aborta a transação
    if (updated !== plan.releasedRowIds.length) {
      throw new ConflictException(
        'Alguns itens foram alterados entretanto. Atualize a programação e tente novamente.',
      );
    }
  }

  /**
   * Grava o realizado em lotes (e o status correspondente) e recalcula os
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

          return {
            rowId: rows[0].id,
            serviceId: id,
            real: qtdeRealizada ?? null, // null → REPROGRAMADO
          };
        }),
      );

      // 2. Grava o realizado e o status.
      await this.worksServicesExecutionRepository.updateItemsExecution(
        resolved,
        tx,
      );

      // 3. Recalcula os totalizadores pela fonte única.
      await this.progress.recomputeServiceTotals(
        [...new Set(resolved.map(({ serviceId }) => serviceId))],
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

  private toWorkItem(service: GetServicesByWorkIdResponse): WorkItem {
    return {
      serviceId: service.id,
      isMaterial: isMaterial(service),
      enabledQuantity: service.viabilizado ?? null,
      additionalQuantity: service.qtde_adicional ?? null,
      realQuantity: service.qtde_real ?? null,
    };
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
    outcome: number,
    workTotals: WorkExecutionTotals,
    affectedServiceIds: number[],
    tx: Prisma.TransactionClient,
    files?: Express.Multer.File[],
  ): Promise<void> {
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
      outcome,
      workTotals,
      tx,
    );

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

    // Fonte única: totalizadores dos serviços afetados pelo encerramento,
    // prog/exec de todas as programações e executado da obra.
    await this.progress.recomputeAll(affectedServiceIds, workId, tx);
  }

  /**
   * qtdeRealizada:
   * - null → não executado (REPROGRAMADO)
   * - 0    → DESCARTADO (regra 1)
   * - > 0  → executado (total ou parcial)
   */
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

      const real = item.qtdeRealizada;

      if (
        real !== null &&
        (typeof real !== 'number' || !Number.isFinite(real) || real < 0)
      ) {
        throw new BadRequestException(
          'A quantidade realizada deve ser vazia (para reprogramar) ou um número maior ou igual a zero.',
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
