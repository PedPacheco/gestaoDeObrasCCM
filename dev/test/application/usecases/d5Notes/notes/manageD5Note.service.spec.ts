import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { UpdateD5NoteInput } from 'src/application/types/usecases/d5Notes/d5Notes.types';
import { ManageD5NoteService } from 'src/application/usecases/d5Notes/notes/manageD5Note.service';
import type { ID5NotesRepository } from 'src/domain/contracts/d5Notes/ID5notesRepository';
import { NotFoundError, ValidationError } from 'src/domain/errors/domain.error';
import type { D5NoteDetail } from 'src/domain/types';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';

// ─── Fixtures ─────────────────────────────────────────────────────────

const NOTE_ID = 10;
const MODIFYING_USER_ID = 7;

const existingNote = { id: NOTE_ID } as unknown as D5NoteDetail;

const updateInput: UpdateD5NoteInput = {
  partnerId: 3,
  statusId: 2,
  description: 'Revisão do prazo',
};

// ─── Suite ────────────────────────────────────────────────────────────

describe('ManageD5NoteService', () => {
  let repository: Mocked<ID5NotesRepository>;
  let service: ManageD5NoteService;

  beforeEach(() => {
    vi.clearAllMocks();

    repository = {
      get: vi.fn(),
      getTotals: vi.fn(),
      getById: vi.fn().mockResolvedValue(existingNote),
      update: vi.fn().mockResolvedValue(undefined),
    } as unknown as Mocked<ID5NotesRepository>;

    service = new ManageD5NoteService(repository);
  });

  describe('update', () => {
    // ─── Validação do input ───────────────────────────────────────────

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['an empty object', {}],
    ])(
      'throws BadRequestException when the data is %s',
      async (_label, data) => {
        await expect(
          service.update(
            NOTE_ID,
            data as unknown as UpdateD5NoteInput,
            MODIFYING_USER_ID,
          ),
        ).rejects.toThrow(
          new BadRequestException('Nenhum campo fornecido para atualização.'),
        );

        expect(repository.getById).not.toHaveBeenCalled();
        expect(repository.update).not.toHaveBeenCalled();
      },
    );

    // ─── Existência da nota ───────────────────────────────────────────

    it('throws NotFoundException when the note does not exist', async () => {
      repository.getById.mockResolvedValue(null);

      await expect(
        service.update(NOTE_ID, updateInput, MODIFYING_USER_ID),
      ).rejects.toThrow(new NotFoundException('Nota D5 não encontrada.'));

      expect(repository.getById).toHaveBeenCalledWith(NOTE_ID);
      expect(repository.update).not.toHaveBeenCalled();
    });

    // ─── Sucesso ──────────────────────────────────────────────────────

    it('updates the note with the given data and modifying user', async () => {
      await service.update(NOTE_ID, updateInput, MODIFYING_USER_ID);

      expect(repository.getById).toHaveBeenCalledWith(NOTE_ID);
      expect(repository.update).toHaveBeenCalledWith(
        NOTE_ID,
        updateInput,
        MODIFYING_USER_ID,
      );
    });

    it('accepts a partial update with a single field', async () => {
      const partial: UpdateD5NoteInput = { description: 'Só a descrição' };

      await service.update(NOTE_ID, partial, MODIFYING_USER_ID);

      expect(repository.update).toHaveBeenCalledWith(
        NOTE_ID,
        partial,
        MODIFYING_USER_ID,
      );
    });

    it('checks that the note exists before updating it', async () => {
      await service.update(NOTE_ID, updateInput, MODIFYING_USER_ID);

      expect(repository.getById.mock.invocationCallOrder[0]).toBeLessThan(
        repository.update.mock.invocationCallOrder[0],
      );
    });

    // ─── Erros do repositório ─────────────────────────────────────────

    it.each([
      ['NotFoundError (P2025)', new NotFoundError('Nota D5 não encontrada.')],
      [
        'ValidationError (P2003)',
        new ValidationError('Parceira ou status inexistente.'),
      ],
      ['an unexpected error', new Error('database down')],
    ])(
      'propagates %s raised by the repository unchanged',
      async (_label, error) => {
        repository.update.mockRejectedValue(error);

        await expect(
          service.update(NOTE_ID, updateInput, MODIFYING_USER_ID),
        ).rejects.toBe(error);
      },
    );
  });
});
