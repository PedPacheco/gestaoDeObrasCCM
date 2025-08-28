import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';

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
    totalExecuted: number,
    tx: Prisma.TransactionClient,
  ) {
    if (totalExecuted + data.exec > 100) {
      throw new BadRequestException(
        'O valor da execução da obra não pode ser superior a 100',
      );
    }

    if (data.prog === data.exec) {
      await this.statusFlowRepository.updateScheduleStatus(4, data.id, tx);
      if (totalExecuted + data.exec < 100) {
        await this.statusFlowRepository.updateStatusWorks(37, data.idWork, tx);
      }

      if (totalExecuted + data.exec === 100) {
        await this.statusFlowRepository.updateStatusWorks(
          2,
          data.idWork,
          tx,
          data.dataProg,
        );
      }
    }

    if (data.exec === 0) {
      await this.statusFlowRepository.updateScheduleStatus(5, data.id, tx);
      await this.statusFlowRepository.updateStatusWorks(36, data.idWork, tx);
    }

    if (data.exec > 0 && data.prog > data.exec) {
      await this.statusFlowRepository.updateScheduleStatus(6, data.id, tx);
      await this.statusFlowRepository.updateStatusWorks(36, data.idWork, tx);
    }
  }
}
