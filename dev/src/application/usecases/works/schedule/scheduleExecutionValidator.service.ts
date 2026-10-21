import { Inject, Injectable } from '@nestjs/common';

import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import { returnExecution } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { Prisma } from 'src/infra/generated/prisma/client';
import {
  isApproximately,
  isAtLeast,
} from 'src/utils/pointByPoint/progress.utils';
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
            {
              totalExecuted: newExecuted,
            },
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
   * Finalização do PONTO A PONTO: define o status da programação e da obra.
   * (O fluxo tradicional continua em `validateExecutionAndUpdateStatus`.)
   *
   * Programação (cada caso é exclusivo — antes, prog = exec = 0 passava por
   * "executada" e "reagendada" na mesma chamada):
   *  - exec = 0                  -> REAGENDADA
   *  - exec >= prog              -> EXECUTADA
   *  - 0 < exec < prog           -> PARCIAL
   *
   * Obra (regra 3: só conclui com execução >= total dos itens):
   *  - executado total >= 100%   -> CONCLUÍDA (com data de conclusão)
   *  - tudo programado ou feito  -> CONFIRMADA
   *  - demais casos              -> SERVIÇOS REAGENDADOS/PENDENTES
   *
   * Todas as comparações usam tolerância (PROGRESS_EPSILON): os percentuais
   * têm 4 casas e comparar com `===`/`<` contra 100 falha por arredondamento.
   */
  async validatePointByPointExecution(
    data: ScheduleExecutionValidatorInterface,
    totals: returnExecution,
    tx: Prisma.TransactionClient,
  ) {
    const exec = data.exec ?? 0;
    const newExecuted = Math.min((totals.exec ?? 0) + exec, 100);

    if (exec === 0) {
      await this.statusFlowRepository.updateScheduleStatus(
        ScheduleStatus.REAGENDADA,
        data.id,
        tx,
      );

      await this.statusFlowRepository.updateStatusWorks(
        WorkStatus.SERVICOS_REAGENDADOS,
        data.idWork,
        tx,
        { totalExecuted: newExecuted },
      );

      return;
    }

    if (!isAtLeast(exec, data.prog)) {
      await this.statusFlowRepository.updateScheduleStatus(
        ScheduleStatus.PARCIAL,
        data.id,
        tx,
      );

      await this.statusFlowRepository.updateStatusWorks(
        WorkStatus.SERVICOS_REAGENDADOS,
        data.idWork,
        tx,
        { totalExecuted: newExecuted },
      );

      return;
    }

    await this.statusFlowRepository.updateScheduleStatus(
      ScheduleStatus.EXECUTADA,
      data.id,
      tx,
    );

    if (isAtLeast(newExecuted, 100)) {
      await this.statusFlowRepository.updateStatusWorks(
        WorkStatus.CONCLUIDA,
        data.idWork,
        tx,
        { data_conclusao: data.dataProg, totalExecuted: newExecuted },
      );

      return;
    }

    // NOTA: regra herdada (`totals.prog + newExecuted === 100`), agora com
    // tolerância. `totals.prog` já inclui o programado das demais programações
    // que também foi/será executado, então a soma pode contar o executado em
    // dobro — confirmar com o negócio o significado exato de "tudo programado".
    const allScheduled = isApproximately(totals.prog + newExecuted, 100);

    await this.statusFlowRepository.updateStatusWorks(
      allScheduled ? WorkStatus.CONFIRMADA : WorkStatus.SERVICOS_REAGENDADOS,
      data.idWork,
      tx,
      { totalExecuted: newExecuted },
    );
  }
}
