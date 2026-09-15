import { IUpdateWorkRepository } from 'src/domain/repositories/works/IUpdateWorkRepository';
import { UpdateWorkDTO } from 'src/interface/dtos/worksDto';

import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class UpdateWorkRepository implements IUpdateWorkRepository {
  private readonly logger = new Logger(UpdateWorkRepository.name);
  constructor() {}

  async update(
    data: UpdateWorkDTO,
    id: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const { id_status, id_turma, data_empreitamento, observ_obra } = data;
    try {
      await tx.obras.update({
        where: { id },
        data: {
          id_status,
          id_turma,
          data_empreitamento,
          observ_obra,
        },
      });
    } catch (error: any) {
      this.logger.error('Erro ao editar obra: ', error.stack);
      throw error;
    }
  }
}
