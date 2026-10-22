import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import { returnExecution } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { WorkExecutionTotals } from 'src/domain/services/pointByPointRules.service';
import { isAtLeast } from 'src/utils/pointByPoint/progress.utils';
import {
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';

interface ScheduleExecutionValidatorInterface {
  id: number;
  idWork: number;
  dataProg: Date;
  prog: number;
  exec?: number;
}

@Injectable()
export class ScheduleExecutionValidatorService {
  constructor(
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
  ) {}

  /** Fluxo TRADICIONAL (sem alterações). */
  async validateExecutionAndUpdateStatus(
    data: ScheduleExecutionValidatorInterface,
    totals: returnExecution,
    tx: Prisma.TransactionClient,
  ) {
    const newExecuted = Math.min((totals.exec ?? 0) + data.exec, 100);

    if (data.prog <= data.exec) {
      await this.statusFlowRepository.updateScheduleStatus(4, data.id, tx);

      if (newExecuted < 100) {
        if (totals.prog + newExecuted === 100) {
          await this.statusFlowRepository.updateStatusWorks(
            35,
            data.idWork,
            tx,
            { totalExecuted: newExecuted },
          );
          return;
        }

        await this.statusFlowRepository.updateStatusWorks(36, data.idWork, tx, {
          totalExecuted: newExecuted,
        });
        return;
      }

      await this.statusFlowRepository.updateStatusWorks(2, data.idWork, tx, {
        data_conclusao: data.dataProg,
        totalExecuted: newExecuted,
      });
    }

    if (data.exec === 0) {
      await this.statusFlowRepository.updateScheduleStatus(5, data.id, tx);
      await this.statusFlowRepository.updateStatusWorks(36, data.idWork, tx);
    }

    if (data.exec > 0 && data.prog > data.exec) {
      await this.statusFlowRepository.updateScheduleStatus(6, data.id, tx);
      await this.statusFlowRepository.updateStatusWorks(36, data.idWork, tx, {
        totalExecuted: newExecuted,
      });
    }
  }

  /**
   * Finalização do PONTO A PONTO.
   *
   * Programação: o estado vem das linhas (resolveScheduleOutcome):
   * - sem execução                       -> REAGENDADA
   * - com execução e itens a reprogramar -> PARCIAL
   * - tudo executado                     -> EXECUTADA
   *
   * Obra (regra 3):
   * - executado >= 100%                  -> CONCLUÍDA (com data de conclusão)
   * - executado + reservado >= 100%      -> CONFIRMADA
   * - restantes casos                    -> SERVIÇOS REAGENDADOS
   */
  async validatePointByPointExecution(
    data: ScheduleExecutionValidatorInterface,
    outcome: number,
    work: WorkExecutionTotals,
    tx: Prisma.TransactionClient,
  ) {
    await this.statusFlowRepository.updateScheduleStatus(outcome, data.id, tx);

    // REAGENDADA ou PARCIAL: há itens a reprogramar.
    if (outcome !== ScheduleStatus.EXECUTADA) {
      await this.statusFlowRepository.updateStatusWorks(
        WorkStatus.SERVICOS_REAGENDADOS,
        data.idWork,
        tx,
        { totalExecuted: work.executed },
      );
      return;
    }

    if (isAtLeast(work.executed, 100)) {
      await this.statusFlowRepository.updateStatusWorks(
        WorkStatus.CONCLUIDA,
        data.idWork,
        tx,
        { data_conclusao: data.dataProg, totalExecuted: work.executed },
      );
      return;
    }

    await this.statusFlowRepository.updateStatusWorks(
      isAtLeast(work.coverage, 100)
        ? WorkStatus.CONFIRMADA
        : WorkStatus.SERVICOS_REAGENDADOS,
      data.idWork,
      tx,
      { totalExecuted: work.executed },
    );
  }
}
