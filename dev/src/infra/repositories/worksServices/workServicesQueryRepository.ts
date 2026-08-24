import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IWorkServicesQueryRepository } from 'src/domain/contracts/worksService/IWorkServicesQueryRepository';
import {
  GetMaterialsContractsResponse,
  GetSelectedServicesParamsRequest,
  GetServiceOptionsResponse,
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryResponse,
  GetServicesContractsResponse,
  GetServicesSelectedByWorkIdResponse,
  GetTeamsServicesResponse,
} from 'src/domain/types';

import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class WorkServicesQueryRepository implements IWorkServicesQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly baseServicesSelect = {
    id: true,
    id_obra: true,
    id_contrato_servico: true,
    id_material: true,
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
  };

  private async findService(where: any, tx?: Prisma.TransactionClient) {
    const client = tx ?? this.prisma;

    return await client.servicos.findMany({
      select: this.baseServicesSelect,
      where,
    });
  }

  async getAllServicesOfWork(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetServicesByWorkIdResponse[]> {
    return await this.findService({ id_obra: id }, tx);
  }

  async getNotScheduledServices(
    id: number,
  ): Promise<GetServicesByWorkIdResponse[]> {
    return await this.findService({
      id_obra: id,
      id_programacao: {
        equals: null,
      },
      AND: [
        {
          OR: [
            {
              qtde_real: null,
            },

            {
              qtde_real: {
                not: 0,
              },
            },
          ],
        },
        { OR: [{ viabilizado: null }, { viabilizado: { not: 0 } }] },
      ],
    });
  }

  async getSelectedServices({
    id,
    idProgramacao,
  }: GetSelectedServicesParamsRequest): Promise<
    GetServicesSelectedByWorkIdResponse[]
  > {
    return await this.prisma.servicos.findMany({
      select: {
        ...this.baseServicesSelect,
        equipes: { select: { equipe: true, encarregado: true, perfil: true } },
      },
      where: {
        id_obra: id,
        id_programacao: idProgramacao,
      },
    });
  }

  async getServiceScheduleHistory(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetServiceScheduleHistoryResponse[]> {
    const client = tx ?? this.prisma;

    return await client.programacoes_servicos.findMany({
      select: {
        id: true,
        id_servico: true,
        servicos: {
          select: {
            materiais: { select: { descricao: true, codigo: true } },
            servicos_contratos: {
              select: { texto_breve: true, material: true },
            },
            ponto: true,
            operacao: true,
            qtde_plan: true,
            viabilizado: true,
            descricao_operacao: true,
            numero_operacao: true,
          },
        },
        id_programacao: true,
        programacoes: { select: { data_prog: true } },
        equipes: { select: { equipe: true, perfil: true } },
        prog: true,
        real: true,
        adicional: true,
      },
      where: { programacoes: { id_obra: id } },
    });
  }

  async getServicesContracts(
    idParceira: number,
  ): Promise<GetServicesContractsResponse[]> {
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

  async getMaterialsContract(): Promise<GetMaterialsContractsResponse[]> {
    return await this.prisma.materiais.findMany();
  }

  async getTeamsServices(
    idParceira: number,
  ): Promise<GetTeamsServicesResponse[]> {
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

  async getServiceOptions(id: number): Promise<GetServiceOptionsResponse> {
    const [description, points] = await Promise.all([
      this.prisma.servicos.groupBy({
        by: ['descricao_operacao'],
        where: { id_obra: id },
      }),
      this.prisma.servicos.groupBy({
        by: ['ponto'],
        where: { id_obra: id },
      }),
    ]);

    return {
      operation_description: description.map((d) => d.descricao_operacao),
      points: points.map((p) => p.ponto),
    };
  }
}
