import { BadRequestException, Injectable } from '@nestjs/common';
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
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Programação não excluída: Relatório vinculado a essa programação',
        );
      }
    }
  }
}
