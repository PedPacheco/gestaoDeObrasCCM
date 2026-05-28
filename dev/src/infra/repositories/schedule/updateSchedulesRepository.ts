import {
  IUpdateSchedulesRepository,
  returnExecution,
} from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
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
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Agendamento com ID ${id} não encontrado`);
      }

      throw error;
    }
  }

  async findExecutionOfSchedules(
    id: number,
    idWork: number,
  ): Promise<returnExecution[]> {
    try {
      const executed = await this.prisma.programacoes.findMany({
        where: {
          id_obra: idWork,
          id: {
            not: id,
          },
        },
        select: { exec: true, prog: true },
      });

      return executed.map((p) => ({ exec: p.exec, prog: p.prog }));
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Agendamento com ID ${id} não encontrado`);
      }
      throw error;
    }
  }
}
