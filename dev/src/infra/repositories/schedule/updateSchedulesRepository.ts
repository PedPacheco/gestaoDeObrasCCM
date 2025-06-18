import { Injectable, NotFoundException } from '@nestjs/common';
import { IUpdateSchedulesRepository } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class UpdateSchedulesRepository implements IUpdateSchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async update(data: any): Promise<void> {
    const { id, ...updateData } = data;
    try {
      await this.prisma.programacoes.update({
        where: { id },
        data: updateData,
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Agendamento com ID ${id} não encontrado`);
      }
    }
  }
}
