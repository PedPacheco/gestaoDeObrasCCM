import { Injectable } from '@nestjs/common';
import * as moment from 'moment';
import {
  GetEntryOfWorksByDayDTO,
  GetEntryOfWorksDTO,
} from 'src/interface/dtos/entryDto';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class EntryService {
  constructor(private prisma: PrismaService) {}

  async getValuesFromEntry(filters: GetEntryOfWorksDTO) {
    const {
      idGrupo,
      idMunicipio,
      idParceira,
      idRegional,
      idTipo,
      ano,
      idCircuito,
    } = filters;

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
        id_gpm:
          idMunicipio && idMunicipio.length > 0
            ? { in: idMunicipio }
            : undefined,
        id_tipo: idTipo && idTipo.length > 0 ? { in: idTipo } : undefined,
        id_circuito:
          idCircuito && idCircuito.length > 0 ? { in: idCircuito } : undefined,
        id_turma:
          idParceira && idParceira.length > 0 ? { in: idParceira } : undefined,
        municipios: {
          id_regional:
            idRegional && idRegional.length > 0
              ? { in: idRegional }
              : undefined,
        },
        tipos: {
          id_grupo: idGrupo && idGrupo.length > 0 ? { in: idGrupo } : undefined,
        },
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
    console.log(filters);
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
        tipos: {
          id_grupo: idGrupo && idGrupo.length > 0 ? { in: idGrupo } : undefined,
        },
        id_tipo: idTipo && idTipo.length > 0 ? { in: idTipo } : undefined,
        id_turma:
          idParceira && idParceira.length > 0 ? { in: idParceira } : undefined,
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

    let total_obras = 0;
    let total_mo_planejada = 0;
    let total_qtde_planejada = 0;

    const updatedWorks = result.map((item: any) => {
      total_obras++;
      total_mo_planejada += item.mo_planejada;
      total_qtde_planejada += item.qtde_planejada;

      const prazo_fim = new Date(item.entrada);
      prazo_fim.setDate(prazo_fim.getDate() + item.prazo);

      return {
        id: item.id,
        ovnota: item.ovnota,
        pep: item.pep,
        diagrama: item.diagrama,
        ordem_dci: item.ordem_dci,
        ordem_dcd: item.ordem_dcd,
        ordem_dca: item.ordem_dca,
        ordem_dcim: item.ordem_dcim,
        entrada: item.entrada,
        prazo: item.prazo,
        prazo_fim,
        qtde_planejada: item.qtde_planejada,
        mo_planejada: item.mo_planejada,
        observ_obra: item.observ_obra,
        tipos: item.tipos,
        turmas: item.turmas,
        municipios: item.municipios,
      };
    });

    return {
      works: updatedWorks,
      totals: {
        total_obras,
        total_mo_planejada,
        total_qtde_planejada,
      },
    };
  }
}
