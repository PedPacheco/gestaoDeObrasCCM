import { Injectable, NotFoundException } from '@nestjs/common';
import { IDeleteSchedulesRepository } from 'src/domain/repositories/schedule/IDeleteSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class DeleteSchedulesRepository implements IDeleteSchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async delete(id: number): Promise<void> {
    try {
      await this.prisma.programacoes.delete({
        where: { id },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Programação com ID ${id} não encontrada`);
      }
      throw error;
    }
  }
}
