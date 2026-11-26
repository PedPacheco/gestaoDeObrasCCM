import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { IDeleteSchedulesRepository } from 'src/domain/contracts/works/schedule/IDeleteSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

const PRISMA_FK_VIOLATION = 'P2003';
const PRISMA_RECORD_NOT_FOUND = 'P2025';

@Injectable()
export class DeleteSchedulesRepository implements IDeleteSchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async delete(id: number): Promise<void> {
    try {
      await this.prisma.programacoes.delete({ where: { id } });
    } catch (error: unknown) {
      const code = (error as { code?: string } | null)?.code;

      if (code === PRISMA_FK_VIOLATION) {
        throw new BadRequestException(
          'Programação não excluída: Relatório vinculado a essa programação',
        );
      }
      if (code === PRISMA_RECORD_NOT_FOUND) {
        throw new NotFoundException(`Programação ${id} não encontrada`);
      }

      throw new InternalServerErrorException('Erro ao excluir programação', {
        cause: error,
      });
    }
  }
}
