import * as moment from 'moment';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';

import { Injectable } from '@nestjs/common';
import { IGetMonthlySummaryForecastRepository } from 'src/domain/repositories/schedule/IGetMonthlySummaryForecastRepository';
import {
  GetMonthlySummaryForecastInterface,
  GetSecondMonthlySummaryForecastInterface,
} from 'src/interface/types/schedule/getMonthlySummaryForecastInterface';

@Injectable()
export class GetMonthlySummaryForecastRepository implements IGetMonthlySummaryForecastRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetMonthlySummaryForecastInterface[]> {
    const { date, idRegional, idParceira, idTipo, idGrupo } = filters;

    const month: number = Number(date?.split('/')[0]);
    const year: number = Number(date?.split('/')[1]);

    const monthInitial = moment
      .utc([year, month - 1])
      .startOf('month')
      .toDate();
    const monthFinal = moment
      .utc([year, month - 1])
      .add(1, 'month')
      .startOf('month')
      .toDate();

    return await this.prisma.programacoes.findMany({
      where: {
        data_prog: {
          gte: monthInitial,
          lt: monthFinal,
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
    const { date, idGrupo, idParceira, idRegional, idTipo } = filters;

    const month: number = Number(date?.split('/')[0]);
    const year: number = Number(date?.split('/')[1]);

    const monthInitial = moment
      .utc([year, month - 1])
      .startOf('month')
      .toDate();
    const monthFinal = moment
      .utc([year, month - 1])
      .add(1, 'month')
      .startOf('month')
      .toDate();

    return await this.prisma.obras.findMany({
      where: {
        programacoes: {
          some: { data_prog: { gte: monthInitial, lt: monthFinal } },
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
              gte: monthInitial,
              lt: monthFinal,
            },
          },
          select: { data_prog: true, prog: true, exec: true },
        },
      },
    });
  }
}
