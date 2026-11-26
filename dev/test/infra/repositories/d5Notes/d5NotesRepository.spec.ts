import { NotFoundError, ValidationError } from 'src/domain/errors/domain.error';
import type { D5NoteFilter, UpdateD5NoteData } from 'src/domain/types';
import { Prisma } from 'src/infra/generated/prisma/client';
import {
  toD5NoteDetail,
  toD5NoteListItem,
  toD5NoteUpdateInput,
  toD5NoteWhere,
} from 'src/infra/mappers/d5Notes/d5Notes.mapper';
import type { PrismaService } from 'src/infra/prisma/prisma.service';
import { D5NotesRepository } from 'src/infra/repositories/d5Notes/d5NotesRepository';
import {
  D5_NOTE_BY_ID_SELECT,
  D5_NOTE_LIST_SELECT,
} from 'src/infra/types/repositories/d5Notes/d5Notes.types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Module mocks ─────────────────────────────────────────────────────

vi.mock('src/infra/mappers/d5Notes/d5Notes.mapper', () => ({
  toD5NoteWhere: vi.fn(() => ({ id_status: { in: [1] } })),
  toD5NoteListItem: vi.fn((r) => ({ listItem: r.id })),
  toD5NoteDetail: vi.fn((r) => ({ detail: r.id })),
  toD5NoteUpdateInput: vi.fn(() => ({ descricao: 'nova', id_usuario: 7 })),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────

const WHERE = { id_status: { in: [1] } };
const FILTER: D5NoteFilter = { statusIds: [1] };
const UPDATE_DATA: UpdateD5NoteData = { description: 'nova' };
const MODIFYING_USER_ID = 7;

const prismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError(`Prisma error ${code}`, {
    code,
    clientVersion: 'test',
  });

// ─── Suite ────────────────────────────────────────────────────────────

describe('D5NotesRepository', () => {
  let prisma: {
    notas_d5: {
      findMany: ReturnType<typeof vi.fn>;
      findUnique: ReturnType<typeof vi.fn>;
      count: ReturnType<typeof vi.fn>;
      aggregate: ReturnType<typeof vi.fn>;
      update: ReturnType<typeof vi.fn>;
    };
  };
  let repository: D5NotesRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = {
      notas_d5: {
        findMany: vi.fn().mockResolvedValue([]),
        findUnique: vi.fn(),
        count: vi.fn().mockResolvedValue(0),
        aggregate: vi.fn().mockResolvedValue({ _sum: { mo_planejada: null } }),
        update: vi.fn().mockResolvedValue(undefined),
      },
    };
    repository = new D5NotesRepository(prisma as unknown as PrismaService);
  });

  // ═══ get ════════════════════════════════════════════════════════════

  describe('get', () => {
    it('queries the notes with the domain filter, ordered by creation date, and maps each row', async () => {
      prisma.notas_d5.findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

      const result = await repository.get(FILTER, { skip: 200, take: 200 });

      expect(toD5NoteWhere).toHaveBeenCalledWith(FILTER);
      expect(prisma.notas_d5.findMany).toHaveBeenCalledWith({
        where: WHERE,
        select: D5_NOTE_LIST_SELECT,
        orderBy: { criado_em: 'desc' },
        skip: 200,
        take: 200,
      });
      expect(toD5NoteListItem).toHaveBeenCalledTimes(2);
      expect(result).toEqual([{ listItem: 1 }, { listItem: 2 }]);
    });

    it('does not paginate when no pagination is given', async () => {
      await repository.get(FILTER);

      const args = prisma.notas_d5.findMany.mock.calls[0][0];
      expect(args).not.toHaveProperty('skip');
      expect(args).not.toHaveProperty('take');
    });

    it('returns an empty list when no note matches the filter', async () => {
      expect(await repository.get(FILTER)).toEqual([]);
      expect(toD5NoteListItem).not.toHaveBeenCalled();
    });
  });

  // ═══ getTotals ══════════════════════════════════════════════════════

  describe('getTotals', () => {
    it('counts the notes and sums the planned labor using the same filter', async () => {
      prisma.notas_d5.count.mockResolvedValue(3);
      prisma.notas_d5.aggregate.mockResolvedValue({
        _sum: { mo_planejada: 1500 },
      });

      const result = await repository.getTotals(FILTER);

      expect(toD5NoteWhere).toHaveBeenCalledTimes(1);
      expect(prisma.notas_d5.count).toHaveBeenCalledWith({ where: WHERE });
      expect(prisma.notas_d5.aggregate).toHaveBeenCalledWith({
        where: WHERE,
        _sum: { mo_planejada: true },
      });
      expect(result).toEqual({ total: 3, totalMoRetida: 1500 });
    });

    it('returns zero planned labor when the sum is null', async () => {
      const result = await repository.getTotals(FILTER);

      expect(result).toEqual({ total: 0, totalMoRetida: 0 });
    });

    it('converts a decimal sum to a number', async () => {
      prisma.notas_d5.count.mockResolvedValue(1);
      prisma.notas_d5.aggregate.mockResolvedValue({
        _sum: { mo_planejada: { toString: () => '123.45' } },
      });

      const result = await repository.getTotals(FILTER);

      expect(result.totalMoRetida).toBe(123.45);
    });
  });

  // ═══ getById ════════════════════════════════════════════════════════

  describe('getById', () => {
    it('loads the note with the detail select and maps it', async () => {
      prisma.notas_d5.findUnique.mockResolvedValue({ id: 10 });

      const result = await repository.getById(10);

      expect(prisma.notas_d5.findUnique).toHaveBeenCalledWith({
        where: { id: 10 },
        select: D5_NOTE_BY_ID_SELECT,
      });
      expect(result).toEqual({ detail: 10 });
    });

    it('returns null without mapping when the note does not exist', async () => {
      prisma.notas_d5.findUnique.mockResolvedValue(null);

      expect(await repository.getById(10)).toBeNull();
      expect(toD5NoteDetail).not.toHaveBeenCalled();
    });
  });

  // ═══ update ═════════════════════════════════════════════════════════

  describe('update', () => {
    it('updates the note with the mapped columns', async () => {
      await repository.update(10, UPDATE_DATA, MODIFYING_USER_ID);

      expect(toD5NoteUpdateInput).toHaveBeenCalledWith(
        UPDATE_DATA,
        MODIFYING_USER_ID,
      );
      expect(prisma.notas_d5.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { descricao: 'nova', id_usuario: 7 },
      });
    });

    it('translates P2025 into NotFoundError', async () => {
      prisma.notas_d5.update.mockRejectedValue(prismaError('P2025'));

      const promise = repository.update(10, UPDATE_DATA, MODIFYING_USER_ID);

      await expect(promise).rejects.toBeInstanceOf(NotFoundError);
      await expect(promise).rejects.toThrow('Nota D5 não encontrada.');
    });

    it('translates P2003 into ValidationError', async () => {
      prisma.notas_d5.update.mockRejectedValue(prismaError('P2003'));

      const promise = repository.update(10, UPDATE_DATA, MODIFYING_USER_ID);

      await expect(promise).rejects.toBeInstanceOf(ValidationError);
      await expect(promise).rejects.toThrow('Parceira ou status inexistente.');
    });

    it('rethrows other known Prisma errors unchanged', async () => {
      const error = prismaError('P2002');
      prisma.notas_d5.update.mockRejectedValue(error);

      await expect(
        repository.update(10, UPDATE_DATA, MODIFYING_USER_ID),
      ).rejects.toBe(error);
    });

    it('rethrows non-Prisma errors unchanged', async () => {
      const error = new Error('connection lost');
      prisma.notas_d5.update.mockRejectedValue(error);

      await expect(
        repository.update(10, UPDATE_DATA, MODIFYING_USER_ID),
      ).rejects.toBe(error);
    });
  });
});
