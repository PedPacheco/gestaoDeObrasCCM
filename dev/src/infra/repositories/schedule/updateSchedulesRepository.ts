import {
  IUpdateSchedulesRepository,
  returnExecution,
} from 'src/domain/contracts/schedule/IUpdateSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class UpdateSchedulesRepository implements IUpdateSchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async update(data: any, tx: Prisma.TransactionClient): Promise<void> {
    const { id, ...updateData } = data;

    await tx.programacoes.update({
      where: { id },
      data: updateData,
    });
  }

  async findExecutionOfSchedules(
    id: number,
    idWork: number,
  ): Promise<returnExecution[]> {
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
  }
}
