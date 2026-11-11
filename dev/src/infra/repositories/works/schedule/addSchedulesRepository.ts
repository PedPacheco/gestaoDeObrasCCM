import { IAddSchedulesRepository } from 'src/domain/contracts/works/schedule/IAddSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Injectable } from '@nestjs/common';

@Injectable()
export class AddSchedulesRepository implements IAddSchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async addSchedules(data: any): Promise<number> {
    try {
      const created = await this.prisma.programacoes.create({
        data,
        select: { id: true },
      });

      return created.id;
    } catch (error: any) {
      console.error('Erro ao inserir programacões:', error);
    }
  }
}
