import moment from 'moment';
import { IGetMonthlySummaryForecastRepository } from 'src/domain/repositories/schedule/IGetMonthlySummaryForecastRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import {
  GetCapexPlanInterface,
  GetMonthlySummaryForecastInterface,
} from 'src/interface/types/schedule/monthlySummaryForecastInterface';

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
        equipe_linha_morta: true,
        equipe_linha_viva: true,
        equipe_regularizacao: true,
        obras: {
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
            executado: true,
            turmas: { select: { turma: true } },
            tipos: { select: { grupos: { select: { grupo: true } } } },
          },
        },
      },
      orderBy: { data_prog: 'asc' },
    });
  }

  async getCapexPlan(
    filters: GetMonthlySummaryDTO,
    yearPlan: number,
  ): Promise<GetCapexPlanInterface[]> {
    return await this.prisma.plano_capex.findMany({
      where: {
        id_regional:
          filters.idRegional && filters.idRegional.length > 0
            ? { in: filters.idRegional }
            : undefined,
        ano_plano: yearPlan,
      },
      select: {
        regionais: { select: { regional: true } },
        grupos: { select: { grupo: true } },
        ano_plano: true,
        valor_jan: true,
        valor_fev: true,
        valor_mar: true,
        valor_abr: true,
        valor_mai: true,
        valor_jun: true,
        valor_jul: true,
        valor_ago: true,
        valor_set: true,
        valor_out: true,
        valor_nov: true,
        valor_dez: true,
      },
    });
  }
}
