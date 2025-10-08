import { Injectable, Logger } from '@nestjs/common';
import { CalculatedValue } from 'src/application/works/updateCapex.service';
import { IUpdateCapexRepository } from 'src/domain/repositories/works/IUpdateCapexRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class UpdateCapexRepository implements IUpdateCapexRepository {
  private readonly logger = new Logger(UpdateCapexRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async getDeletedMaterials(): Promise<any> {
    return await this.prisma.materiais_excluidos.findMany({
      select: { codigo_material: true },
    });
  }

  async update(data: CalculatedValue[]) {
    try {
      await this.prisma.$transaction(
        data.map((item: CalculatedValue) => {
          const {
            diagrama_rede,
            capex_mat_pend,
            capex_mat_plan,
            capex_mo_pend,
            capex_mo_plan,
            mo_calc,
            qtde_calc,
            qtde_pend,
          } = item;

          return this.prisma.obras.updateMany({
            where: {
              OR: [
                { diagrama: diagrama_rede },
                { ordem_dci: diagrama_rede },
                { ordem_dcim: diagrama_rede },
              ],
            },
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
