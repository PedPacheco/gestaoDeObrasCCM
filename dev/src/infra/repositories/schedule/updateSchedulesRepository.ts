import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IUpdateSchedulesRepository } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';

@Injectable()
export class UpdateSchedulesRepository implements IUpdateSchedulesRepository {
  constructor() {}

  async update(data: any, tx: Prisma.TransactionClient): Promise<void> {
    const { id, ...updateData } = data;

    try {
      await tx.programacoes.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Agendamento com ID ${id} não encontrado`);
      }
    }
  }
}
