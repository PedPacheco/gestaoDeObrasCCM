import { Injectable } from '@nestjs/common';
import { Prisma, programacoes } from '@prisma/client';
import { IFindScheduleByIdRepository } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
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
