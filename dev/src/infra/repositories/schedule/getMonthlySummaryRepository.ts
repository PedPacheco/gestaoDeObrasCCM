import moment from 'moment';
import {
  GetContractValueResponse,
  GetMonthlySummaryResponse,
  GetPortfolioSummaryResponse,
} from 'src/domain/types';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';

import { Injectable } from '@nestjs/common';

import { IGetMonthlySummaryRepository } from '../../../domain/contracts/schedule/IGetMonthlySummaryRepository';

@Injectable()
export class GetMonthlySummaryRepository implements IGetMonthlySummaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetMonthlySummaryResponse[]> {
    const { dataFinal, dataInicial, idRegional, idParceira, idTipo, idGrupo } =
      filters;

    return await this.prisma.programacoes.findMany({
      where: {
        id_status_programacao: { not: 7 },
        data_prog: {
          gte: moment.utc(dataInicial, 'DD/MM/YYYY').toDate(),
          lte: moment.utc(dataFinal, 'DD/MM/YYYY').toDate(),
        },
        obras: {
          tipos: {
            id_grupo:
              idGrupo && idGrupo.length > 0 ? { in: idGrupo } : undefined,
          },
          municipios: {
            id_regional:
              idRegional && idRegional.length > 0
                ? { in: idRegional }
                : undefined,
          },
          id_turma:
            idParceira && idParceira.length > 0
              ? { in: idParceira }
              : undefined,
          id_tipo: idTipo && idTipo.length > 0 ? { in: idTipo } : undefined,
        },
      },
      select: {
        data_prog: true,
        prog: true,
        exec: true,
        equipe_linha_viva: true,
        equipe_linha_morta: true,
        equipe_regularizacao: true,
        obras: {
          select: {
            ovnota: true,
            ordem_dci: true,
            ordem_dca: true,
            ordem_dcd: true,
            ordem_dcim: true,
            mo_planejada: true,
            mo_pend: true,
            executado: true,
            id_turma: true,
            turmas: { select: { turma: true } },
            tipos: {
              select: { id_grupo: true, grupos: { select: { grupo: true } } },
            },
          },
        },
      },
      orderBy: { data_prog: 'asc' },
    });
  }

  async getPortfolioSummary(
    filters: any,
  ): Promise<GetPortfolioSummaryResponse[]> {
    const { idRegional, idParceira, idTipo, idGrupo } = filters;

    return await this.prisma.obras.findMany({
      where: {
        id_status: { notIn: [2, 3, 4] },
        tipos: {
          id_grupo: idGrupo && idGrupo.length > 0 ? { in: idGrupo } : undefined,
        },
        municipios: {
          id_regional:
            idRegional && idRegional.length > 0
              ? { in: idRegional }
              : undefined,
        },
        id_turma:
          idParceira && idParceira.length > 0 ? { in: idParceira } : undefined,
        id_tipo: idTipo && idTipo.length > 0 ? { in: idTipo } : undefined,
      },
      select: {
        ovnota: true,
        ordem_dci: true,
        ordem_dca: true,
        ordem_dcd: true,
        ordem_dcim: true,
        mo_planejada: true,
        mo_pend: true,
        executado: true,
        id_turma: true,
        turmas: { select: { turma: true } },
        tipos: {
          select: { id_grupo: true, grupos: { select: { grupo: true } } },
        },
      },
    });
  }

  async getContractValue(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetContractValueResponse[]> {
    const { idRegional, idParceira } = filters;

    return await this.prisma.valores_contratos.findMany({
      where: {
        id_turma:
          idParceira && idParceira.length > 0 ? { in: idParceira } : undefined,
        turmas: {
          id_regional:
            idRegional && idRegional.length > 0
              ? { in: idRegional }
              : undefined,
        },
      },
    });
  }
}
