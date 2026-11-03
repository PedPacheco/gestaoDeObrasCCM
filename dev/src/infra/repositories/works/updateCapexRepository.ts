import { Injectable, Logger } from '@nestjs/common';
import { ProgressEmitter } from 'src/application/shared/capex.types';
import { IUpdateCapexRepository } from 'src/domain/contracts/works/IUpdateCapexRepository';
import { CalculatedValue } from 'src/domain/entities/capex.entity';

import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class UpdateCapexRepository implements IUpdateCapexRepository {
  private readonly logger = new Logger(UpdateCapexRepository.name);

  // Obras por UPDATE. Cada lote é UM comando SQL (UPDATE ... FROM unnest),
  // em vez de um UPDATE por obra.
  private readonly BATCH_SIZE = 1000;

  // A gravação inteira roda numa transação interativa; o padrão do Prisma
  // (5 s) não comporta milhares de obras.
  private readonly TRANSACTION_MAX_WAIT_MS = 10_000;
  private readonly TRANSACTION_TIMEOUT_MS = 10 * 60_000;

  constructor(private readonly prisma: PrismaService) {}

  async getDeletedMaterials(): Promise<{ material: string | null }[]> {
    return this.prisma.servicos_contratos.findMany({
      select: { material: true },
      distinct: ['material'],
    });
  }

  async update(
    data: CalculatedValue[],
    onProgress?: ProgressEmitter,
  ): Promise<void> {
    try {
      const total = data.length;
      let done = 0;

      await this.prisma.$transaction(
        async (tx) => {
          for (let i = 0; i < data.length; i += this.BATCH_SIZE) {
            const batch = data.slice(i, i + this.BATCH_SIZE);

            const ids = batch.map((item) => item.id);
            const capexMatPend = batch.map((i) => this.num(i.capex_mat_pend));
            const capexMatPlan = batch.map((i) => this.num(i.capex_mat_plan));
            const capexMoPend = batch.map((i) => this.num(i.capex_mo_pend));
            const capexMoPlan = batch.map((i) => this.num(i.capex_mo_plan));
            const moPlanejada = batch.map((i) => this.num(i.mo_calc));
            const moFinal = batch.map((i) => this.num(i.mo_exec));
            const moPend = batch.map((i) => this.num(i.mo_pend));
            const qtdePlanejada = batch.map((i) => this.num(i.qtde_calc));
            const qtdePend = batch.map((i) => this.num(i.qtde_pend));

            await tx.$executeRaw`
              UPDATE obras AS o SET
                capex_mat_pend = v.capex_mat_pend,
                capex_mat_plan = v.capex_mat_plan,
                capex_mo_pend  = v.capex_mo_pend,
                capex_mo_plan  = v.capex_mo_plan,
                mo_planejada   = v.mo_planejada,
                mo_final       = v.mo_final,
                mo_pend        = v.mo_pend,
                qtde_planejada = v.qtde_planejada,
                qtde_pend      = v.qtde_pend
              FROM unnest(
                ${ids}::int[],
                ${capexMatPend}::float8[],
                ${capexMatPlan}::float8[],
                ${capexMoPend}::float8[],
                ${capexMoPlan}::float8[],
                ${moPlanejada}::float8[],
                ${moFinal}::float8[],
                ${moPend}::float8[],
                ${qtdePlanejada}::float8[],
                ${qtdePend}::float8[]
              ) AS v(
                id, capex_mat_pend, capex_mat_plan, capex_mo_pend, capex_mo_plan,
                mo_planejada, mo_final, mo_pend, qtde_planejada, qtde_pend
              )
              WHERE o.id = v.id
            `;

            // Progresso por lote, na escala da própria fase (0–100).
            done += batch.length;

            onProgress?.({
              phase: 'updating',
              processed: done,
              percentage: this.calcPercentage(done, total),
              message: 'Atualizando capex das obras',
            });
          }

          // Limpa a tabela auxiliar na mesma transação: ou tudo, ou nada.
          await tx.$executeRaw`TRUNCATE TABLE cn52n`;
        },
        {
          maxWait: this.TRANSACTION_MAX_WAIT_MS,
          timeout: this.TRANSACTION_TIMEOUT_MS,
        },
      );
    } catch (error: any) {
      this.logger.error('Erro ao atualizar capex nas obras', error?.stack);
      throw error;
    }
  }

  /** Percentual dentro da fase 'updating'; o orquestrador converte para a escala global. */
  private calcPercentage(done: number, total: number): number {
    if (total === 0) return 100;
    return Math.min(100, Math.floor((done / total) * 100));
  }

  /** NaN/Infinity (ex.: divisão por dado nulo) viram 0 em vez de quebrar o UPDATE. */
  private num(value: number): number {
    return Number.isFinite(value) ? value : 0;
  }
}
