import { Injectable } from '@nestjs/common';
import { IWorksServicesRepository } from 'src/domain/repositories/IWorksServiceRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { scheduleServicesDTO } from 'src/interface/dtos/workServicesDTO';
import {
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

  async getServices({
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
    return await this.prisma.servicos.findMany({
      select: {
        id: true,
        ponto: true,
        operacao: true,
        programacoes_servicos: {
          select: {
            plan: true,
            prog: true,
            real: true,
            id: true,
            programacoes: { select: { data_prog: true } },
          },
        },
        servicos_contratos: { select: { texto_breve: true } },
      },
      where: { id },
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
    console.log(idParceira);
    return await this.prisma.equipes.findMany({
      select: {
        id: true,
        equipe: true,
        encarregado: true,
        perfil: true,
      },
      where: {
        id_turma: 2,
      },
    });
  }

  async scheduleServices(data: scheduleServicesDTO[]): Promise<void> {
    await this.prisma.$transaction(
      data.map((item: scheduleServicesDTO) => {
        const { id, idSchedule, idTeam, prog } = item;

        return this.prisma.servicos.updateMany({
          where: { id },
          data: {
            id_programacao: idSchedule,
            id_equipe: idTeam,
            qtde_prog: prog,
          },
        });
      }),
    );
  }
}
