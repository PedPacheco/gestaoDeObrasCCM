import { Injectable } from '@nestjs/common';
import { IWorkServicesRepository } from 'src/domain/repositories/worksService/IWorkServicesRepository';
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
  ): Promise<void> {
    await this.prisma.$transaction(
      async (tx) => {
        await tx.programacoes.update({
          data: { prog: totalProg },
          where: { id: idSchedule },
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
          data.map(({ id, idSchedule, idTeam, prog, additional }) =>
            tx.servicos.update({
              where: { id },
              data: {
                id_programacao: idSchedule,
                id_equipe: idTeam,
                qtde_prog: prog,
                qtde_adicional: additional,
              },
            }),
          ),
        );
      },
      {
        maxWait: 10000,
        timeout: 30000,
      },
    );
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

  async cancelServices(id: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.programacoes_servicos.deleteMany({
        where: { id_programacao: id },
      });

      await tx.servicos.updateMany({
        data: {
          id_programacao: null,
          qtde_real: null,
          qtde_prog: null,
        },
        where: { id_programacao: id },
      });

      await tx.programacoes.update({
        data: { prog: 0 },
        where: { id },
      });
    });
  }

  async applyAdditional(data: ApplyAdditonalDTO[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await Promise.all(
        data.map(({ additional, id }) =>
          tx.servicos.updateMany({
            data: { qtde_adicional: additional },
            where: { id },
          }),
        ),
      );
    });
  }

  async addItem(
    data: AddServicesDTO,
    type: 'service' | 'material',
  ): Promise<void> {
    const {
      idService,
      idWork,
      operation,
      point,
      operationDescription,
      operationNumber,
    } = data;

    await this.prisma.servicos.create({
      data: {
        id_obra: idWork,
        id_contrato_servico: type === 'service' ? idService : null,
        id_material: type === 'material' ? idService : null,
        operacao: operation,
        ponto: point,
        descricao_operacao: operationDescription,
        numero_operacao: operationNumber,
        qtde_plan: 0,
      },
    });
  }
}
