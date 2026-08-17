import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/contracts/IStatusFlowRepository';
import { returnExecution } from 'src/domain/contracts/schedule/IUpdateSchedulesRepository';

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
}
