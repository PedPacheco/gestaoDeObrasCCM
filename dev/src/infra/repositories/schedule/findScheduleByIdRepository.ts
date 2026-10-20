import { Injectable } from '@nestjs/common';

import { IFindScheduleByIdRepository } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { Prisma, programacoes } from 'src/generated/prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class FindScheduleByIdRepository implements IFindScheduleByIdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<programacoes> {
    const client = tx ?? this.prisma;

    return await client.programacoes.findFirst({
      where: { id },
    });
  }
}
