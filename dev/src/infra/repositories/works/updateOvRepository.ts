import { Injectable, Logger } from '@nestjs/common';
import { MarketWork } from 'src/domain/entities/works.entity';
import { IUpdateOvRepository } from 'src/domain/repositories/works/IUpdateOvRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class UpdateOvRepository implements IUpdateOvRepository {
  private readonly logger = new Logger(UpdateOvRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async update(data: Partial<MarketWork>[]): Promise<void> {
    try {
      await this.prisma.$transaction(
        data.map((item: any) => {
          const {
            id,
            obra,
            pep,
            diagrama,
            entrada,
            id_gpm,
            id_circuito,
            id_tipo,
            id_turma,
            referencia,
            prazo,
            status_diagrama,
            status_pep,
            status_ov,
          } = item;

          return this.prisma.obras.update({
            where: { id },
            data: {
              ovnota: obra,
              pep,
              diagrama,
              entrada,
              id_gpm,
              id_tipo,
              id_circuito,
              id_turma,
              status_ov_sap: Number(status_ov),
              prazo,
              status_diagrama,
              status_pep,
              referencia,
            },
          });
        }),
      );
    } catch (error: any) {
      this.logger.error(
        `Erro ao atualizar contratos. Payload: ${JSON.stringify(data)}`,
        error.stack,
      );
      throw error;
    }
  }
}
