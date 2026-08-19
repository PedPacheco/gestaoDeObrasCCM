import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { IWorkServicesExecutionRepository } from 'src/domain/repositories/worksService/IWorkServicesExecutionRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { PerformServicesDTO } from 'src/interface/dtos/workServicesDTO';

@Injectable()
export class WorkServicesExeutionRepository implements IWorkServicesExecutionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async finalizeServices(
    data: any,
    pendingExecServicesData: number[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const { id, prog, exec, idExecutionRestriction, responsibility, userId } =
      data;

    try {
      await tx.programacoes.update({
        where: { id },
        data: {
          prog: prog,
          exec: exec,
          id_restricao_execucao: idExecutionRestriction,
          nome_responsavel: responsibility,
          id_usuario_ultima_atualizacao: userId,
        },
      });

      if (pendingExecServicesData.length > 0) {
        await tx.servicos.updateMany({
          where: { id: { in: pendingExecServicesData } },
          data: { id_programacao: null },
        });
      }
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Agendamento com ID ${id} não encontrado`);
      }

      throw error;
    }
  }

  async reascheduleServices(
    data: { id_servico: number }[],
    scheduleId: number,
  ): Promise<void> {
    if (data.length === 0) return;

    const serviceIds = data.map((item) => item.id_servico);

    await this.prisma.$transaction(
      async (tx) => {
        await tx.servicos.updateMany({
          where: { id: { in: serviceIds } },
          data: { id_programacao: null },
        });

        await tx.programacoes.update({
          where: { id: scheduleId },
          data: { exec: 0 },
        });
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );
  }

  async performServices(data: PerformServicesDTO[]): Promise<void> {
    const BATCH_SIZE = 50;

    await this.prisma.$transaction(
      async (tx) => {
        for (let i = 0; i < data.length; i += BATCH_SIZE) {
          const batch = data.slice(i, i + BATCH_SIZE);

          await Promise.all(
            batch.flatMap(({ id, qtdeRealizada, idSchedule }) => [
              tx.programacoes_servicos.updateMany({
                data: {
                  real: qtdeRealizada,
                },
                where: {
                  id_servico: id,
                  id_programacao: idSchedule,
                },
              }),

              tx.servicos.update({
                data: {
                  qtde_real: qtdeRealizada,
                },
                where: {
                  id,
                },
              }),
            ]),
          );
        }
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );
  }
}
