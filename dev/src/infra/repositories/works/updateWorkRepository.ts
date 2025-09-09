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
    try {
      await tx.obras.update({
        where: { id },
        data,
      });
    } catch (error) {
      this.logger.error('Erro ao editar obra: ', error.stack);
      throw error;
    }
  }
}
