import { Injectable } from '@nestjs/common';

import { IFindScheduleByIdRepository } from 'src/domain/contracts/works/schedule/IFindScheduleByIdRepository';
import { ScheduleState } from 'src/domain/types';

import { Prisma } from 'src/infra/generated/prisma/client';
import { toScheduleSnapshot } from 'src/infra/mappers/schedule/findById.mapper';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { SCHEDULE_SNAPSHOT_SELECT } from 'src/infra/types/repositories/schedule/findScheduleById.types';

@Injectable()
export class FindScheduleByIdRepository implements IFindScheduleByIdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    scheduleId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<ScheduleState | null> {
    const client = tx ?? this.prisma;
    const row = await client.programacoes.findUnique({
      where: { id: scheduleId },
      select: SCHEDULE_SNAPSHOT_SELECT,
    });
    return row && toScheduleSnapshot(row);
  }
}
