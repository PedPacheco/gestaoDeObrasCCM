import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IWorksServicesRepository } from 'src/domain/repositories/IWorksServiceRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  AddServicesDTO,
  ApplyAdditonalDTO,
  PerformServicesDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';
import {
  GetAllServicesOfWorkInterface,
  GetByIdParamsInterface,
  GetSelectedServicesParamsInterface,
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryResponse,
  GetServicesFiltersResponse,
  GetServicesSelectedByWorkIdResponse,
} from 'src/interface/types/servicesInterface';

@Injectable()
export class WorksServicesRepository implements IWorksServicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getAllServicesOfWork(
    id: number,
  ): Promise<GetAllServicesOfWorkInterface[]> {
    return await this.prisma.servicos.findMany({
      select: {
        id: true,
        id_contrato_servico: true,
        ponto: true,
        operacao: true,
        qtde_plan: true,
        qtde_adicional: true,
      },
      where: { id_obra: id },
    });
  }

  async getNotScheduledServices({
    id,
    operation,
    service,
    point,
  }: GetByIdParamsInterface): Promise<GetServicesByWorkIdResponse[]> {
    return await this.prisma.servicos.findMany({
      select: {
        id: true,
        id_obra: true,
        operacao: true,
        ponto: true,
        qtde_plan: true,
        qtde_prog: true,
        qtde_real: true,
        qtde_adicional: true,
        obras: { select: { ovnota: true } },
        programacoes: { select: { data_prog: true } },
        servicos_contratos: {
          select: {
            material: true,
            texto_breve: true,
            medida: true,
            contrato: true,
            preco: true,
          },
        },
      },
      where: {
        id_obra: id,
        id_programacao: null,
        ...(operation ? { operacao: operation } : {}),
        ...(point ? { ponto: point } : {}),
        ...(service
          ? {
              servicos_contratos: {
                texto_breve: { contains: service, mode: 'insensitive' },
              },
            }
          : {}),
      },
    });
  }

  async getSelectedServices({
    id,
    idProgramacao,
    operation,
    point,
    service,
  }: GetSelectedServicesParamsInterface): Promise<
    GetServicesSelectedByWorkIdResponse[]
  > {
    return await this.prisma.servicos.findMany({
      select: {
        id: true,
        id_obra: true,
        operacao: true,
        ponto: true,
        qtde_plan: true,
        qtde_prog: true,
        qtde_real: true,
        obras: { select: { ovnota: true } },
        servicos_contratos: {
          select: {
            material: true,
            texto_breve: true,
            medida: true,
            contrato: true,
            preco: true,
          },
        },
        programacoes: { select: { data_prog: true } },
        equipes: { select: { equipe: true, encarregado: true, perfil: true } },
      },
      where: {
        id_obra: id,
        id_programacao: idProgramacao,
        ...(operation ? { operacao: operation } : {}),
        ...(point ? { ponto: point } : {}),
        ...(service
          ? {
              servicos_contratos: {
                texto_breve: { contains: service, mode: 'insensitive' },
              },
            }
          : {}),
      },
    });
  }

  async getServiceScheduleHistory(
    id: number,
  ): Promise<GetServiceScheduleHistoryResponse[]> {
    return await this.prisma.programacoes_servicos.findMany({
      select: {
        id: true,
        id_servico: true,
        servicos: {
          select: {
            servicos_contratos: { select: { texto_breve: true } },
            ponto: true,
            operacao: true,
          },
        },
        id_programacao: true,
        programacoes: { select: { data_prog: true } },
        prog: true,
        plan: true,
        real: true,
      },
      where: { programacoes: { id_obra: id } },
    });
  }

  async getServicesFilters(id: number): Promise<GetServicesFiltersResponse> {
    const [services, operations, points] = await Promise.all([
      this.prisma.servicos_contratos.groupBy({
        by: ['texto_breve'],
        where: { servicos: { some: { id_obra: id } } },
      }),
      this.prisma.servicos.groupBy({
        by: ['operacao'],
        where: { id_obra: id },
      }),
      this.prisma.servicos.groupBy({
        by: ['ponto'],
        where: { id_obra: id },
      }),
    ]);

    return { services, operations, points };
  }

  async getServicesContracts(idParceira: number): Promise<any[]> {
    return await this.prisma.servicos_contratos.findMany({
      select: {
        id: true,
        texto_breve: true,
        material: true,
        preco: true,
        contrato: true,
        medida: true,
        turmas: { select: { turma: true } },
      },
      where: {
        id_turma: idParceira,
      },
    });
  }

  async getTeamsServices(idParceira: number): Promise<any[]> {
    return await this.prisma.equipes.findMany({
      select: {
        id: true,
        equipe: true,
        encarregado: true,
        perfil: true,
      },
      where: {
        id_turma: idParceira,
      },
    });
  }

  async scheduleServices(
    data: ScheduleServicesDTO[],
    totalProg: any,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      if (data.length === 0) {
        throw new Error('Programação não enviada.');
      }

      await tx.programacoes.update({
        data: { prog: totalProg },
        where: { id: data[0].idSchedule },
      });

      for (const item of data) {
        const { id, idSchedule, idTeam, prog } = item;

        await tx.programacoes_servicos.create({
          data: {
            id_programacao: idSchedule,
            id_servico: id,
            plan: prog,
            prog,
          },
        });

        await tx.servicos.update({
          where: { id },
          data: {
            id_programacao: idSchedule,
            id_equipe: idTeam,
            qtde_prog: prog,
          },
        });
      }
    });
  }

  async applyAdditional(data: ApplyAdditonalDTO[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of data) {
        await tx.servicos.updateMany({
          data: { qtde_adicional: item.additional },
          where: { id: item.id },
        });
      }
    });
  }

  async finalizeServices(
    data: any,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const { id, prog, exec, idExecutionRestriction, responsibility } = data;

    try {
      await tx.programacoes.update({
        where: { id },
        data: {
          prog: prog,
          exec: exec,
          id_restricao_execucao: idExecutionRestriction,
          nome_responsavel: responsibility,
        },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Agendamento com ID ${id} não encontrado`);
      }

      throw error;
    }
  }

  async performServices(data: PerformServicesDTO[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of data) {
        const { id, qtdeRealizada, idSchedule } = item;

        await tx.programacoes_servicos.updateMany({
          data: { real: qtdeRealizada },
          where: { id_servico: id, id_programacao: idSchedule },
        });

        await tx.servicos.updateMany({
          data: { qtde_real: qtdeRealizada },
          where: { id },
        });
      }
    });
  }

  async addServices(data: AddServicesDTO): Promise<void> {
    const { idService, idWork, operation, point, qtdePlan } = data;

    await this.prisma.servicos.create({
      data: {
        id_obra: idWork,
        id_contrato_servico: idService,
        operacao: operation,
        ponto: point,
        qtde_plan: qtdePlan,
      },
    });
  }

  async reascheduleServices(data: { id: number }[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      for (const item of data) {
        await tx.servicos.updateMany({
          data: { id_programacao: null },
          where: { id: item.id },
        });
      }
    });
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
        },
        where: { id_programacao: id },
      });

      await tx.programacoes.update({
        data: { prog: 0 },
        where: { id },
      });
    });
  }
}
