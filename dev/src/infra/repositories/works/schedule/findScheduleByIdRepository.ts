import { Injectable } from '@nestjs/common';
import { WorkScheduleMapper } from 'src/application/mappers/scheduleMapper';

import { IFindScheduleByIdRepository } from 'src/domain/contracts/works/schedule/IFindScheduleByIdRepository';
import { WorkSchedule } from 'src/domain/entities/schedules/workSchedule.entity';

import { Prisma } from 'src/infra/generated/prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { SCHEDULE_SNAPSHOT_SELECT } from 'src/infra/types/repositories/schedule/findScheduleById.types';

@Injectable()
export class FindScheduleByIdRepository implements IFindScheduleByIdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(
    scheduleId: number,
    tx?: Prisma.TransactionClient,
  ): Promise<WorkSchedule | null> {
    const client = tx ?? this.prisma;
    const row = await client.programacoes.findUnique({
      where: { id: scheduleId },
      select: SCHEDULE_SNAPSHOT_SELECT,
    });
    return row && WorkScheduleMapper.toConfirmation(row);
  }
}
