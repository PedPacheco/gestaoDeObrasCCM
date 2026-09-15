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
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Agendamento com ID ${id} não encontrado`);
      }

      throw error;
    }
  }

  // Recebe `tx`: precisa participar da mesma transação orquestrada pelo
  // FinalizeServicesService (junto com a atualização de status de obra/
  // programação), senão um erro nos passos seguintes deixaria o
  // zeramento de real/exec já commitado e os status desatualizados.
  async reascheduleServices(
    data: { id_servico: number }[],
    scheduleId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (data.length === 0) return;

    const serviceIds = data.map((item) => item.id_servico);

    await tx.programacoes_servicos.updateMany({
      where: { id_servico: { in: serviceIds }, id_programacao: scheduleId },
      data: { real: 0 },
    });

    await tx.programacoes.update({
      where: { id: scheduleId },
      data: { exec: 0 },
    });
  }

  async performServices(data: PerformServicesDTO[]): Promise<void> {
    const BATCH_SIZE = 50;

    await this.prisma.$transaction(
      async (tx) => {
        for (let i = 0; i < data.length; i += BATCH_SIZE) {
          const batch = data.slice(i, i + BATCH_SIZE);

          // 1. Atualiza o realizado em programacoes_servicos
          await Promise.all(
            batch.map(({ id, qtdeRealizada, idSchedule }) =>
              tx.programacoes_servicos.updateMany({
                data: { real: qtdeRealizada },
                where: {
                  id_servico: id,
                  id_programacao: idSchedule,
                },
              }),
            ),
          );

          // 2. Recalcula os totalizadores dos serviços afetados
          const uniqueServiceIds = [...new Set(batch.map(({ id }) => id))];

          // Mapear cada serviço aos seus idSchedules neste batch
          const schedulesByService = batch.reduce((acc, { id, idSchedule }) => {
            if (!acc.has(id)) acc.set(id, new Set());
            acc.get(id).add(idSchedule);
            return acc;
          }, new Map<number, Set<number>>());

          await Promise.all(
            uniqueServiceIds.map(async (idServico) => {
              const currentScheduleIds = [...schedulesByService.get(idServico)];

              // Real da programação atual — soma dos DTOs deste serviço
              const realAtual = batch
                .filter((item) => item.id === idServico)
                .reduce((acc, item) => acc + (item.qtdeRealizada ?? 0), 0);

              // Buscar TODOS os registos — para qtde_real
              const totalAgg = await tx.programacoes_servicos.aggregate({
                where: { id_servico: idServico },
                _sum: { real: true },
              });

              // Buscar prog das outras programações
              const outrasProgramacoes =
                await tx.programacoes_servicos.aggregate({
                  where: {
                    id_servico: idServico,
                    id_programacao: { notIn: currentScheduleIds },
                  },
                  _sum: { prog: true },
                });

              // qtde_prog = real da atual (do DTO) + prog das outras
              const qtdeProg = realAtual + (outrasProgramacoes._sum.prog ?? 0);

              await tx.servicos.update({
                where: { id: idServico },
                data: {
                  qtde_prog: qtdeProg,
                  qtde_real: totalAgg._sum.real ?? 0,
                },
              });
            }),
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
