import { Injectable, Logger } from '@nestjs/common';
import { CalculatedValue } from 'src/application/works/updateCapex.service';
import { IUpdateCapexRepository } from 'src/domain/repositories/works/IUpdateCapexRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class UpdateCapexRepository implements IUpdateCapexRepository {
  private readonly logger = new Logger(UpdateCapexRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async getDeletedMaterials(): Promise<any> {
    return await this.prisma.servicos_contratos.findMany({
      select: { material: true },
      distinct: ['material'],
    });
  }

  async update(data: CalculatedValue[]) {
    const BATCH_SIZE = 500;

    try {
      for (let i = 0; i < data.length; i += BATCH_SIZE) {
        const batch = data.slice(i, i + BATCH_SIZE);

        await this.prisma.$transaction(async (tx) => {
          for (const item of batch) {
            const {
              id,
              capex_mat_pend,
              capex_mat_plan,
              capex_mo_pend,
              capex_mo_plan,
              mo_calc,
              qtde_calc,
              qtde_pend,
            } = item;

            await tx.obras.update({
              where: { id },
              data: {
                capex_mat_pend,
                capex_mat_plan,
                capex_mo_pend,
                capex_mo_plan,
                mo_planejada: mo_calc,
                qtde_planejada: qtde_calc,
                qtde_pend,
              },
            });
          }
        });
      }

      // Após todos os batches
      await this.prisma.cn52n.deleteMany();
    } catch (error) {
      this.logger.error(`Erro ao atualizar capex`, error.stack);
      throw error;
    }
  }
}
