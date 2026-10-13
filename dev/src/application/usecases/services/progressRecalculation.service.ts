import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  IWorkServicesRepository,
  WORK_SERVICES_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesRepository';
import {
  calculateServiceTotals,
  calculateWorkProgress,
  WorkProgress,
} from 'src/domain/services/pointByPointRules.service';

export type WorkProgressResult = Omit<WorkProgress, 'demoteConclusion'>;

/**
 * Fonte ÚNICA dos totalizadores do ponto a ponto. Todo fluxo que altera
 * programacoes_servicos/servicos tem de terminar aqui, na mesma transação.
 */
@Injectable()
export class ProgressRecalculationService {
  constructor(
    @Inject(WORK_SERVICES_REPOSITORY)
    private readonly repository: IWorkServicesRepository,
  ) {}

  async recomputeServiceTotals(
    serviceIds: number[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const ids = [...new Set(serviceIds)];
    if (ids.length === 0) return;
    const items = await this.repository.findScheduleItemsByServiceIds(ids, tx);
    await this.repository.updateServiceTotals(
      calculateServiceTotals(ids, items),
      tx,
    );
  }

  async recomputeWorkProgress(
    workId: number,
    tx: Prisma.TransactionClient,
  ): Promise<WorkProgressResult> {
    const [workItems, scheduleItems, workStatus] = await Promise.all([
      this.repository.findWorkItems(workId, tx),
      this.repository.findScheduleItemsByWork(workId, tx),
      this.repository.findWorkStatus(workId, tx),
    ]);

    const { demoteConclusion, ...result } = calculateWorkProgress(
      workItems,
      scheduleItems,
      workStatus,
    );

    await this.repository.updateSchedulesProgress(result.schedulesProgress, tx);
    await this.repository.updateWorkProgress(
      workId,
      result.workProgress,
      demoteConclusion,
      tx,
    );
    return result;
  }

  /** Ordem obrigatória: o totalPlanned depende de servicos.qtde_real. */
  async recomputeAll(
    serviceIds: number[],
    workId: number,
    tx: Prisma.TransactionClient,
  ) {
    await this.recomputeServiceTotals(serviceIds, tx);
    return this.recomputeWorkProgress(workId, tx);
  }
}
