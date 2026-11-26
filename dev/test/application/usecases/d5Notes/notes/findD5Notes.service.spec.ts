import { BadRequestException, NotFoundException } from '@nestjs/common';
import {
  toD5NoteDetailOutput,
  toD5NoteListItemOutput,
} from 'src/application/mappers/d5Notes/d5NotesMapper';
import type { D5NotesFilterInput } from 'src/application/types/usecases/d5Notes/d5Notes.types';
import { FindD5NotesService } from 'src/application/usecases/d5Notes/notes/findD5Notes.service';
import type { ID5NotesRepository } from 'src/domain/contracts/d5Notes/ID5notesRepository';
import type { TimeMetricsService } from 'src/domain/services/d5Notes/timeMetrics.service';
import type {
  D5NoteDetail,
  D5NoteFilter,
  D5NoteListItem,
  D5NoteTotals,
} from 'src/domain/types';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';

// ─── Module mocks ─────────────────────────────────────────────────────

vi.mock('src/application/mappers/d5Notes/d5NotesMapper', () => ({
  toD5NoteListItemOutput: vi.fn(),
  toD5NoteDetailOutput: vi.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────

/** Meia-noite local: o mesmo que moment('AAAA-MM-DD').startOf('day'). */
const localDay = (year: number, month: number, day: number) =>
  new Date(year, month - 1, day);

const TOTALS: D5NoteTotals = { total: 2, totalMoRetida: 1500 };

const makeListItem = (id: number): D5NoteListItem =>
  ({
    id,
    createdAt: new Date('2026-11-01T10:00:00Z'),
    completedAt: null,
  }) as unknown as D5NoteListItem;

const makeDetail = (schedules: D5NoteDetail['schedules']): D5NoteDetail =>
  ({ id: 10, schedules }) as unknown as D5NoteDetail;

// ─── Suite ────────────────────────────────────────────────────────────

describe('FindD5NotesService', () => {
  let repository: Mocked<ID5NotesRepository>;
  let timeMetrics: Mocked<
    Pick<TimeMetricsService, 'getDeadlineInfo' | 'calculateStatus'>
  >;
  let service: FindD5NotesService;

  beforeEach(() => {
    vi.clearAllMocks();

    repository = {
      get: vi.fn().mockResolvedValue([]),
      getTotals: vi.fn().mockResolvedValue(TOTALS),
      getById: vi.fn(),
      update: vi.fn(),
    } as unknown as Mocked<ID5NotesRepository>;

    timeMetrics = {
      getDeadlineInfo: vi.fn().mockReturnValue({ tmAberto: 5, tmExecucao: 2 }),
      calculateStatus: vi.fn().mockReturnValue('NO PRAZO'),
    } as unknown as typeof timeMetrics;

    vi.mocked(toD5NoteListItemOutput).mockImplementation(
      (note, time) => ({ id: note.id, ...time }) as never,
    );
    vi.mocked(toD5NoteDetailOutput).mockImplementation(
      (note, totals) => ({ id: note.id, ...totals }) as never,
    );

    service = new FindD5NotesService(
      repository,
      timeMetrics as unknown as TimeMetricsService,
    );
  });

  const lastFilter = (): D5NoteFilter => repository.get.mock.calls[0][0];

  // ═══ get ════════════════════════════════════════════════════════════

  describe('get', () => {
    describe('filter', () => {
      it('maps the input into a domain filter and sends the same filter to get and getTotals', async () => {
        const input: D5NotesFilterInput = {
          idRegional: [1],
          idStatus: [2],
          idMunicipio: [3],
          idGrupo: [4],
          idTipo: [5],
          idParceira: [6],
          idOvnota: [7],
          idNotaD5: [8],
          statusD5Sap: 'Pendente',
        };

        await service.get(input);

        const filter = lastFilter();
        expect(filter).toEqual({
          regionIds: [1],
          statusIds: [2],
          municipalityIds: [3],
          groupIds: [4],
          typeIds: [5],
          partnerIds: [6],
          workIds: [7],
          noteIds: [8],
          sapStatus: 'Pendente',
          createdAt: undefined,
          completedAt: undefined,
        });
        expect(repository.getTotals).toHaveBeenCalledWith(filter);
      });

      it('builds an inclusive start and exclusive end for both date ranges', async () => {
        await service.get({
          dataCriacaoInicial: '2026-11-01',
          dataCriacaoFinal: '2026-11-30',
          dataConclusaoInicial: '2026-12-01',
          dataConclusaoFinal: '2026-12-01',
        });

        const filter = lastFilter();
        expect(filter.createdAt).toEqual({
          from: localDay(2026, 11, 1),
          toExclusive: localDay(2026, 12, 1),
        });
        expect(filter.completedAt).toEqual({
          from: localDay(2026, 12, 1),
          toExclusive: localDay(2026, 12, 2),
        });
      });

      it('builds an open range when only the start date is sent', async () => {
        await service.get({ dataCriacaoInicial: '2026-11-01' });

        expect(lastFilter().createdAt).toEqual({ from: localDay(2026, 11, 1) });
      });

      it('builds an open range when only the end date is sent', async () => {
        await service.get({ dataConclusaoFinal: '2026-11-30' });

        expect(lastFilter().completedAt).toEqual({
          toExclusive: localDay(2026, 12, 1),
        });
      });

      it.each([
        [
          'creation',
          { dataCriacaoInicial: '2026-11-10', dataCriacaoFinal: '2026-11-05' },
          'A data inicial de criação não pode ser posterior à data final',
        ],
        [
          'completion',
          {
            dataConclusaoInicial: '2026-11-10',
            dataConclusaoFinal: '2026-11-05',
          },
          'A data inicial de conclusão não pode ser posterior à data final',
        ],
      ])(
        'throws BadRequestException when the %s start date is after the end date',
        async (_label, input, message) => {
          await expect(
            service.get(input as D5NotesFilterInput),
          ).rejects.toThrow(new BadRequestException(message));

          expect(repository.get).not.toHaveBeenCalled();
          expect(repository.getTotals).not.toHaveBeenCalled();
        },
      );

      it('throws when the start date is exactly one day after the end date', async () => {
        // from = 06/11 e toExclusive = 06/11 → from >= toExclusive
        await expect(
          service.get({
            dataCriacaoInicial: '2026-11-06',
            dataCriacaoFinal: '2026-11-05',
          }),
        ).rejects.toBeInstanceOf(BadRequestException);
      });
    });

    describe('pagination', () => {
      it('does not paginate when no page is sent', async () => {
        await service.get({});

        expect(repository.get).toHaveBeenCalledWith(
          expect.any(Object),
          undefined,
        );
      });

      it.each([
        [0, { skip: 0, take: 200 }],
        [3, { skip: 600, take: 200 }],
      ])(
        'paginates page %i with 200 items per page',
        async (page, expected) => {
          await service.get({ page });

          expect(repository.get).toHaveBeenCalledWith(
            expect.any(Object),
            expected,
          );
        },
      );
    });

    describe('output', () => {
      it('maps each note with its time metrics and returns the repository totals', async () => {
        const first = makeListItem(1);
        const second = makeListItem(2);
        repository.get.mockResolvedValue([first, second]);

        const result = await service.get({});

        expect(timeMetrics.getDeadlineInfo).toHaveBeenCalledWith(
          first.createdAt,
          first.completedAt,
        );
        expect(timeMetrics.calculateStatus).toHaveBeenCalledWith(5);
        expect(toD5NoteListItemOutput).toHaveBeenCalledWith(first, {
          tmAberto: 5,
          tmExecucao: 2,
          statusPrazo: 'NO PRAZO',
        });
        expect(result).toEqual({
          d5Notes: [
            { id: 1, tmAberto: 5, tmExecucao: 2, statusPrazo: 'NO PRAZO' },
            { id: 2, tmAberto: 5, tmExecucao: 2, statusPrazo: 'NO PRAZO' },
          ],
          totals: TOTALS,
        });
      });

      it('returns an empty list when no note matches the filter', async () => {
        const result = await service.get({});

        expect(result.d5Notes).toEqual([]);
        expect(toD5NoteListItemOutput).not.toHaveBeenCalled();
      });

      it('propagates repository errors', async () => {
        const error = new Error('database down');
        repository.get.mockRejectedValue(error);

        await expect(service.get({})).rejects.toBe(error);
      });
    });
  });

  // ═══ getById ════════════════════════════════════════════════════════

  describe('getById', () => {
    it('throws BadRequestException when no id is provided', async () => {
      await expect(service.getById(0)).rejects.toThrow(
        new BadRequestException('Obra não foi enviada'),
      );

      expect(repository.getById).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the note does not exist', async () => {
      repository.getById.mockResolvedValue(null);

      await expect(service.getById(10)).rejects.toThrow(
        new NotFoundException('Obra não encontrada'),
      );

      expect(repository.getById).toHaveBeenCalledWith(10);
      expect(toD5NoteDetailOutput).not.toHaveBeenCalled();
    });

    it('sums the planned and executed values of every schedule', async () => {
      const note = makeDetail([
        { planned: 30, executed: 20 },
        { planned: 50, executed: 50 },
        { planned: 20, executed: 0 },
      ]);
      repository.getById.mockResolvedValue(note);

      const result = await service.getById(10);

      expect(toD5NoteDetailOutput).toHaveBeenCalledWith(note, {
        totalProgramado: 100,
        totalExecutado: 70,
      });
      expect(result).toEqual({
        id: 10,
        totalProgramado: 100,
        totalExecutado: 70,
      });
    });

    it('returns zeroed totals when the note has no schedules', async () => {
      const note = makeDetail([]);
      repository.getById.mockResolvedValue(note);

      await service.getById(10);

      expect(toD5NoteDetailOutput).toHaveBeenCalledWith(note, {
        totalProgramado: 0,
        totalExecutado: 0,
      });
    });
  });
});
