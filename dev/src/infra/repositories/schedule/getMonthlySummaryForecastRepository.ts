import * as moment from 'moment';
import { IGetMonthlySummaryForecastRepository } from 'src/domain/repositories/schedule/IGetMonthlySummaryForecastRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import {
  GetMonthlySummaryForecastInterface,
  GetSecondMonthlySummaryForecastInterface,
} from 'src/interface/types/schedule/getMonthlySummaryForecastInterface';

import { Injectable } from '@nestjs/common';

@Injectable()
export class GetMonthlySummaryForecastRepository implements IGetMonthlySummaryForecastRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetMonthlySummaryForecastInterface[]> {
    const { dataInicial, dataFinal, idRegional, idParceira, idTipo, idGrupo } =
      filters;

    return await this.prisma.programacoes.findMany({
      where: {
        data_prog: {
          gte: moment.utc(dataInicial, 'DD/MM/YYYY').toDate(),
          lt: moment.utc(dataFinal, 'DD/MM/YYYY').toDate(),
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
        obras: {
          select: {
            capex_mat_pend: true,
            capex_mat_plan: true,
            capex_mo_pend: true,
            capex_mo_plan: true,
          },
        },
      },
      orderBy: { data_prog: 'asc' },
    });
  }

  async getSecondSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetSecondMonthlySummaryForecastInterface[]> {
    const { dataInicial, dataFinal, idGrupo, idParceira, idRegional, idTipo } =
      filters;

    return await this.prisma.obras.findMany({
      where: {
        programacoes: {
          some: {
            data_prog: {
              gte: moment.utc(dataInicial, 'DD/MM/YYYY').toDate(),
              lt: moment.utc(dataFinal, 'DD/MM/YYYY').toDate(),
            },
          },
        },
        tipos: {
          id_grupo: idGrupo ? { in: idGrupo } : undefined,
        },
        municipios: {
          id_regional: idRegional ? { in: idRegional } : undefined,
        },
        id_turma: idParceira ? { in: idParceira } : undefined,
        id_tipo: idTipo ? { in: idTipo } : undefined,
      },
      select: {
        ovnota: true,
        ordem_dci: true,
        ordem_dca: true,
        ordem_dcd: true,
        ordem_dcim: true,
        capex_mat_pend: true,
        capex_mat_plan: true,
        capex_mo_pend: true,
        capex_mo_plan: true,
        turmas: { select: { turma: true } },
        tipos: { select: { grupos: { select: { grupo: true } } } },
        programacoes: {
          where: {
            data_prog: {
              gte: moment.utc(dataInicial, 'DD/MM/YYYY').toDate(),
              lt: moment.utc(dataFinal, 'DD/MM/YYYY').toDate(),
            },
          },
          select: { data_prog: true, prog: true, exec: true },
        },
      },
    });
  }
}
