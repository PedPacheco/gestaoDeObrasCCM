import { Injectable } from '@nestjs/common';
import {
  FinalizationData,
  IWorkServicesExecutionRepository,
} from 'src/domain/repositories/worksService/IWorkServicesExecutionRepository';
import { ScheduleExecutionRow } from 'src/domain/services/pointByPointRules.service';
import { Prisma } from '../../../generated/prisma/client';

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

  // ─── Reagendamento ──────────────────────────────────────────────────

  findScheduleWork(scheduleId: number, tx: Prisma.TransactionClient) {
    return tx.programacoes.findUnique({
      where: { id: scheduleId },
      select: { id_obra: true },
    });
  }

  findScheduleItems(
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<ScheduleExecutionRow[]> {
    return tx.programacoes_servicos.findMany({
      where: { id_programacao: scheduleId },
      select: { id: true, id_servico: true, prog: true, real: true },
    });
  }

  async deleteScheduleItemsByIds(
    ids: number[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.programacoes_servicos.deleteMany({ where: { id: { in: ids } } });
  }

  async zeroScheduleProgress(
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.programacoes.update({
      where: { id: scheduleId },
      data: { prog: 0, exec: 0 },
    });
  }

  // ─── Execução ───────────────────────────────────────────────────────

  findExecutionTargets(
    serviceId: number,
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ) {
    return tx.programacoes_servicos.findMany({
      where: { id_servico: serviceId, id_programacao: scheduleId },
      select: {
        id: true,
        programacoes: { select: { id_status_programacao: true } },
      },
    });
  }

  async updateItemsReal(
    items: { rowId: number; real: number }[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await Promise.all(
      items.map(({ rowId, real }) =>
        tx.programacoes_servicos.update({
          where: { id: rowId },
          data: { real },
        }),
      ),
    );
  }
}
