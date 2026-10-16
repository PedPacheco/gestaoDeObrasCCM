import { D5NoteScheduleMapper } from 'src/application/mappers/d5NotesScheduleMapper';
import { FindD5SchedulesService } from 'src/application/usecases/d5Notes/schedules/findD5Schedules.service';
import { ID5NotesSchedulesRepository } from 'src/domain/repositories/d5Notes/ID5NotesSchedulesRepository';
import { D5NotesSchedulesFiltersDTO } from 'src/interface/dtos/d5NotesDTO';

// Noon UTC: yields the same calendar day in virtually any timezone
const FIXED_NOW = new Date('2026-10-16T12:00:00.000Z');
const TODAY = new Date('2026-10-16T00:00:00.000Z');

const DEFAULT_STATE_CONDITIONS = [
  { exec: null },
  { data_prog: { gte: TODAY } },
  { OR: [{ reprovada: false }, { reprovada: null }] },
];
const DEFAULT_WHERE = { AND: DEFAULT_STATE_CONDITIONS };

const makeFilters = (
  overrides: Partial<D5NotesSchedulesFiltersDTO> = {},
): D5NotesSchedulesFiltersDTO =>
  ({ ...overrides }) as D5NotesSchedulesFiltersDTO;

const makeRepository = () =>
  ({
    get: jest.fn(),
    getTotals: jest.fn(),
    getByD5NoteId: jest.fn(),
    findRejections: jest.fn(),
  }) as unknown as jest.Mocked<ID5NotesSchedulesRepository>;

describe('FindD5SchedulesService', () => {
  let service: FindD5SchedulesService;
  let repository: jest.Mocked<ID5NotesSchedulesRepository>;
  let toListItems: jest.SpyInstance;
  let toResponseList: jest.SpyInstance;
  let toRejectionsResponseList: jest.SpyInstance;

  const whereFromGet = () => repository.get.mock.calls[0][0];

  beforeEach(() => {
    jest.useFakeTimers({
      now: FIXED_NOW,
      doNotFake: ['nextTick', 'setImmediate', 'queueMicrotask'],
    });

    repository = makeRepository();
    repository.get.mockResolvedValue([]);
    repository.getTotals.mockResolvedValue([]);
    repository.getByD5NoteId.mockResolvedValue([]);
    repository.findRejections.mockResolvedValue([]);

    toListItems = jest
      .spyOn(D5NoteScheduleMapper, 'toListItems')
      .mockReturnValue([] as any);
    toResponseList = jest
      .spyOn(D5NoteScheduleMapper, 'toResponseList')
      .mockReturnValue([] as any);
    toRejectionsResponseList = jest
      .spyOn(D5NoteScheduleMapper, 'toRejectionsResponseList')
      .mockReturnValue([] as any);

    service = new FindD5SchedulesService(repository);
  });

  afterEach(() => {
    jest.restoreAllMocks(); // restores the original mapper methods
    jest.useRealTimers();
  });

  // ---------------------------------------------------------------------------
  describe('findD5NotesSchedules', () => {
    it('should query data and totals and return the mapped payload', async () => {
      const rows = [{ id: 1 }, { id: 2 }];
      const notes = [{ noteId: 2, moRetida: 5245, progs: [50, 50] }];
      const mapped = [{ id: 1, mapped: true }];

      repository.get.mockResolvedValue(rows as any);
      repository.getTotals.mockResolvedValue(notes as any);
      toListItems.mockReturnValue(mapped);

      const result = await service.findD5NotesSchedules(makeFilters());

      expect(repository.get).toHaveBeenCalledWith(DEFAULT_WHERE, undefined);
      expect(repository.getTotals).toHaveBeenCalledWith(DEFAULT_WHERE);
      expect(toListItems).toHaveBeenCalledWith(rows);
      expect(result).toEqual({
        d5Notes: mapped,
        totals: { total: 2, totalMoRetida: 5245, totalMoProgramada: 5245 },
      });
    });

    it('should use the same where clause in both queries', async () => {
      await service.findD5NotesSchedules(makeFilters({ idGrupo: [3] }));

      expect(repository.get.mock.calls[0][0]).toEqual(
        repository.getTotals.mock.calls[0][0],
      );
    });

    it('should run both queries in parallel', async () => {
      const order: string[] = [];
      let resolveGet!: (value: unknown[]) => void;

      repository.get.mockImplementation(() => {
        order.push('get:start');
        return new Promise<any>((resolve) => (resolveGet = resolve)).then(
          (v) => {
            order.push('get:end');
            return v;
          },
        );
      });
      repository.getTotals.mockImplementation(async () => {
        order.push('totals:start');
        return [];
      });

      const promise = service.findD5NotesSchedules(makeFilters());
      expect(order).toEqual(['get:start', 'totals:start']);

      resolveGet([]);
      await promise;

      expect(order).toEqual(['get:start', 'totals:start', 'get:end']);
    });

    it('should propagate errors from the data query', async () => {
      repository.get.mockRejectedValue(new Error('query failed'));

      await expect(service.findD5NotesSchedules(makeFilters())).rejects.toThrow(
        'query failed',
      );
    });

    it('should propagate errors from the totals query', async () => {
      repository.getTotals.mockRejectedValue(new Error('totals failed'));

      await expect(service.findD5NotesSchedules(makeFilters())).rejects.toThrow(
        'totals failed',
      );
    });
  });

  // ---------------------------------------------------------------------------
  describe('where clause - state filters', () => {
    it('should apply the default filter (scheduled from today onwards) when no state filter is given', async () => {
      await service.findD5NotesSchedules(makeFilters());

      expect(whereFromGet()).toEqual(DEFAULT_WHERE);
    });

    it('should filter only rejected schedules', async () => {
      await service.findD5NotesSchedules(makeFilters({ reprovada: true }));

      expect(whereFromGet()).toEqual({ AND: [{ reprovada: true }] });
    });

    it('should filter only executed schedules', async () => {
      await service.findD5NotesSchedules(makeFilters({ executado: true }));

      expect(whereFromGet()).toEqual({ AND: [{ exec: { not: null } }] });
    });

    it('should filter only pending schedules (past date and not executed)', async () => {
      await service.findD5NotesSchedules(makeFilters({ pendente: true }));

      expect(whereFromGet()).toEqual({
        AND: [{ exec: null }, { data_prog: { lt: TODAY } }],
      });
    });

    it('should combine all state filters', async () => {
      await service.findD5NotesSchedules(
        makeFilters({ reprovada: true, executado: true, pendente: true }),
      );

      expect(whereFromGet()).toEqual({
        AND: [
          { reprovada: true },
          { exec: { not: null } },
          { exec: null },
          { data_prog: { lt: TODAY } },
        ],
      });
    });

    it('should compute "today" from the current date', async () => {
      jest.setSystemTime(new Date('2026-12-31T12:00:00.000Z'));

      await service.findD5NotesSchedules(makeFilters({ pendente: true }));

      expect(whereFromGet().AND).toContainEqual({
        data_prog: { lt: new Date('2026-12-31T00:00:00.000Z') },
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('where clause - date range', () => {
    it('should apply the date range when both dates are provided', async () => {
      await service.findD5NotesSchedules(
        makeFilters({
          dataInicial: '01/10/2026',
          dataFinal: '31/10/2026',
        } as any),
      );

      expect(whereFromGet()).toEqual({
        AND: [
          {
            data_prog: {
              gte: new Date('2026-10-01T00:00:00.000Z'),
              lte: new Date('2026-10-31T23:59:59.999Z'),
            },
          },
          ...DEFAULT_STATE_CONDITIONS,
        ],
      });
    });

    it.each([
      ['only the start date', { dataInicial: '01/10/2026' }],
      ['only the end date', { dataFinal: '31/10/2026' }],
    ])('should not apply the date range when given %s', async (_, filters) => {
      await service.findD5NotesSchedules(makeFilters(filters as any));

      expect(whereFromGet()).toEqual(DEFAULT_WHERE);
    });
  });

  // ---------------------------------------------------------------------------
  describe('where clause - list filters', () => {
    it.each([
      ['idRegional', { municipios: { id_regional: { in: [1, 2] } } }],
      ['idMunicipio', { id_municipio: { in: [1, 2] } }],
      ['idGrupo', { id_turma: { in: [1, 2] } }],
      ['idTipo', { id_tipo: { in: [1, 2] } }],
      ['idParceira', { id_parceira: { in: [1, 2] } }],
    ])('should apply the %s filter', async (filter, condition) => {
      await service.findD5NotesSchedules(makeFilters({ [filter]: [1, 2] }));

      expect(whereFromGet()).toEqual({
        AND: [condition, ...DEFAULT_STATE_CONDITIONS],
      });
    });

    it.each(['idRegional', 'idMunicipio', 'idGrupo', 'idTipo', 'idParceira'])(
      'should ignore the %s filter when the list is empty',
      async (filter) => {
        await service.findD5NotesSchedules(makeFilters({ [filter]: [] }));

        expect(whereFromGet()).toEqual(DEFAULT_WHERE);
      },
    );

    it('should combine all filters in the expected order', async () => {
      await service.findD5NotesSchedules(
        makeFilters({
          dataInicial: '01/10/2026',
          dataFinal: '31/10/2026',
          idRegional: [1],
          idMunicipio: [2],
          idGrupo: [3],
          idTipo: [4],
          idParceira: [5],
          reprovada: true,
        } as any),
      );

      expect(whereFromGet()).toEqual({
        AND: [
          {
            data_prog: {
              gte: new Date('2026-10-01T00:00:00.000Z'),
              lte: new Date('2026-10-31T23:59:59.999Z'),
            },
          },
          { municipios: { id_regional: { in: [1] } } },
          { id_municipio: { in: [2] } },
          { id_turma: { in: [3] } },
          { id_tipo: { in: [4] } },
          { id_parceira: { in: [5] } },
          { reprovada: true },
        ],
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('pagination', () => {
    it('should not paginate when no page is provided', async () => {
      await service.findD5NotesSchedules(makeFilters());

      expect(repository.get).toHaveBeenCalledWith(DEFAULT_WHERE, undefined);
    });

    it.each([
      [0, { skip: 0, take: 200 }],
      [2, { skip: 400, take: 200 }],
    ])('should build pagination %o for page %i', async (page, pagination) => {
      await service.findD5NotesSchedules(makeFilters({ page }));

      expect(repository.get).toHaveBeenCalledWith(DEFAULT_WHERE, pagination);
    });

    it('should not paginate the totals query', async () => {
      await service.findD5NotesSchedules(makeFilters({ page: 2 }));

      expect(repository.getTotals).toHaveBeenCalledWith(DEFAULT_WHERE);
    });
  });

  // ---------------------------------------------------------------------------
  describe('totals', () => {
    const totalsFor = async (notes: unknown[]) => {
      repository.getTotals.mockResolvedValue(notes as any);
      const { totals } = await service.findD5NotesSchedules(makeFilters());
      return totals;
    };

    it('should return zeros when there are no notes', async () => {
      expect(await totalsFor([])).toEqual({
        total: 0,
        totalMoRetida: 0,
        totalMoProgramada: 0,
      });
    });

    it('should compute the scheduled workforce proportionally to the scheduled percentage', async () => {
      expect(
        await totalsFor([{ noteId: 1, moRetida: 1000, progs: [25] }]),
      ).toEqual({
        total: 1,
        totalMoRetida: 1000,
        totalMoProgramada: 250,
      });
    });

    it('should sum the percentages of multiple schedules of the same note', async () => {
      expect(
        await totalsFor([{ noteId: 1, moRetida: 1000, progs: [25, 25] }]),
      ).toEqual({
        total: 2,
        totalMoRetida: 1000,
        totalMoProgramada: 500,
      });
    });

    it('should cap the scheduled workforce at 100% of the retained workforce', async () => {
      expect(
        await totalsFor([
          { noteId: 1, moRetida: 1000, progs: [80, 50] }, // 130% -> capped at 100%
          { noteId: 2, moRetida: 500, progs: [50] },
        ]),
      ).toEqual({ total: 3, totalMoRetida: 1500, totalMoProgramada: 1250 });
    });

    it('should include the retained workforce of notes without schedules', async () => {
      expect(
        await totalsFor([{ noteId: 1, moRetida: 800, progs: [] }]),
      ).toEqual({
        total: 0,
        totalMoRetida: 800,
        totalMoProgramada: 0,
      });
    });
  });

  // ---------------------------------------------------------------------------
  describe('findByD5NoteId', () => {
    it('should fetch the note schedules and return the mapped result', async () => {
      const data = [{ id: 10 }];
      const mapped = [{ id: 10, mapped: true }];
      repository.getByD5NoteId.mockResolvedValue(data as any);
      toResponseList.mockReturnValue(mapped);

      const result = await service.findByD5NoteId(7);

      expect(repository.getByD5NoteId).toHaveBeenCalledWith(7);
      expect(toResponseList).toHaveBeenCalledWith(data);
      expect(result).toBe(mapped);
    });

    it('should propagate repository errors without calling the mapper', async () => {
      repository.getByD5NoteId.mockRejectedValue(new Error('failure'));

      await expect(service.findByD5NoteId(7)).rejects.toThrow('failure');
      expect(toResponseList).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------------
  describe('findRejectionsByD5Note', () => {
    it('should fetch the note rejections and return the mapped result', async () => {
      const data = [{ id: 20 }];
      const mapped = [{ id: 20, reprovadoPor: 'John Doe' }];
      repository.findRejections.mockResolvedValue(data as any);
      toRejectionsResponseList.mockReturnValue(mapped);

      const result = await service.findRejectionsByD5Note(7);

      expect(repository.findRejections).toHaveBeenCalledWith(7);
      expect(toRejectionsResponseList).toHaveBeenCalledWith(data);
      expect(result).toBe(mapped);
    });

    it('should propagate repository errors without calling the mapper', async () => {
      repository.findRejections.mockRejectedValue(new Error('failure'));

      await expect(service.findRejectionsByD5Note(7)).rejects.toThrow(
        'failure',
      );
      expect(toRejectionsResponseList).not.toHaveBeenCalled();
    });
  });
});
