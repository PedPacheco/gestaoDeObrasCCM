import moment from 'moment';

import { Prisma } from '@prisma/client';
import { DashboardFiltersDTO } from 'src/interface/dtos/dashboardDTO';

export class DashboardFiltersBuilder {
  static buildObrasWhere(
    filters: DashboardFiltersDTO,
    dateField: keyof Prisma.obrasWhereInput = 'entrada',
  ): Prisma.obrasWhereInput {
    const { dataInicial, dataFinal, idGrupo, idParceira, idRegional, idTipo } =
      filters;

    return {
      [dateField]:
        dataInicial && dataFinal
          ? {
              gte: moment
                .utc(dataInicial, 'DD/MM/YYYY')
                .startOf('day')
                .toDate(),

              lte: moment.utc(dataFinal, 'DD/MM/YYYY').endOf('day').toDate(),
            }
          : undefined,

      tipos: {
        id_grupo: idGrupo?.length ? { in: idGrupo } : undefined,
      },

      municipios: {
        id_regional: idRegional?.length ? { in: idRegional } : undefined,
      },

      id_turma: idParceira?.length ? { in: idParceira } : undefined,

      id_tipo: idTipo?.length ? { in: idTipo } : undefined,
    };
  }
  static buildSQLWhere(filters: DashboardFiltersDTO, dateField = 'o.entrada') {
    const { dataInicial, dataFinal, idGrupo, idRegional, idParceira, idTipo } =
      filters;

    return Prisma.sql`

    ${
      dataInicial && dataFinal
        ? Prisma.sql`
          AND ${Prisma.raw(dateField)} BETWEEN
            ${moment.utc(dataInicial, 'DD/MM/YYYY').startOf('day').toDate()}
          AND
            ${moment.utc(dataFinal, 'DD/MM/YYYY').endOf('day').toDate()}
        `
        : Prisma.empty
    }

    ${
      idGrupo?.length
        ? Prisma.sql`
          AND tp.id_grupo IN (${Prisma.join(idGrupo)})
        `
        : Prisma.empty
    }

    ${
      idRegional?.length
        ? Prisma.sql`
          AND m.id_regional IN (${Prisma.join(idRegional)})
        `
        : Prisma.empty
    }

    ${
      idParceira?.length
        ? Prisma.sql`
          AND o.id_turma IN (${Prisma.join(idParceira)})
        `
        : Prisma.empty
    }

    ${
      idTipo?.length
        ? Prisma.sql`
          AND o.id_tipo IN (${Prisma.join(idTipo)})
        `
        : Prisma.empty
    }
  `;
  }
}
