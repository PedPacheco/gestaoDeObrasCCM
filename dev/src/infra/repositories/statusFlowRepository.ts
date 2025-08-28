import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IStatusFlowRepository } from 'src/domain/repositories/IStatusFlowRepository';

@Injectable()
export class StatusFlowRepository implements IStatusFlowRepository {
  constructor() {}

  async updateScheduleStatus(
    idStatus: number,
    id: number,
    tx: Prisma.TransactionClient,
  ) {
    await tx.programacoes.update({
      where: { id },
      data: { id_status_programacao: idStatus },
    });
  }

  async updateStatusWorks(
    idStatus: number,
    id: number,
    tx: Prisma.TransactionClient,
    data_conclusao: Date,
  ): Promise<void> {
    await tx.obras.update({
      where: { id },
      data: {
        id_status: idStatus,
        ...(data_conclusao !== undefined && { data_conclusao }),
      },
    });
  }
}
