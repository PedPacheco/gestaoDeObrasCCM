import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import {
  GetEntryOfWorksByDayDTO,
  GetEntryOfWorksDTO,
} from 'src/config/dto/entryDto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { calculateTotals } from 'src/utils/calculateTotals';

@Injectable()
export class EntryService {
  constructor(private prisma: PrismaService) {}

  async getValuesFromEntry(filters: GetEntryOfWorksDTO) {
    const { idGrupo, idMunicipio, idParceira, idRegional, idTipo, ano } =
      filters;

    const monthAbbreviations: { [key: number]: string } = {
      0: 'jan',
      1: 'fev',
      2: 'mar',
      3: 'abr',
      4: 'mai',
      5: 'jun',
      6: 'jul',
      7: 'ago',
      8: 'set',
      9: 'out',
      10: 'nov',
      11: 'dez',
    };

    const obras = await this.prisma.obras.findMany({
      where: {
        id_status: { not: 3 },
        entrada: {
          gte: new Date(`${ano}-01-01`),
          lte: new Date(`${ano}-12-31`),
        },
        id_gpm: idMunicipio || undefined,
        id_tipo: idTipo || undefined,
        id_circuito: idGrupo || undefined,
        id_turma: idParceira || undefined,
        municipios: { id_regional: idRegional || undefined },
        tipos: { id_grupo: idGrupo || undefined },
      },
      select: {
        ovnota: true,
        mo_final: true,
        mo_planejada: true,
        entrada: true,
        tipos: {
          select: {
            tipo_obra: true,
            grupos: {
              select: {
                grupo: true,
              },
            },
          },
        },
      },
      orderBy: { tipos: { grupos: { grupo: 'asc' } } },
    });

    const result = obras.reduce((acc, obra) => {
      const tipo = obra.tipos.tipo_obra;
      const grupo = obra.tipos.grupos.grupo.substring(0, 3);

      if (!acc[tipo]) {
        acc[tipo] = {
          tipo,
          grupo,
          total_entrada: 0,
          total_entrada_qtde: 0,
          ...Object.keys(monthAbbreviations).reduce((obj, month) => {
            const key = monthAbbreviations[month];
            obj[`${key}_entrada`] = 0;
            obj[`${key}_entrada_qtde`] = 0;
            return obj;
          }, {}),
        };
      }

      const month = obra.entrada.getUTCMonth();
      const monthKey = monthAbbreviations[month];
      const value = obra.mo_final !== null ? obra.mo_final : obra.mo_planejada;

      const grupoData = acc[tipo];

      grupoData[`${monthKey}_entrada`] += value;
      grupoData[`${monthKey}_entrada_qtde`] += 1;
      grupoData.total_entrada += obra.mo_planejada;
      grupoData.total_entrada_qtde += 1;

      return acc;
    }, {});

    return Object.values(result);
  }

  async getEntryOfWorksByDay(filters: GetEntryOfWorksByDayDTO) {
    const {
      idGrupo,
      idMunicipio,
      idParceira,
      idRegional,
      idTipo,
      data,
      tipoFiltro,
    } = filters;

    let dateRange: Record<string, Date>;

    switch (tipoFiltro) {
      case 'day':
        dateRange = { equals: data };
        break;
      case 'month':
        dateRange = {
          gte: moment(data).startOf('month').toDate(),
          lte: moment(data).endOf('month').startOf('day').toDate(),
        };
        break;
    }

    const result = await this.prisma.obras.findMany({
      where: {
        entrada: dateRange,
        municipios: { id_regional: idRegional || undefined },
        id_gpm: idMunicipio || undefined,
        tipos: { id_grupo: idGrupo || undefined },
        id_tipo: idTipo || undefined,
        id_turma: idParceira || undefined,
      },
      select: {
        id: true,
        ovnota: true,
        pep: true,
        diagrama: true,
        ordem_dci: true,
        ordem_dcd: true,
        ordem_dca: true,
        ordem_dcim: true,
        entrada: true,
        prazo: true,
        qtde_planejada: true,
        mo_planejada: true,
        observ_obra: true,
        tipos: {
          select: { tipo_obra: true },
        },
        turmas: {
          select: { turma: true },
        },
        municipios: {
          select: { mun: true },
        },
      },
      orderBy: { entrada: 'asc' },
    });

    return calculateTotals(result, {
      total_mo_planejada: true,
      total_qtde_planejada: true,
    });
  }
}
