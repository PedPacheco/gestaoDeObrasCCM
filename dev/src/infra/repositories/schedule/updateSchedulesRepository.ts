import { IUpdateSchedulesRepository } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class UpdateSchedulesRepository implements IUpdateSchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

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

  async findExecutionOfSchedules(
    id: number,
    idWork: number,
  ): Promise<number[]> {
    try {
      const executed = await this.prisma.programacoes.findMany({
        where: {
          id_obra: idWork,
          id: {
            not: id,
          },
        },
        select: { exec: true },
      });

      return executed.map((p) => p.exec);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Agendamento com ID ${id} não encontrado`);
      }
    }
  }
}
