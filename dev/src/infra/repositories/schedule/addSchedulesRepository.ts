import { Injectable } from '@nestjs/common';
import { IAddSchedulesRepository } from 'src/domain/repositories/schedule/IAddSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class AddSchedulesRepository implements IAddSchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async addSchedules(data: any): Promise<number> {
    const created = await this.prisma.programacoes.create({
      data,
      select: { id: true },
    });

    return created.id;
  }
}
