import moment from 'moment';

import { DashboardFiltersBuilder } from 'src/utils/dashboardFilters.builder';

describe('DashboardFiltersBuilder', () => {
  describe('buildObrasWhere', () => {
    it('should build empty filters when no params are provided', () => {
      const result = DashboardFiltersBuilder.buildObrasWhere({} as any);

      expect(result).toEqual({
        entrada: undefined,
        tipos: {
          id_grupo: undefined,
        },
        municipios: {
          id_regional: undefined,
        },
        id_turma: undefined,
        id_tipo: undefined,
      });
    });

    it('should build date filter using default field (entrada)', () => {
      const filters = {
        dataInicial: '01/01/2025',
        dataFinal: '31/01/2025',
      } as any;

      const result = DashboardFiltersBuilder.buildObrasWhere(filters);

      expect(result.entrada).toEqual({
        gte: moment.utc('01/01/2025', 'DD/MM/YYYY').startOf('day').toDate(),

        lte: moment.utc('31/01/2025', 'DD/MM/YYYY').endOf('day').toDate(),
      });
    });

    it('should build date filter using custom field', () => {
      const filters = {
        dataInicial: '01/02/2025',
        dataFinal: '28/02/2025',
      } as any;

      const result = DashboardFiltersBuilder.buildObrasWhere(
        filters,
        'data_conclusao',
      );

      expect(result).toEqual({
        data_conclusao: {
          gte: moment.utc('01/02/2025', 'DD/MM/YYYY').startOf('day').toDate(),

          lte: moment.utc('28/02/2025', 'DD/MM/YYYY').endOf('day').toDate(),
        },

        tipos: {
          id_grupo: undefined,
        },

        municipios: {
          id_regional: undefined,
        },

        id_turma: undefined,
        id_tipo: undefined,
      });
    });

    it('should apply idGrupo filter', () => {
      const result = DashboardFiltersBuilder.buildObrasWhere({
        idGrupo: [1, 2],
      } as any);

      expect(result.tipos).toEqual({
        id_grupo: {
          in: [1, 2],
        },
      });
    });

    it('should apply idRegional filter', () => {
      const result = DashboardFiltersBuilder.buildObrasWhere({
        idRegional: [10, 20],
      } as any);

      expect(result.municipios).toEqual({
        id_regional: {
          in: [10, 20],
        },
      });
    });

    it('should apply idParceira filter', () => {
      const result = DashboardFiltersBuilder.buildObrasWhere({
        idParceira: [100],
      } as any);

      expect(result.id_turma).toEqual({
        in: [100],
      });
    });

    it('should apply idTipo filter', () => {
      const result = DashboardFiltersBuilder.buildObrasWhere({
        idTipo: [7, 8],
      } as any);

      expect(result.id_tipo).toEqual({
        in: [7, 8],
      });
    });

    it('should apply all filters together', () => {
      const filters = {
        dataInicial: '01/01/2025',
        dataFinal: '31/01/2025',
        idGrupo: [1],
        idRegional: [2],
        idParceira: [3],
        idTipo: [4],
      } as any;

      const result = DashboardFiltersBuilder.buildObrasWhere(filters);

      expect(result).toEqual({
        entrada: {
          gte: moment.utc('01/01/2025', 'DD/MM/YYYY').startOf('day').toDate(),

          lte: moment.utc('31/01/2025', 'DD/MM/YYYY').endOf('day').toDate(),
        },

        tipos: {
          id_grupo: {
            in: [1],
          },
        },

        municipios: {
          id_regional: {
            in: [2],
          },
        },

        id_turma: {
          in: [3],
        },

        id_tipo: {
          in: [4],
        },
      });
    });

    it('should ignore empty arrays', () => {
      const result = DashboardFiltersBuilder.buildObrasWhere({
        idGrupo: [],
        idRegional: [],
        idParceira: [],
        idTipo: [],
      } as any);

      expect(result).toEqual({
        entrada: undefined,

        tipos: {
          id_grupo: undefined,
        },

        municipios: {
          id_regional: undefined,
        },

        id_turma: undefined,
        id_tipo: undefined,
      });
    });

    it('should not apply date filter when only dataInicial exists', () => {
      const result = DashboardFiltersBuilder.buildObrasWhere({
        dataInicial: '01/01/2025',
      } as any);

      expect(result.entrada).toBeUndefined();
    });

    it('should not apply date filter when only dataFinal exists', () => {
      const result = DashboardFiltersBuilder.buildObrasWhere({
        dataFinal: '31/01/2025',
      } as any);

      expect(result.entrada).toBeUndefined();
    });
  });

  describe('buildSQLWhere', () => {
    const getSqlString = (query: any): string => {
      if (typeof query === 'string') return query;

      if (query?.sql) {
        if (Array.isArray(query.sql)) {
          return query.sql.join(' ');
        }

        return query.sql;
      }

      return String(query);
    };

    it('should build empty SQL when no filters are provided', () => {
      const result = DashboardFiltersBuilder.buildSQLWhere({} as any);

      const sql = getSqlString(result);

      expect(sql).not.toContain('BETWEEN');
      expect(sql).not.toContain('tp.id_grupo');
      expect(sql).not.toContain('m.id_regional');
      expect(sql).not.toContain('o.id_turma');
      expect(sql).not.toContain('o.id_tipo');
    });

    it('should apply date filter using default field', () => {
      const result = DashboardFiltersBuilder.buildSQLWhere({
        dataInicial: '01/01/2025',
        dataFinal: '31/01/2025',
      } as any);

      const sql = getSqlString(result);

      expect(sql).toContain('o.entrada');
      expect(sql).toContain('BETWEEN');
    });

    it('should apply date filter using custom field', () => {
      const result = DashboardFiltersBuilder.buildSQLWhere(
        {
          dataInicial: '01/01/2025',
          dataFinal: '31/01/2025',
        } as any,
        'o.data_conclusao',
      );

      const sql = getSqlString(result);

      expect(sql).toContain('o.data_conclusao');
      expect(sql).toContain('BETWEEN');
    });

    it('should apply idGrupo filter', () => {
      const result = DashboardFiltersBuilder.buildSQLWhere({
        idGrupo: [1, 2],
      } as any);

      const sql = getSqlString(result);

      expect(sql).toContain('tp.id_grupo IN');
    });

    it('should apply idRegional filter', () => {
      const result = DashboardFiltersBuilder.buildSQLWhere({
        idRegional: [10],
      } as any);

      const sql = getSqlString(result);

      expect(sql).toContain('m.id_regional IN');
    });

    it('should apply idParceira filter', () => {
      const result = DashboardFiltersBuilder.buildSQLWhere({
        idParceira: [5],
      } as any);

      const sql = getSqlString(result);

      expect(sql).toContain('o.id_turma IN');
    });

    it('should apply idTipo filter', () => {
      const result = DashboardFiltersBuilder.buildSQLWhere({
        idTipo: [7],
      } as any);

      const sql = getSqlString(result);

      expect(sql).toContain('o.id_tipo IN');
    });

    it('should apply all SQL filters together', () => {
      const result = DashboardFiltersBuilder.buildSQLWhere({
        dataInicial: '01/01/2025',
        dataFinal: '31/01/2025',
        idGrupo: [1],
        idRegional: [2],
        idParceira: [3],
        idTipo: [4],
      } as any);

      const sql = getSqlString(result);

      expect(sql).toContain('BETWEEN');

      expect(sql).toContain('tp.id_grupo IN');

      expect(sql).toContain('m.id_regional IN');

      expect(sql).toContain('o.id_turma IN');

      expect(sql).toContain('o.id_tipo IN');
    });

    it('should ignore empty arrays in SQL filters', () => {
      const result = DashboardFiltersBuilder.buildSQLWhere({
        idGrupo: [],
        idRegional: [],
        idParceira: [],
        idTipo: [],
      } as any);

      const sql = getSqlString(result);

      expect(sql).not.toContain('tp.id_grupo IN');

      expect(sql).not.toContain('m.id_regional IN');

      expect(sql).not.toContain('o.id_turma IN');

      expect(sql).not.toContain('o.id_tipo IN');
    });

    it('should not apply date filter when only dataInicial exists', () => {
      const result = DashboardFiltersBuilder.buildSQLWhere({
        dataInicial: '01/01/2025',
      } as any);

      const sql = getSqlString(result);

      expect(sql).not.toContain('BETWEEN');
    });

    it('should not apply date filter when only dataFinal exists', () => {
      const result = DashboardFiltersBuilder.buildSQLWhere({
        dataFinal: '31/01/2025',
      } as any);

      const sql = getSqlString(result);

      expect(sql).not.toContain('BETWEEN');
    });
  });
});
