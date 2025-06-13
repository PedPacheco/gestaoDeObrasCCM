import { Injectable } from '@nestjs/common';
import { IAddSchedulesRepository } from 'src/domain/repositories/schedule/IAddSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class AddSchedulesRepository implements IAddSchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async addSchedules(data: any): Promise<void> {
    try {
      await this.prisma.programacoes.create({
        data,
      });
    } catch (error: any) {
      console.error('Erro ao inserir programacões:', error);
    }
  }
}
