import { Injectable } from '@nestjs/common';
import { programacoes } from '@prisma/client';
import { IFindScheduleByIdRepository } from 'src/domain/contracts/schedule/IFindScheduleByIdRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class FindScheduleByIdRepository implements IFindScheduleByIdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<programacoes> {
    return await this.prisma.programacoes.findFirst({
      where: { id },
    });
  }
}
