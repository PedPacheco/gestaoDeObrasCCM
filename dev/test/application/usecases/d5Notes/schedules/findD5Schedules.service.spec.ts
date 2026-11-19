import { D5NoteScheduleMapper } from 'src/application/mappers/d5Notes/d5NotesScheduleMapper';
import type { D5SchedulesFilterInput } from 'src/application/types';
import { FindD5SchedulesService } from 'src/application/usecases/d5Notes/schedules/findD5Schedules.service';
import type { ID5NotesSchedulesRepository } from 'src/domain/contracts/d5Notes/ID5NotesSchedulesRepository';
import type { TimeMetricsService } from 'src/domain/services/d5Notes/timeMetrics.service';
import type {
  D5ScheduleDetail,
  D5ScheduleFilter,
  D5ScheduleRejection,
  D5ScheduleWithNote,
  NoteScheduledWork,
} from 'src/domain/types';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mocked,
} from 'vitest';

// ─── Module mocks ─────────────────────────────────────────────────────

vi.mock('src/application/mappers/d5Notes/d5NotesScheduleMapper', () => ({
  D5NoteScheduleMapper: {
    toListItems: vi.fn(),
    toResponseList: vi.fn(),
    toRejectionsResponseList: vi.fn(),
  },
}));

// ─── Fixtures ─────────────────────────────────────────────────────────

/** 12:00 UTC: o dia local é 18/11/2026 em qualquer fuso entre UTC-11 e UTC+11. */
const NOW = new Date('2026-11-18T12:00:00.000Z');
const TODAY = new Date('2026-11-18T00:00:00.000Z');

const makeScheduleWithNote = (
  createdAt: string,
  completedAt: string | null,
): D5ScheduleWithNote =>
  ({
    note: {
      createdAt: new Date(createdAt),
      completedAt: completedAt ? new Date(completedAt) : null,
    },
  }) as unknown as D5ScheduleWithNote;

// ─── Suite ────────────────────────────────────────────────────────────

describe('FindD5SchedulesService', () => {
  let repository: Mocked<ID5NotesSchedulesRepository>;
  let timeMetrics: Mocked<
    Pick<TimeMetricsService, 'calculateTM' | 'calculateStatus'>
  >;
  let service: FindD5SchedulesService;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);

    repository = {
      get: vi.fn().mockResolvedValue([]),
      getTotals: vi.fn().mockResolvedValue([]),
      getById: vi.fn(),
      getStoredFiles: vi.fn(),
      getByD5NoteId: vi.fn(),
      findRejections: vi.fn(),
      create: vi.fn(),
      updateAndSyncWorkStatus: vi.fn(),
      delete: vi.fn(),
      rejectMany: vi.fn(),
    } as unknown as Mocked<ID5NotesSchedulesRepository>;

    timeMetrics = {
      calculateTM: vi.fn().mockReturnValue({ tmAberto: 5, tmExecucao: 2 }),
      calculateStatus: vi.fn().mockReturnValue('NO PRAZO'),
    } as unknown as typeof timeMetrics;

    // executa o callback de métricas, como o mapper real faz
    vi.mocked(D5NoteScheduleMapper.toListItems).mockImplementation(
      (items, getTimeMetrics) =>
        items.map((item) => ({ time: getTimeMetrics(item) }) as never),
    );

    service = new FindD5SchedulesService(
      repository,
      timeMetrics as unknown as TimeMetricsService,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const lastFilter = (): D5ScheduleFilter => repository.get.mock.calls[0][0];

  // ═══ findD5NotesSchedules ═══════════════════════════════════════════

  describe('findD5NotesSchedules', () => {
    describe('filter', () => {
      it('maps the input into a domain filter and sends the same filter to get and getTotals', async () => {
        const input: D5SchedulesFilterInput = {
          idRegional: [1],
          idMunicipio: [2],
          idGrupo: [3],
          idTipo: [4],
          idParceira: [5],
          idOvnota: [6],
          statusSap: 'Pendente',
          idNotaD5: [7],
          id: [8],
        };

        await service.findD5NotesSchedules(input);

        const filter = lastFilter();
        expect(filter).toEqual({
          scheduledDate: undefined,
          note: {
            regionIds: [1],
            municipalityIds: [2],
            groupIds: [3],
            typeIds: [4],
            partnerIds: [5],
            workIds: [6],
            sapStatus: 'Pendente',
          },
          noteIds: [7],
          scheduleIds: [8],
          state: { states: ['upcoming'], today: TODAY },
        });
        expect(repository.getTotals).toHaveBeenCalledWith(filter);
      });

      it('uses the start of the current local day as the reference date', async () => {
        await service.findD5NotesSchedules({});

        expect(lastFilter().state?.today).toEqual(TODAY);
      });

      it('builds an inclusive start and exclusive end period when both dates are sent', async () => {
        await service.findD5NotesSchedules({
          dataInicial: '01/11/2026',
          dataFinal: '30/11/2026',
        });

        expect(lastFilter().scheduledDate).toEqual({
          from: new Date('2026-11-01T00:00:00.000Z'),
          toExclusive: new Date('2026-12-01T00:00:00.000Z'),
        });
      });

      it.each([
        ['only the start date', { dataInicial: '01/11/2026' }],
        ['only the end date', { dataFinal: '30/11/2026' }],
        ['no dates', {}],
      ])('ignores the period when %s is sent', async (_label, input) => {
        await service.findD5NotesSchedules(input as D5SchedulesFilterInput);

        expect(lastFilter().scheduledDate).toBeUndefined();
      });
    });

    describe('states', () => {
      it.each<[string, D5SchedulesFilterInput, string[]]>([
        ['no state flag', {}, ['upcoming']],
        [
          'all flags set to false',
          { reprovada: false, executado: false, pendente: false },
          ['upcoming'],
        ],
        ['rejected only', { reprovada: true }, ['rejected']],
        ['executed only', { executado: true }, ['executed']],
        ['pending only', { pendente: true }, ['pending']],
        [
          'every flag',
          { reprovada: true, executado: true, pendente: true },
          ['rejected', 'executed', 'pending'],
        ],
      ])('resolves the states for %s', async (_label, input, expected) => {
        await service.findD5NotesSchedules(input);

        expect(lastFilter().state?.states).toEqual(expected);
      });
    });

    describe('pagination', () => {
      it('does not paginate when no page is sent', async () => {
        await service.findD5NotesSchedules({});

        expect(repository.get).toHaveBeenCalledWith(
          expect.any(Object),
          undefined,
        );
      });

      it.each([
        [0, { skip: 0, take: 200 }],
        [2, { skip: 400, take: 200 }],
      ])(
        'paginates page %i with 200 items per page',
        async (page, expected) => {
          await service.findD5NotesSchedules({ page });

          expect(repository.get).toHaveBeenCalledWith(
            expect.any(Object),
            expected,
          );
        },
      );
    });

    describe('output', () => {
      it('maps the schedules using the time metrics of each note', async () => {
        const schedule = makeScheduleWithNote(
          '2026-11-01T00:00:00Z',
          '2026-11-10T00:00:00Z',
        );
        repository.get.mockResolvedValue([schedule]);

        const result = await service.findD5NotesSchedules({});

        expect(D5NoteScheduleMapper.toListItems).toHaveBeenCalledWith(
          [schedule],
          expect.any(Function),
        );
        expect(timeMetrics.calculateTM).toHaveBeenCalledWith(
          schedule.note.createdAt,
          schedule.note.completedAt,
        );
        expect(timeMetrics.calculateStatus).toHaveBeenCalledWith(5);
        expect(result.d5Notes).toEqual([
          { time: { tmAberto: 5, tmExecucao: 2, statusPrazo: 'NO PRAZO' } },
        ]);
      });

      it('returns zeroed totals when no note matches the filter', async () => {
        const result = await service.findD5NotesSchedules({});

        expect(result.totals).toEqual({
          total: 0,
          totalMoRetida: 0,
          totalMoProgramada: 0,
        });
      });

      it('sums the totals and caps the programmed percentage of each note at 100%', async () => {
        const notes: NoteScheduledWork[] = [
          { noteId: 1, moRetida: 1000, progs: [30, 40] }, // 70%  → 700
          { noteId: 2, moRetida: 500, progs: [80, 50] }, // 130% → limitado a 100% → 500
          { noteId: 3, moRetida: 200, progs: [] }, // 0%   → 0
        ];
        repository.getTotals.mockResolvedValue(notes);

        const result = await service.findD5NotesSchedules({});

        expect(result.totals).toEqual({
          total: 4,
          totalMoRetida: 1700,
          totalMoProgramada: 1200,
        });
      });
    });
  });

  // ═══ findByD5NoteId ═════════════════════════════════════════════════

  describe('findByD5NoteId', () => {
    it('loads the schedules of the note and maps them to the response', async () => {
      const schedules = [{ id: 1 }] as unknown as D5ScheduleDetail[];
      const response = [{ id: 1, id_nota_d5: 10 }];
      repository.getByD5NoteId.mockResolvedValue(schedules);
      vi.mocked(D5NoteScheduleMapper.toResponseList).mockReturnValue(
        response as never,
      );

      const result = await service.findByD5NoteId(10);

      expect(repository.getByD5NoteId).toHaveBeenCalledWith(10);
      expect(D5NoteScheduleMapper.toResponseList).toHaveBeenCalledWith(
        schedules,
      );
      expect(result).toBe(response);
    });
  });

  // ═══ findRejectionsByD5Note ═════════════════════════════════════════

  describe('findRejectionsByD5Note', () => {
    it('loads the rejections of the note and maps them to the response', async () => {
      const rejections = [{ id: 3 }] as unknown as D5ScheduleRejection[];
      const response = [{ id: 3, descricao: 'x' }];
      repository.findRejections.mockResolvedValue(rejections);
      vi.mocked(D5NoteScheduleMapper.toRejectionsResponseList).mockReturnValue(
        response as never,
      );

      const result = await service.findRejectionsByD5Note(10);

      expect(repository.findRejections).toHaveBeenCalledWith(10);
      expect(
        D5NoteScheduleMapper.toRejectionsResponseList,
      ).toHaveBeenCalledWith(rejections);
      expect(result).toBe(response);
    });
  });
});
