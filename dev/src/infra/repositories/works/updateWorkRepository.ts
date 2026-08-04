import { IUpdateWorkRepository } from 'src/domain/contracts/works/IUpdateWorkRepository';
import { UpdateWorkDTO } from 'src/interface/dtos/worksDto';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class UpdateWorkRepository implements IUpdateWorkRepository {
  constructor() {}

  async update(
    data: UpdateWorkDTO,
    id: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const { id_status, id_turma, data_empreitamento, observ_obra } = data;

    await tx.obras.update({
      where: { id },
      data: {
        id_status,
        id_turma,
        data_empreitamento,
        observ_obra,
      },
    });
  }
}
