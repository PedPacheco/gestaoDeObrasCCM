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

    console.log(executado ? null : { not: null });

    const response = await this.prisma.obras.findMany({
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
        municipios: { id_regional: idRegional || undefined },
        id_turma: idParceira || undefined,
        id_tipo: idTipo || undefined,
        id_gpm: idMunicipio || undefined,
        tipos: { id_grupo: idGrupo || undefined },
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
            programacoes_restricao_prog1: {
              select: { restricao: true },
            },
            responsabilidade1: true,
            nome_responsavel: true,
            area_responsavel1: true,
            status_restricao1: true,
            data_resolucao1: true,
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

    const result = response
      .flatMap((work) =>
        work.programacoes.map((programacao) => ({
          id: work.id,
          ovnota: work.ovnota,
          mun: work.municipios.mun,
          tipo: work.tipos.tipo_obra,
          parceira: work.turmas.turma,
          executado: work.executado,
          data_prog: programacao.data_prog,
          prog: programacao.prog,
          exec: programacao.exec,
          observacao_restricao: programacao.observacao_restricao,
          restricao_prog1: programacao.programacoes_restricao_prog1.restricao,
          responsabilidade1: programacao.responsabilidade1,
          nome_responsavel: programacao.nome_responsavel,
          area_responsavel1: programacao.area_responsavel1,
          status_restricao1: programacao.status_restricao1,
          data_resolucao1: programacao.data_resolucao1,
          restricao_prog2: programacao.programacoes_restricao_prog2.restricao,
          responsabilidade2: programacao.responsabilidade2,
          nome_responsavel2: programacao.nome_responsavel2,
          area_responsavel2: programacao.area_responsavel2,
          status_restricao2: programacao.status_restricao2,
          data_resolucao2: programacao.data_resolucao2,
        })),
      )
      .sort((a, b) => moment(a.data_prog).diff(moment(b.data_prog)));

    return result;
  }
}
