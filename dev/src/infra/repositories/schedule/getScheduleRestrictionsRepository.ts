import * as moment from 'moment';
import { IGetScheduleRestrictionsRepository } from 'src/domain/repositories/schedule/IGetScheduleRestrictionsRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetValueWeeklyScheduleDTO } from 'src/interface/dtos/scheduleDTO';
import { GetScheduleRestrictions } from 'src/interface/types/schedule/getScheduleRestrictionsInterface';

import { Injectable } from '@nestjs/common';

@Injectable()
export class GetScheduleRestrictionsRespository
  implements IGetScheduleRestrictionsRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async getRestrictions(
    filters: GetValueWeeklyScheduleDTO,
  ): Promise<GetScheduleRestrictions[]> {
    const {
      dataFinal,
      dataInicial,
      executado,
      idGrupo,
      idMunicipio,
      idParceira,
      idRegional,
      idTipo,
    } = filters;

    return await this.prisma.obras.findMany({
      relationLoadStrategy: 'join',
      where: {
        programacoes: {
          some: {
            exec: executado ? { not: null } : null,
            data_prog: {
              gte: moment(dataInicial, 'DD/MM/YYYY').toDate(),
              lte: moment(dataFinal, 'DD/MM/YYYY').toDate(),
            },
          },
        },
        municipios: {
          id_regional:
            idRegional && idRegional.length > 0
              ? { in: idRegional }
              : undefined,
        },
        id_gpm:
          idMunicipio && idMunicipio.length > 0
            ? { in: idMunicipio }
            : undefined,
        id_turma:
          idParceira && idMunicipio.length > 0 ? { in: idParceira } : undefined,
        id_tipo: idTipo && idTipo.length > 0 ? { in: idTipo } : undefined,
        tipos: {
          id_grupo: idGrupo && idGrupo.length > 0 ? { in: idGrupo } : undefined,
        },
      },
      select: {
        id: true,
        ovnota: true,
        diagrama: true,
        ordem_dci: true,
        ordem_dcim: true,
        executado: true,
        programacoes: {
          select: {
            id: true,
            data_prog: true,
            prog: true,
            exec: true,
            observacao_restricao: true,
            id_restricao_prog1: true,
            programacoes_restricao_prog1: {
              select: { restricao: true },
            },
            responsabilidade1: true,
            nome_responsavel: true,
            area_responsavel1: true,
            status_restricao1: true,
            data_resolucao1: true,
            id_restricao_prog2: true,
            programacoes_restricao_prog2: {
              select: { restricao: true },
            },
            responsabilidade2: true,
            nome_responsavel2: true,
            area_responsavel2: true,
            status_restricao2: true,
            data_resolucao2: true,
          },
          where: {
            data_prog: {
              gte: moment(dataInicial, 'DD/MM/YYYY').toDate(),
              lte: moment(dataFinal, 'DD/MM/YYYY').toDate(),
            },
          },
        },
        municipios: {
          select: { mun: true },
        },
        tipos: { select: { tipo_obra: true } },
        turmas: { select: { turma: true } },
      },
    });
  }
}
