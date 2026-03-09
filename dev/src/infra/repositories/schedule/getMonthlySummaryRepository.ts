import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import {
  GetMonthlySummaryInterface,
  GetSecondMonthlySummaryInterface,
} from 'src/interface/types/schedule/getMonthlySummaryInterface';
import * as moment from 'moment';

import { Injectable } from '@nestjs/common';

import { IGetMonthlySummaryRepository } from '../../../domain/repositories/schedule/IGetMonthlySummaryRepository';

@Injectable()
export class GetMonthlySummaryRepository implements IGetMonthlySummaryRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetMonthlySummaryInterface[]> {
    const { dataFinal, dataInicial, idRegional, idParceira, idTipo, idGrupo } =
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
          select: { mo_planejada: true },
        },
      },
      orderBy: { data_prog: 'asc' },
    });
  }

  async getSecondSummary(
    filters: GetMonthlySummaryDTO,
  ): Promise<GetSecondMonthlySummaryInterface[]> {
    const { dataFinal, dataInicial, idGrupo, idParceira, idRegional, idTipo } =
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
        mo_planejada: true,
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
