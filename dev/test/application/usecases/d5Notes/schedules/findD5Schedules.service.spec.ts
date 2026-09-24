import { D5NoteScheduleMapper } from 'src/application/mappers/d5NotesScheduleMapper';
import { FindD5SchedulesService } from 'src/application/usecases/d5Notes/schedules/findD5Schedules.service';
import { D5NotesSchedulesFiltersDTO } from 'src/interface/dtos/d5NotesDTO';

// ---------------------------------------------------------------------------
// Mock do mapper — o serviço apenas delega a transformação
// ---------------------------------------------------------------------------
jest.mock('src/application/mappers/d5NotesScheduleMapper', () => ({
  D5NoteScheduleMapper: {
    toListItems: jest.fn(),
    toResponseList: jest.fn(),
  },
}));

const mapper = D5NoteScheduleMapper as jest.Mocked<typeof D5NoteScheduleMapper>;

const makeFilters = (
  overrides: Partial<D5NotesSchedulesFiltersDTO> = {},
): D5NotesSchedulesFiltersDTO =>
  ({ ...overrides }) as D5NotesSchedulesFiltersDTO;

describe('FindD5SchedulesService', () => {
  let service: FindD5SchedulesService;

  const repository = {
    get: jest.fn(),
    getTotals: jest.fn(),
    getByD5NoteId: jest.fn(),
  };

  /** Acesso tipado aos métodos privados, para os testar isoladamente. */
  const buildWhere = (filters: D5NotesSchedulesFiltersDTO) =>
    (service as any).buildWhereClause(filters);

  const buildPagination = (page?: number) =>
    (service as any).buildPagination(page);

  beforeEach(() => {
    service = new FindD5SchedulesService(repository as any);

    repository.get.mockResolvedValue([]);
    repository.getTotals.mockResolvedValue({});
    repository.getByD5NoteId.mockResolvedValue([]);
    mapper.toListItems.mockReturnValue([] as any);
    mapper.toResponseList.mockReturnValue([] as any);
  });

  afterEach(() => jest.resetAllMocks());

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  // =========================================================================
  // findD5NotesSchedules
  // =========================================================================
  describe('findD5NotesSchedules', () => {
    it('deve consultar dados e totais e devolver o payload mapeado', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      const totals = { total: 2, executadas: 1 };
      const mapped = [{ id: 1, mapped: true }];

      repository.get.mockResolvedValue(rows);
      repository.getTotals.mockResolvedValue(totals);
      mapper.toListItems.mockReturnValue(mapped as any);

      const result = await service.findD5NotesSchedules(makeFilters());

      expect(repository.get).toHaveBeenCalledWith({}, undefined);
      expect(repository.getTotals).toHaveBeenCalledWith({});
      expect(mapper.toListItems).toHaveBeenCalledWith(rows);
      expect(result).toEqual({ d5Notes: mapped, totals });
    });

    it('deve usar a mesma cláusula where nas duas consultas', async () => {
      await service.findD5NotesSchedules(makeFilters({ idGrupo: [3] }));

      const whereFromGet = repository.get.mock.calls[0][0];
      const whereFromTotals = repository.getTotals.mock.calls[0][0];

      expect(whereFromGet).toEqual(whereFromTotals);
      expect(whereFromGet).toEqual({ id_turma: { in: [3] } });
    });

    it('deve executar as consultas em paralelo', async () => {
      const ordem: string[] = [];
      repository.get.mockImplementation(async () => {
        ordem.push('get:inicio');
        await new Promise((r) => setTimeout(r, 10));
        ordem.push('get:fim');
        return [];
      });
      repository.getTotals.mockImplementation(async () => {
        ordem.push('totals:inicio');
        return {};
      });

      await service.findD5NotesSchedules(makeFilters());

      // totals arranca antes de get terminar => Promise.all
      expect(ordem).toEqual(['get:inicio', 'totals:inicio', 'get:fim']);
    });

    it('deve propagar a paginação quando a página é informada', async () => {
      await service.findD5NotesSchedules(makeFilters({ page: 2 }));

      expect(repository.get).toHaveBeenCalledWith({}, { skip: 400, take: 200 });
    });

    it('deve propagar erros da consulta de dados', async () => {
      repository.get.mockRejectedValue(new Error('falha na consulta'));

      await expect(service.findD5NotesSchedules(makeFilters())).rejects.toThrow(
        'falha na consulta',
      );
    });

    it('deve propagar erros da consulta de totais', async () => {
      repository.getTotals.mockRejectedValue(new Error('falha nos totais'));

      await expect(service.findD5NotesSchedules(makeFilters())).rejects.toThrow(
        'falha nos totais',
      );
    });
  });

  // =========================================================================
  // findByD5NoteId
  // =========================================================================
  describe('findByD5NoteId', () => {
    it('deve devolver as programações mapeadas da nota', async () => {
      const rows = [{ id: 1 }];
      const mapped = [{ id: 1, mapped: true }];

      repository.getByD5NoteId.mockResolvedValue(rows);
      mapper.toResponseList.mockReturnValue(mapped as any);

      const result = await service.findByD5NoteId(10);

      expect(repository.getByD5NoteId).toHaveBeenCalledWith(10);
      expect(mapper.toResponseList).toHaveBeenCalledWith(rows);
      expect(result).toBe(mapped);
    });

    it('deve delegar ao mapper mesmo sem resultados', async () => {
      repository.getByD5NoteId.mockResolvedValue([]);

      await service.findByD5NoteId(10);

      expect(mapper.toResponseList).toHaveBeenCalledWith([]);
    });

    it('deve propagar erros do repositório', async () => {
      repository.getByD5NoteId.mockRejectedValue(new Error('indisponível'));

      await expect(service.findByD5NoteId(10)).rejects.toThrow('indisponível');
    });
  });

  // =========================================================================
  // buildWhereClause
  // =========================================================================
  describe('buildWhereClause', () => {
    it('deve devolver objeto vazio sem filtros', () => {
      expect(buildWhere(makeFilters())).toEqual({});
    });

    describe('intervalo de datas', () => {
      it('deve converter o intervalo para UTC com início e fim de dia', () => {
        const where = buildWhere(
          makeFilters({
            dataInicial: '01/01/2026',
            dataFinal: '31/01/2026',
          } as any),
        );

        expect(where.data_prog.gte.toISOString()).toBe(
          '2026-01-01T00:00:00.000Z',
        );
        expect(where.data_prog.lte.toISOString()).toBe(
          '2026-01-31T23:59:59.999Z',
        );
      });

      it.each([
        ['apenas dataInicial', { dataInicial: '01/01/2026' }],
        ['apenas dataFinal', { dataFinal: '31/01/2026' }],
      ])('deve ignorar o intervalo com %s', (_label, filters) => {
        expect(
          buildWhere(makeFilters(filters as any)).data_prog,
        ).toBeUndefined();
      });

      it('deve aceitar intervalo de um único dia', () => {
        const where = buildWhere(
          makeFilters({
            dataInicial: '15/03/2026',
            dataFinal: '15/03/2026',
          } as any),
        );

        expect(where.data_prog.gte.toISOString()).toBe(
          '2026-03-15T00:00:00.000Z',
        );
        expect(where.data_prog.lte.toISOString()).toBe(
          '2026-03-15T23:59:59.999Z',
        );
      });
    });

    describe('filtros de lista', () => {
      it('deve aninhar idRegional sob municipios', () => {
        expect(buildWhere(makeFilters({ idRegional: [1, 2] } as any))).toEqual({
          municipios: { id_regional: { in: [1, 2] } },
        });
      });

      it.each([
        ['idMunicipio', 'id_municipio'],
        ['idGrupo', 'id_turma'],
        ['idTipo', 'id_tipo'],
        ['idParceira', 'id_parceira'],
      ])('deve mapear %s para %s', (filterKey, columnKey) => {
        const where = buildWhere(makeFilters({ [filterKey]: [5] } as any));
        expect(where[columnKey]).toEqual({ in: [5] });
      });

      it.each(['idRegional', 'idMunicipio', 'idGrupo', 'idTipo', 'idParceira'])(
        'deve ignorar %s quando é um array vazio',
        (filterKey) => {
          expect(buildWhere(makeFilters({ [filterKey]: [] } as any))).toEqual(
            {},
          );
        },
      );

      it.each(['idRegional', 'idMunicipio', 'idGrupo', 'idTipo', 'idParceira'])(
        'deve ignorar %s quando é undefined (optional chaining)',
        (key) => {
          expect(buildWhere(makeFilters({ [key]: undefined } as any))).toEqual(
            {},
          );
        },
      );
    });

    it('deve combinar todos os filtros em simultâneo', () => {
      const where = buildWhere(
        makeFilters({
          dataInicial: '01/01/2026',
          dataFinal: '31/01/2026',
          idRegional: [1],
          idMunicipio: [2],
          idGrupo: [3],
          idTipo: [4],
          idParceira: [5],
        } as any),
      );

      expect(where).toMatchObject({
        municipios: { id_regional: { in: [1] } },
        id_municipio: { in: [2] },
        id_turma: { in: [3] },
        id_tipo: { in: [4] },
        id_parceira: { in: [5] },
      });
      expect(where.data_prog).toBeDefined();
    });

    it('deve produzir um novo objeto a cada chamada', () => {
      expect(buildWhere(makeFilters())).not.toBe(buildWhere(makeFilters()));
    });
  });

  // =========================================================================
  // buildPagination
  // =========================================================================
  describe('buildPagination', () => {
    it('deve devolver undefined quando a página não é informada', () => {
      expect(buildPagination(undefined)).toBeUndefined();
    });

    it.each([
      [0, { skip: 0, take: 200 }],
      [1, { skip: 200, take: 200 }],
      [5, { skip: 1000, take: 200 }],
    ])('deve calcular o offset da página %i', (page, expected) => {
      expect(buildPagination(page as number)).toEqual(expected);
    });

    it('deve tratar a página 0 como válida (não confundir com undefined)', () => {
      expect(buildPagination(0)).not.toBeUndefined();
    });
  });
});
