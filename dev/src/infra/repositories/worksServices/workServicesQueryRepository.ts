import {
  toMaterialContract,
  toScheduleHistoryByIdSchedule,
  toSelectedService,
  toServiceByWorkId,
  toWorkToExport,
} from 'src/infra/mappers/works/services/workServicesQuery.mapper';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  BASE_SERVICES_SELECT,
  buildWorkToExportSelect,
  MATERIALS_CONTRACT_SELECT,
  SCHEDULE_HISTORY_BY_ID_SCHEDULE_SELECT,
  SELECTED_SERVICES_SELECT,
} from 'src/infra/types';

import { Injectable } from '@nestjs/common';

import type { IWorkServicesQueryRepository } from 'src/domain/contracts/worksService/IWorkServicesQueryRepository';
import type {
  GetMaterialsContractsResponse,
  GetSelectedServicesParamsRequest,
  GetServiceOptionsResponse,
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryByIdScheduleResponse,
  GetServiceScheduleHistoryResponse,
  GetServicesContractsResponse,
  GetServicesSelectedByWorkIdResponse,
  GetTeamsServicesResponse,
  ServiceForScheduling,
  WorkToExportResponse,
} from 'src/domain/types';
import type { Prisma } from 'src/infra/generated/prisma/client';
import { workIdentifierWhere } from 'src/infra/shared/workIdentifierWhere';
@Injectable()
export class WorkServicesQueryRepository implements IWorkServicesQueryRepository {
  constructor(private readonly prisma: PrismaService) {}

  private async findService(
    where: Prisma.servicosWhereInput,
    tx?: Prisma.TransactionClient,
  ): Promise<GetServicesByWorkIdResponse[]> {
    const client = tx ?? this.prisma;
    const rows = await client.servicos.findMany({
      select: BASE_SERVICES_SELECT,
      where,
    });
    return rows.map(toServiceByWorkId);
  }

  async getAllServicesOfWork(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetServicesByWorkIdResponse[]> {
    return this.findService(
      {
        obras: workIdentifierWhere(id),
      },
      tx,
    );
  }

  async findServicesForScheduling(
    ids: number[],
    tx: Prisma.TransactionClient,
  ): Promise<ServiceForScheduling[]> {
    return tx.servicos.findMany({
      where: { id: { in: ids } },
      select: {
        id: true,
        id_obra: true,
        id_material: true,
        viabilizado: true,
        qtde_adicional: true,
        qtde_real: true,
        ponto: true,
        operacao: true,
        descricao_operacao: true,
      },
    });
  }

  async getNotScheduledServices(
    id: number,
  ): Promise<GetServicesByWorkIdResponse[]> {
    return this.findService({
      id_obra: id,
      AND: [
        { OR: [{ qtde_real: null }, { qtde_real: { not: 0 } }] },
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
    const rows = await this.prisma.programacoes_servicos.findMany({
      where: {
        id_programacao: idProgramacao,
        servicos: { id_obra: id },
      },
      select: SELECTED_SERVICES_SELECT,
    });
    return rows.map(toSelectedService);
  }

  async getServiceScheduleHistory(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetServiceScheduleHistoryResponse[]> {
    const client = tx ?? this.prisma;
    return client.programacoes_servicos.findMany({
      select: {
        id: true,
        id_servico: true,
        id_equipe: true,
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
        status: true,
      },
      where: { programacoes: { id_obra: id } },
    });
  }

  async getServiceScheduleHistoryByIdSchedule(
    ids: number[],
  ): Promise<GetServiceScheduleHistoryByIdScheduleResponse[]> {
    const rows = await this.prisma.programacoes_servicos.findMany({
      select: SCHEDULE_HISTORY_BY_ID_SCHEDULE_SELECT,
      where: { id_programacao: { in: ids } },
    });
    return rows.map(toScheduleHistoryByIdSchedule);
  }

  async getServicesToExportation(params: {
    dataFinal: string;
    dataInicial: string;
    idParceira: number[];
    idEquipe: number[];
  }): Promise<WorkToExportResponse[]> {
    const dateFilter: Prisma.DateTimeFilter = {
      gte: new Date(params.dataInicial),
      lte: new Date(params.dataFinal),
    };

    const programacoesServicosFilter: Prisma.programacoes_servicosWhereInput = {
      programacoes: { data_prog: dateFilter },
      ...(params.idEquipe.length > 0
        ? { id_equipe: { in: params.idEquipe } }
        : {}),
    };

    const rows = await this.prisma.obras.findMany({
      where: {
        id_turma: { in: params.idParceira },
        programacao_ponto_a_ponto: true,
        programacoes: { some: { data_prog: dateFilter } },
        servicos: {
          some: {
            OR: [
              { viabilizado: { not: null, gt: 0 } },
              // { qtde_adicional: { not: null, gt: 0 } },
            ],
            programacoes_servicos: { some: programacoesServicosFilter },
          },
        },
      },
      select: buildWorkToExportSelect(dateFilter, programacoesServicosFilter),
    });
    return rows.map(toWorkToExport);
  }

  async getServicesContracts(
    idParceira: number,
  ): Promise<GetServicesContractsResponse[]> {
    return this.prisma.servicos_contratos.findMany({
      select: {
        id: true,
        texto_breve: true,
        material: true,
        material_antigo: true,
        preco: true,
        contrato: true,
        medida: true,
        turmas: { select: { turma: true } },
      },
      where: { id_turma: idParceira },
    });
  }

  async getMaterialsContract(): Promise<GetMaterialsContractsResponse[]> {
    const rows = await this.prisma.materiais.findMany({
      select: MATERIALS_CONTRACT_SELECT,
    });
    return rows.map(toMaterialContract);
  }

  async getTeamsServices(
    idParceira: number,
  ): Promise<GetTeamsServicesResponse[]> {
    return this.prisma.equipes.findMany({
      select: { id: true, equipe: true, encarregado: true, perfil: true },
      where: { id_turma: idParceira },
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
