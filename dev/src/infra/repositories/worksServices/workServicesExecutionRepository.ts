import { Injectable } from '@nestjs/common';
import {
  FinalizationData,
  IWorkServicesExecutionRepository,
} from 'src/domain/repositories/worksService/IWorkServicesExecutionRepository';
import {
  deriveExecutionStatus,
  ScheduleExecutionRow,
  ServiceExecutionStatus,
} from 'src/domain/services/pointByPointRules.service';
import { Prisma } from 'src/infra/generated/prisma/client';

@Injectable()
export class WorkServicesExeutionRepository implements IWorkServicesExecutionRepository {
  // ─── Finalização ────────────────────────────────────────────────────
  async finalizeServices(
    data: FinalizationData,
    tx: Prisma.TransactionClient,
  ): Promise<boolean> {
    const {
      id,
      prog,
      exec,
      idExecutionRestriction,
      responsibility,
      executionObservation,
      userId,
    } = data;

    try {
      await tx.programacoes.update({
        where: { id },
        data: {
          prog,
          exec,
          id_restricao_execucao: idExecutionRestriction,
          // O responsável e a observação da EXECUÇÃO têm colunas próprias;
          // `nome_responsavel` é o da restrição de programação.
          nome_responsavel_execucao: responsibility,
          observacao_execucao: executionObservation,
          id_usuario_ultima_atualizacao: userId,
        },
      });

      return true;
    } catch (error: any) {
      if (error.code === 'P2025') return false;
      throw error;
    }
  }

  // ─── Reagendamento / finalização ────────────────────────────────────
  findScheduleItems(
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<ScheduleExecutionRow[]> {
    return tx.programacoes_servicos.findMany({
      where: { id_programacao: scheduleId },
      select: {
        id: true,
        id_servico: true,
        prog: true,
        real: true,
        status: true,
      },
    });
  }

  /**
   * Marca como REPROGRAMADO as linhas sem apontamento e as parciais.
   * Não altera prog nem real. Os filtros evitam marcar linhas que mudaram
   * entretanto (o serviço compara o count devolvido).
   */
  async markScheduleItemsAsRescheduled(
    ids: number[],
    tx: Prisma.TransactionClient,
  ): Promise<number> {
    if (ids.length === 0) return 0;

    const { count } = await tx.programacoes_servicos.updateMany({
      where: {
        id: { in: ids },
        OR: [
          { status: null, real: null }, // sem apontamento
          { status: ServiceExecutionStatus.EXECUTADO }, // parcial
        ],
      },
      data: { status: ServiceExecutionStatus.REPROGRAMADO },
    });

    return count;
  }

  // ─── Execução ───────────────────────────────────────────────────────
  /**
   * Sem filtro de status: enquanto a programação está aberta, o apontamento
   * pode ser corrigido, incluindo nas linhas REPROGRAMADO. O bloqueio após o
   * encerramento é feito pelo FINALIZED_SCHEDULE_STATUSES no serviço.
   */
  findExecutionTargets(
    serviceId: number,
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ) {
    return tx.programacoes_servicos.findMany({
      where: { id_servico: serviceId, id_programacao: scheduleId },
      select: {
        id: true,
        status: true,
        programacoes: { select: { id_status_programacao: true } },
      },
    });
  }

  /** Grava o real e o status: null → REPROGRAMADO, 0 → NAO_EXECUTADO, > 0 → EXECUTADO. */
  async updateItemsExecution(
    items: { rowId: number; real: number | null }[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await Promise.all(
      items.map(({ rowId, real }) =>
        tx.programacoes_servicos.update({
          where: { id: rowId },
          data: { real, status: deriveExecutionStatus(real) },
        }),
      ),
    );
  }
}
