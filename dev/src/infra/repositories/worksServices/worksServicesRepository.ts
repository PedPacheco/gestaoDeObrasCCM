import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ImportServiceItem,
  IWorkServicesRepository,
  SchedulesProgressUpdate,
} from 'src/domain/repositories/worksService/IWorkServicesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  AddServicesDTO,
  ApplyAdditonalDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';

@Injectable()
export class WorkServicesRepository implements IWorkServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async scheduleServices(
    data: ScheduleServicesDTO[],
    totalProg: number | { increment: number },
    idSchedule: number,
    idStatusSchedule?: number,
  ): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        await tx.programacoes.update({
          where: { id: idSchedule },
          data: {
            prog: totalProg,
            ...(idStatusSchedule !== undefined && {
              id_status_programacao: idStatusSchedule,
              reprovada: false,
            }),
          },
        });

        await tx.programacoes_servicos.createMany({
          data: data.map(({ id, idSchedule, idTeam, prog, additional }) => ({
            id_programacao: idSchedule,
            id_servico: id,
            id_equipe: idTeam,
            prog: prog,
            adicional: additional,
          })),
        });
        await Promise.all(
          data.map(async ({ id, additional }) => {
            // Buscar todos os programacoes_servicos deste serviço
            const programacoes = await tx.programacoes_servicos.findMany({
              where: { id_servico: id },
              select: { real: true, prog: true },
            });

            // Somar: real se existir, senão prog
            const qtdeProg = programacoes.reduce(
              (acc, item) => acc + (item.real ?? item.prog ?? 0),
              0,
            );

            return tx.servicos.update({
              where: { id },
              data: {
                qtde_prog: qtdeProg,
                qtde_adicional: additional,
              },
            });
          }),
        );
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );
  }

  async cancelServices(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const servicosAfetados = await tx.programacoes_servicos.findMany({
        where: { id_programacao: id },
        select: { id_servico: true, prog: true },
      });

      // 2. Subtrair o prog de cada serviço
      const progPorServico = servicosAfetados.reduce(
        (acc, { id_servico, prog }) => {
          acc.set(id_servico, (acc.get(id_servico) ?? 0) + (prog ?? 0));
          return acc;
        },
        new Map<number, number>(),
      );

      await Promise.all(
        [...progPorServico.entries()].map(([idServico, progRemovido]) =>
          tx.servicos.update({
            where: { id: idServico },
            data: {
              qtde_prog: { decrement: progRemovido },
            },
          }),
        ),
      );

      await tx.programacoes_servicos.deleteMany({
        where: { id_programacao: id },
      });

      // 4. Zerar o prog da programação
      await tx.programacoes.update({ data: { prog: 0 }, where: { id } });
    });
  }

  // Agora recebe `tx`: passou a ser chamado dentro da transação orquestrada
  // pelo WorksServicesService (junto com o recálculo em massa de prog/exec).
  async applyAdditional(
    data: ApplyAdditonalDTO[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await Promise.all(
      data.map(({ additional, id }) =>
        tx.servicos.updateMany({
          data: { qtde_adicional: additional },
          where: { id },
        }),
      ),
    );
  }

  // Idem: recebe `tx` para participar da mesma transação do recálculo em massa.
  async addItem(
    data: AddServicesDTO,
    type: 'service' | 'material',
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const {
      idService,
      idWork,
      operation,
      point,
      operationDescription,
      quantity,
    } = data;

    await tx.servicos.create({
      data: {
        id_obra: idWork,
        id_contrato_servico: type === 'service' ? idService : null,
        id_material: type === 'material' ? idService : null,
        operacao: operation,
        ponto: point,
        descricao_operacao: operationDescription,
        qtde_plan: 0,
        viabilizado: quantity,
      },
    });
  }

  // Novo: update em lote de prog/exec de várias programações de uma vez,
  // via SQL raw (CASE WHEN), evitando N+1 de updates individuais.
  async updateSchedulesProgress(
    data: SchedulesProgressUpdate[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (data.length === 0) return;

    const progCases = Prisma.join(
      data.map((d) => Prisma.sql`WHEN ${d.idProgramacao} THEN ${d.prog}`),
      ' ',
    );
    const execCases = Prisma.join(
      data.map((d) =>
        d.exec === null
          ? Prisma.sql`
          WHEN ${d.idProgramacao}
          THEN NULL::DOUBLE PRECISION
        `
          : Prisma.sql`
          WHEN ${d.idProgramacao}
          THEN ${d.exec}
        `,
      ),
      ' ',
    );
    const ids = Prisma.join(data.map((d) => d.idProgramacao));

    await tx.$executeRaw`
      UPDATE programacoes
      SET prog = CASE id ${progCases} END,
          exec = CASE id ${execCases} END
      WHERE id IN (${ids})
    `;
  }

  async updateWorkExecuted(
    workId: number,
    executed: number | null,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.obras.update({
      where: {
        id: workId,
      },
      data: {
        executado: executed,
      },
    });
  }

  // Recebe `tx`: passou a ser chamado dentro da transação orquestrada
  // pelo WorksServicesService, junto com o recálculo em massa de prog/exec.
  async delete(id: number, tx: Prisma.TransactionClient): Promise<void> {
    await tx.servicos.delete({ where: { id } });
  }

  // Recebe `tx`: passou a ser chamado dentro da transação orquestrada pelo
  // WorksServicesService, junto com o recálculo em massa de prog/exec —
  // mesmo motivo da correção aplicada em reascheduleServices.
  async deleteAll(workId: number, tx: Prisma.TransactionClient): Promise<void> {
    await tx.servicos.deleteMany({ where: { id_obra: workId } });
    await tx.relatorio.delete({ where: { id_obra: workId } });
  }

  async bulkImportItems(
    workId: number,
    items: ImportServiceItem[],
    tx: Prisma.TransactionClient,
  ) {
    if (items.length === 0) return;

    await tx.servicos.createMany({
      data: items.map((item) => ({
        id_obra: workId,
        id_contrato_servico: item.type === 'service' ? item.idService : null,
        id_material: item.type === 'material' ? item.idService : null,
        operacao: item.operation,
        ponto: item.point,
        numero_operacao: item.operationNumber,
        descricao_operacao: item.operationDescription,
        qtde_plan: item.plannedQuantity,
        qtde_adicional: 0,
      })),
    });

    await tx.relatorio.upsert({
      where: { id_obra: workId },
      create: { id_obra: workId, encontrado: true },
      update: { encontrado: true },
    });
  }
}
