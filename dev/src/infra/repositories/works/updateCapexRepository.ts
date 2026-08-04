import { Injectable, Logger } from '@nestjs/common';
import { ProgressEmitter } from 'src/application/shared/capex.types';
import { CalculatedValue } from 'src/application/usecases/works/updateCapex.service';
import { IUpdateCapexRepository } from 'src/domain/contracts/works/IUpdateCapexRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class UpdateCapexRepository implements IUpdateCapexRepository {
  private readonly logger = new Logger(UpdateCapexRepository.name);

  // Itens por transação. 500 é um bom equilíbrio entre tamanho
  // de transação e número de round-trips ao banco.
  private readonly BATCH_SIZE = 500;

  // Dentro de cada transação, executa até N updates em paralelo.
  // Evita abrir 500 promises de uma vez, mas ainda elimina o await
  // sequencial que era o principal gargalo de performance.
  private readonly CONCURRENCY = 50;

  constructor(private readonly prisma: PrismaService) {}

  async getDeletedMaterials(): Promise<any> {
    return this.prisma.servicos_contratos.findMany({
      select: { material: true },
      distinct: ['material'],
    });
  }

  async update(
    data: CalculatedValue[],
    onProgress?: ProgressEmitter,
  ): Promise<void> {
    const total = data.length;
    let done = 0;

    for (let i = 0; i < data.length; i += this.BATCH_SIZE) {
      const batch = data.slice(i, i + this.BATCH_SIZE);

      for (let j = 0; j < batch.length; j += this.CONCURRENCY) {
        const chunk = batch.slice(j, j + this.CONCURRENCY);

        await Promise.all(
          chunk.map((item) =>
            this.prisma.obras.update({
              where: { id: item.id },
              data: {
                capex_mat_pend: item.capex_mat_pend,
                capex_mat_plan: item.capex_mat_plan,
                capex_mo_pend: item.capex_mo_pend,
                capex_mo_plan: item.capex_mo_plan,
                mo_planejada: item.mo_calc,
                mo_final: item.mo_exec,
                mo_pend: item.mo_pend,
                qtde_planejada: item.qtde_calc,
                qtde_pend: item.qtde_pend,
              },
            }),
          ),
        );

        // 🔥 Atualiza progresso por chunk (não por item)
        done += chunk.length;

        onProgress?.({
          phase: 'updating',
          processed: done,
          percentage: this.calcPercentage(done, total),
          message: 'Atualizando capex das obras',
        });
      }
    }

    // Limpa a tabela auxiliar após todos os batches com sucesso.
    // Feito fora das transações de update para não misturar responsabilidades.
    await this.prisma.cn52n.deleteMany();
  }

  /**
   * Mapeia o progresso da gravação para a faixa 50% → 99%.
   * O 100% é emitido pelo serviço após o deleteMany, sinalizando conclusão real.
   */
  private calcPercentage(done: number, total: number): number {
    if (total === 0) return 50;
    return Math.floor(50 + (done / total) * 49);
  }
}
