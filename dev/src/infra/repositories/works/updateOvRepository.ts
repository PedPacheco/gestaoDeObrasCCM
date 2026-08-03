import { Injectable } from '@nestjs/common';
import { MarketWork } from 'src/domain/entities/works.entity';
import { IUpdateOvRepository } from 'src/domain/repositories/works/IUpdateOvRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class UpdateOvRepository implements IUpdateOvRepository {
  constructor(private readonly prisma: PrismaService) {}

  async update(data: Partial<MarketWork>[]): Promise<void> {
    await this.prisma.$transaction(
      data.map((item: any) => {
        const {
          id,
          obra,
          pep,
          diagrama,
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
  }
}
