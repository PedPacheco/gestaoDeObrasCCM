import { Injectable } from '@nestjs/common';
import { IWorkServicesQueryRepository } from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';

import { PrismaService } from 'src/infra/prisma/prisma.service';

import {
  GetAllServicesOfWorkInterface,
  GetByIdParamsInterface,
  GetSelectedServicesParamsInterface,
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryResponse,
  GetServicesSelectedByWorkIdResponse,
} from 'src/interface/types/servicesInterface';

@Injectable()
export class WorkServicesQueryRepository implements IWorkServicesQueryRepository {
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
        qtde_adicional: true,
        viabilizado: true,
      },
      where: { id_obra: id },
    });
  }

  async getAllMaterialsOfWork(id: number): Promise<any[]> {
    return await this.prisma.servicos.findMany({
      select: {
        id: true,
        id_material: true,
        ponto: true,
        operacao: true,
        qtde_plan: true,
        qtde_adicional: true,
        viabilizado: true,
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
        viabilizado: true,
        descricao_operacao: true,
        numero_operacao: true,
        programacoes: { select: { data_prog: true } },
        materiais: { select: { codigo: true, descricao: true, preco: true } },
        servicos_contratos: {
          select: {
            material: true,
            texto_breve: true,
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
        qtde_adicional: true,
        viabilizado: true,
        descricao_operacao: true,
        numero_operacao: true,
        materiais: { select: { codigo: true, descricao: true, preco: true } },
        servicos_contratos: {
          select: {
            material: true,
            texto_breve: true,
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
            materiais: { select: { descricao: true } },
            servicos_contratos: { select: { texto_breve: true } },
            ponto: true,
            operacao: true,
            qtde_plan: true,
            viabilizado: true,
          },
        },
        id_programacao: true,
        programacoes: { select: { data_prog: true } },
        equipes: { select: { equipe: true } },
        prog: true,
        real: true,
        adicional: true,
      },
      where: { programacoes: { id_obra: id } },
    });
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

  async getMaterialsContract(): Promise<any[]> {
    return await this.prisma.materiais.findMany();
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
}
