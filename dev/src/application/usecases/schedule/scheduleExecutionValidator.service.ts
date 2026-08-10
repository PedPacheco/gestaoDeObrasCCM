import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import { returnExecution } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';

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

  private async processExecution(
    data: ScheduleExecutionValidatorInterface,
    currentExecuted: number,
    currentProg: number,
    tx: Prisma.TransactionClient,
  ) {
    const newExecuted = currentExecuted + (data.exec ?? 0);

    if (newExecuted > 100) {
      throw new BadRequestException(
        'O valor da execução da obra não pode ser superior a 100',
      );
    }

    if (data.prog <= data.exec) {
      await this.statusFlowRepository.updateScheduleStatus(4, data.id, tx);

      if (newExecuted < 100) {
        if (currentProg + newExecuted === 100) {
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
      }

      if (newExecuted === 100) {
        await this.statusFlowRepository.updateStatusWorks(2, data.idWork, tx, {
          data_conclusao: data.dataProg,
          totalExecuted: newExecuted,
        });
      }
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

  async validateExecutionAndUpdateStatus(
    data: ScheduleExecutionValidatorInterface,
    totalExecuted: number,
    tx: Prisma.TransactionClient,
  ) {
    return this.processExecution(data, totalExecuted, data.prog, tx);
  }

  async oldValidateExecutionAndUpdateStatus(
    data: ScheduleExecutionValidatorInterface,
    totalExecuted: returnExecution,
    tx: Prisma.TransactionClient,
  ) {
    return this.processExecution(
      data,
      totalExecuted.exec,
      totalExecuted.prog,
      tx,
    );
  }
}
