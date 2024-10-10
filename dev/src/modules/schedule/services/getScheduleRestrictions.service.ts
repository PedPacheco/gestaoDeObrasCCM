import { Injectable } from '@nestjs/common';
import { GetValueWeeklyScheduleDTO } from 'src/config/dto/scheduleDTO';
import { PrismaService } from 'src/config/prisma/prisma.service';
import * as moment from 'moment';

@Injectable()
export class GetScheduleRestrictionsService {
  constructor(private prisma: PrismaService) {}

  async getRestrictions(filters: GetValueWeeklyScheduleDTO) {
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
      where: {
        programacoes: {
          some: {
            data_prog: {
              gte: moment(dataInicial, 'DD/MM/YYYY').toDate(),
              lte: moment(dataFinal, 'DD/MM/YYYY').toDate(),
            },
          },
        },
        municipios: { id_regional: idRegional || undefined },
        id_turma: idParceira || undefined,
        id_tipo: idTipo || undefined,
        id_gpm: idMunicipio || undefined,
        tipos: { id_grupo: idGrupo || undefined },
        executado: executado ? null : { not: null },
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
            data_prog: true,
            prog: true,
            exec: true,
            observacao_restricao: true,
            id_restricao_prog1: true,
            responsabilidade1: true,
            nome_responsavel: true,
            area_responsavel1: true,
            status_restricao1: true,
            data_resolucao1: true,
            id_restricao_prog2: true,
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
          select: { mun: true, regionais: { select: { regional: true } } },
        },
        tipos: { select: { tipo_obra: true } },
        turmas: { select: { turma: true } },
      },
    });
  }
}
