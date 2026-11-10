import { D5NoteScheduleMapper } from 'src/application/mappers/d5NotesScheduleMapper';
import { ManageD5NoteScheduleService } from 'src/application/usecases/d5Notes/schedules/manageD5NoteSchedule.service';
import { D5_NOTES_SCHEDULES_REPOSITORY } from 'src/domain/contracts/d5Notes/ID5NotesSchedulesRepository';
import { D5NoteSchedule } from 'src/domain/entities/schedules/d5NotesSchedule.entity';
import { resolveFileDiff } from 'src/domain/services/resolveFileDiff.service';
import {
  CreateProgramacaoD5Dto,
  RejectD5ScheduleDTO,
  UpdateScheduleD5Dto,
} from 'src/interface/dtos/d5NotesDTO';
import type { MockInstance, Mocked, MockedFunction } from 'vitest';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import {
  FILE_STORAGE,
  StorageKind,
} from 'src/domain/contracts/storage/IFileStorage';

// ---------------------------------------------------------------------------
// Mocks de colaboradores
// ---------------------------------------------------------------------------
vi.mock('src/application/mappers/d5NotesScheduleMapper', () => ({
  D5NoteScheduleMapper: {
    fromCreateInput: vi.fn(),
    fromUpdateInput: vi.fn(),
    toDomain: vi.fn(),
    toPersistenceCreate: vi.fn(),
    toPersistenceUpdate: vi.fn(),
    toRejectionSnapshot: vi.fn(),
  },
}));

vi.mock('src/domain/entities/schedules/d5NotesSchedule.entity', () => ({
  D5NoteSchedule: { create: vi.fn() },
}));

vi.mock('src/domain/services/resolveFileDiff.service', () => ({
  resolveFileDiff: vi.fn(),
}));

const mapper = D5NoteScheduleMapper as Mocked<typeof D5NoteScheduleMapper>;
const entity = D5NoteSchedule as Mocked<typeof D5NoteSchedule>;
const fileDiff = resolveFileDiff as MockedFunction<typeof resolveFileDiff>;

const UPLOAD_DIR = '/var/uploads/asbuild';

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------
const makeFile = (
  filename: string,
  path = `/tmp/${filename}`,
): Express.Multer.File => ({ filename, path }) as Express.Multer.File;

const makeExisting = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  id_nota_d5: 10,
  caminhos_arquivos: ['antigo.pdf'],
  ...overrides,
});

const makeCurrent = (overrides: Record<string, unknown> = {}) =>
  ({
    d5NoteId: 10,
    creatorUserId: 7,
    rejected: false,
    ...overrides,
  }) as unknown as D5NoteSchedule;

describe('ManageD5NoteScheduleService', () => {
  let service: ManageD5NoteScheduleService;
  let loggerErrorSpy: MockInstance;

  const repository = {
    create: vi.fn(),
    getById: vi.fn(),
    updateAndSyncWorkStatus: vi.fn(),
    delete: vi.fn(),
    getByD5NoteId: vi.fn(),
    rejectMany: vi.fn(),
  };

  const storageMock = {
    resolve: vi.fn(),
    deleteStored: vi.fn().mockResolvedValue(undefined),
    deleteUploaded: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    process.env.UPLOAD_AS_BUILD = UPLOAD_DIR;

    storageMock.deleteStored.mockResolvedValue(undefined);
    storageMock.deleteUploaded.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManageD5NoteScheduleService,
        { provide: D5_NOTES_SCHEDULES_REPOSITORY, useValue: repository },
        { provide: FILE_STORAGE, useValue: storageMock },
      ],
    }).compile();

    service = module.get(ManageD5NoteScheduleService);

    loggerErrorSpy = vi
      .spyOn((service as any).logger, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => vi.resetAllMocks());
  afterAll(() => vi.restoreAllMocks());

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  // =========================================================================
  // create
  // =========================================================================
  describe('create', () => {
    const dto = { d5NoteId: 10 } as unknown as CreateProgramacaoD5Dto;

    it.each([
      ['null', null],
      ['undefined', undefined],
    ])('deve rejeitar payload %s', async (_label, payload) => {
      await expect(service.create(payload as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(payload as any)).rejects.toThrow(
        'Nenhuma programação fornecida para inserção.',
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('deve mapear, construir a entidade e persistir', async () => {
      const domainProps = { d5NoteId: 10 };
      const built = { id: 1 } as unknown as D5NoteSchedule;
      const persistence = { id_nota_d5: 10 };
      const created = { id: 99 };

      mapper.fromCreateInput.mockReturnValue(domainProps as any);
      entity.create.mockReturnValue(built);
      mapper.toPersistenceCreate.mockReturnValue(persistence as any);
      repository.create.mockResolvedValue(created);

      const result = await service.create(dto);

      expect(mapper.fromCreateInput).toHaveBeenCalledWith(dto);
      expect(entity.create).toHaveBeenCalledWith(domainProps);
      expect(mapper.toPersistenceCreate).toHaveBeenCalledWith(built);
      expect(repository.create).toHaveBeenCalledWith(10, persistence);
      expect(result).toBe(created);
    });

    it('deve propagar erros de validação da entidade sem tocar no repositório', async () => {
      mapper.fromCreateInput.mockReturnValue({} as any);
      entity.create.mockImplementation(() => {
        throw new BadRequestException('ID da nota D5 é obrigatório');
      });

      await expect(service.create(dto)).rejects.toThrow(
        'ID da nota D5 é obrigatório',
      );
      expect(repository.create).not.toHaveBeenCalled();
    });

    it('deve propagar erros do repositório', async () => {
      mapper.fromCreateInput.mockReturnValue({} as any);
      entity.create.mockReturnValue({} as any);
      mapper.toPersistenceCreate.mockReturnValue({} as any);
      repository.create.mockRejectedValue(new Error('falha de base de dados'));

      await expect(service.create(dto)).rejects.toThrow(
        'falha de base de dados',
      );
    });
  });

  // =========================================================================
  // update
  // =========================================================================
  describe('update', () => {
    const dto = {
      keptFiles: ['antigo.pdf'],
      rejected: false,
    } as unknown as UpdateScheduleD5Dto;

    /** Prepara o caminho feliz completo. */
    const arrangeHappyPath = (
      overrides: {
        existing?: Record<string, unknown>;
        finalPaths?: string[];
        toRemove?: string[];
        rejected?: boolean;
      } = {},
    ) => {
      const existing = overrides.existing ?? makeExisting();
      const current = makeCurrent();
      const schedule = { id: 1, rejected: overrides.rejected ?? false };

      repository.getById.mockResolvedValue(existing);
      mapper.toDomain.mockReturnValue(current);
      fileDiff.mockReturnValue({
        finalPaths: overrides.finalPaths ?? ['antigo.pdf', 'novo.pdf'],
        toRemove: overrides.toRemove ?? ['obsoleto.pdf'],
      } as any);
      mapper.fromUpdateInput.mockReturnValue({} as any);
      entity.create.mockReturnValue(schedule as any);
      mapper.toPersistenceUpdate.mockReturnValue({ obs: 'x' } as any);
      repository.updateAndSyncWorkStatus.mockResolvedValue(undefined);

      return { existing, current, schedule };
    };

    it.each([
      ['null', null],
      ['undefined', undefined],
    ])(
      'deve rejeitar payload %s antes de qualquer I/O',
      async (_l, payload) => {
        await expect(service.update(1, payload as any, [], 20)).rejects.toThrow(
          'Nenhuma programação fornecida para inserção.',
        );

        expect(repository.getById).not.toHaveBeenCalled();
        expect(storageMock.deleteUploaded).not.toHaveBeenCalled();
      },
    );

    it('deve atualizar e remover do disco apenas os ficheiros obsoletos', async () => {
      const { current } = arrangeHappyPath();
      const files = [makeFile('novo.pdf')];

      await service.update(1, dto, files, 20);

      expect(repository.getById).toHaveBeenCalledWith(1);
      expect(fileDiff).toHaveBeenCalledWith(['antigo.pdf'], dto.keptFiles, [
        'novo.pdf',
      ]);
      expect(mapper.fromUpdateInput).toHaveBeenCalledWith(dto, {
        id: 1,
        d5NoteId: current.d5NoteId,
        creatorUserId: current.creatorUserId,
        modifyingUserId: 20,
        filePaths: ['antigo.pdf', 'novo.pdf'],
        current,
      });
      expect(repository.updateAndSyncWorkStatus).toHaveBeenCalledWith(
        1,
        {
          obs: 'x',
        },
        10,
        false,
      );
      expect(storageMock.deleteStored).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        ['obsoleto.pdf'],
      );
      expect(storageMock.deleteUploaded).not.toHaveBeenCalled();
    });

    it('deve tratar files null como lista vazia', async () => {
      arrangeHappyPath();

      await service.update(1, dto, null as any, 20);

      expect(fileDiff).toHaveBeenCalledWith(['antigo.pdf'], dto.keptFiles, []);
    });

    it('deve tratar caminhos_arquivos null como lista vazia', async () => {
      arrangeHappyPath({
        existing: makeExisting({ caminhos_arquivos: null }),
      });

      await service.update(1, dto, [], 20);

      expect(fileDiff).toHaveBeenCalledWith([], dto.keptFiles, []);
    });

    it('não deve chamar deleteMany com conteúdo quando não há ficheiros a remover', async () => {
      arrangeHappyPath({ toRemove: [] });

      await service.update(1, dto, [], 20);

      expect(storageMock.deleteStored).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        [],
      );
    });

    // ---------------------------------------------------------------------
    // Rollback
    // ---------------------------------------------------------------------
    describe('rollback', () => {
      it('deve lançar NotFound e remover os uploads quando o registo não existe', async () => {
        repository.getById.mockResolvedValue(null);
        const files = [makeFile('novo.pdf', '/tmp/abs/novo.pdf')];

        await expect(service.update(1, dto, files, 20)).rejects.toThrow(
          NotFoundException,
        );

        expect(storageMock.deleteUploaded).toHaveBeenCalledWith(
          StorageKind.AS_BUILD,
          ['/tmp/abs/novo.pdf'],
        );
        expect(repository.updateAndSyncWorkStatus).not.toHaveBeenCalled();
        expect(loggerErrorSpy).not.toHaveBeenCalled();
      });

      it('deve fazer rollback quando o repositório falha na leitura', async () => {
        repository.getById.mockRejectedValue(new Error('timeout'));
        const files = [makeFile('a.pdf', '/tmp/a.pdf')];

        await expect(service.update(1, dto, files, 20)).rejects.toThrow(
          'timeout',
        );
        expect(storageMock.deleteUploaded).toHaveBeenCalledWith(
          StorageKind.AS_BUILD,
          ['/tmp/a.pdf'],
        );
      });

      it('deve fazer rollback quando a entidade rejeita as regras de negócio', async () => {
        arrangeHappyPath();
        entity.create.mockImplementation(() => {
          throw new BadRequestException('Existem ficheiros duplicados');
        });
        const files = [makeFile('dup.pdf', '/tmp/dup.pdf')];

        await expect(service.update(1, dto, files, 20)).rejects.toThrow(
          'Existem ficheiros duplicados',
        );

        expect(repository.updateAndSyncWorkStatus).not.toHaveBeenCalled();
        expect(storageMock.deleteUploaded).toHaveBeenCalledWith(
          StorageKind.AS_BUILD,
          ['/tmp/dup.pdf'],
        );
      });

      it('deve fazer rollback quando a escrita no repositório falha', async () => {
        arrangeHappyPath();
        repository.updateAndSyncWorkStatus.mockRejectedValue(
          new Error('constraint violada'),
        );
        const files = [makeFile('b.pdf', '/tmp/b.pdf')];

        await expect(service.update(1, dto, files, 20)).rejects.toThrow(
          'constraint violada',
        );
        expect(storageMock.deleteUploaded).toHaveBeenCalledWith(
          StorageKind.AS_BUILD,
          ['/tmp/b.pdf'],
        );
      });

      // --- committed = true: não há rollback dos novos ficheiros ---
      it('não deve remover os novos uploads quando a limpeza pós-commit falha', async () => {
        arrangeHappyPath();
        storageMock.deleteStored.mockRejectedValueOnce(new Error('EACCES'));
        const files = [makeFile('c.pdf', '/tmp/c.pdf')];

        await expect(service.update(1, dto, files, 20)).rejects.toThrow(
          'EACCES',
        );

        // a escrita foi confirmada: os ficheiros novos têm de ficar em disco
        expect(repository.updateAndSyncWorkStatus).toHaveBeenCalledTimes(1);
        expect(storageMock.deleteStored).toHaveBeenCalledTimes(1);
        expect(storageMock.deleteUploaded).not.toHaveBeenCalled();
        expect(loggerErrorSpy).not.toHaveBeenCalled();
      });

      // --- falha do próprio rollback: erro original preservado ---
      it('deve preservar o erro de negócio quando o próprio rollback falha', async () => {
        repository.getById.mockResolvedValue(null);
        storageMock.deleteUploaded.mockRejectedValueOnce(
          new Error('disco ocupado'),
        );
        const files = [makeFile('d.pdf', '/tmp/d.pdf')];

        await expect(service.update(1, dto, files, 20)).rejects.toThrow(
          'Programação não encontrada.',
        );

        expect(storageMock.deleteUploaded).toHaveBeenCalledWith(
          StorageKind.AS_BUILD,
          ['/tmp/d.pdf'],
        );
        expect(repository.updateAndSyncWorkStatus).not.toHaveBeenCalled();
      });

      it('deve registar em log a falha de limpeza com a stack do erro', async () => {
        repository.getById.mockResolvedValue(null);
        const cleanupError = new Error('disco ocupado');
        storageMock.deleteUploaded.mockRejectedValue(cleanupError);

        await expect(
          service.update(1, dto, [makeFile('d.pdf')], 20),
        ).rejects.toThrow(NotFoundException);

        expect(loggerErrorSpy).toHaveBeenCalledWith(
          'Falha ao remover uploads órfãos da programação 1',
          cleanupError.stack,
        );
      });

      it('deve registar o valor bruto quando o erro de limpeza não é uma Error', async () => {
        repository.getById.mockResolvedValue(null);
        storageMock.deleteUploaded.mockRejectedValue('falha string');

        await expect(
          service.update(1, dto, [makeFile('d.pdf')], 20),
        ).rejects.toThrow(NotFoundException);

        expect(loggerErrorSpy).toHaveBeenCalledWith(
          'Falha ao remover uploads órfãos da programação 1',
          'falha string',
        );
      });

      it('deve tentar o rollback mesmo sem ficheiros enviados', async () => {
        repository.getById.mockResolvedValue(null);

        await expect(service.update(1, dto, [], 20)).rejects.toThrow(
          NotFoundException,
        );

        expect(storageMock.deleteUploaded).toHaveBeenCalledWith(
          StorageKind.AS_BUILD,
          [],
        );
      });
    });
  });

  // =========================================================================
  // delete
  // =========================================================================
  describe('delete', () => {
    it.each([
      ['zero', 0],
      ['undefined', undefined],
      ['null', null],
    ])('deve rejeitar id %s', async (_label, id) => {
      await expect(service.delete(id as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.delete(id as any)).rejects.toThrow(
        'Programação não enviada para exclusão.',
      );
      expect(repository.getById).not.toHaveBeenCalled();
    });

    it('deve lançar NotFound quando a programação não existe', async () => {
      repository.getById.mockResolvedValue(null);

      await expect(service.delete(5)).rejects.toThrow(NotFoundException);
      expect(repository.delete).not.toHaveBeenCalled();
      expect(storageMock.deleteUploaded).not.toHaveBeenCalled();
    });

    it('deve eliminar o registo antes de limpar o disco', async () => {
      const ordem: string[] = [];

      repository.getById.mockResolvedValue(
        makeExisting({ caminhos_arquivos: ['a.pdf', 'b.pdf'] }),
      );
      repository.delete.mockImplementation(async () => {
        ordem.push('repositorio');
      });
      storageMock.deleteStored.mockImplementation(async () => {
        ordem.push('disco');
      });

      await service.delete(5);

      expect(ordem).toEqual(['repositorio', 'disco']);
      expect(storageMock.deleteStored).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        ['a.pdf', 'b.pdf'],
      );
      expect(storageMock.deleteUploaded).not.toHaveBeenCalled();
    });

    it('deve tratar caminhos_arquivos null como lista vazia', async () => {
      repository.getById.mockResolvedValue(
        makeExisting({ caminhos_arquivos: null }),
      );
      repository.delete.mockResolvedValue(undefined);

      await service.delete(5);

      expect(storageMock.deleteStored).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        [],
      );
    });

    it('deve propagar falhas do repositório sem tocar no disco', async () => {
      repository.getById.mockResolvedValue(makeExisting());
      repository.delete.mockRejectedValueOnce(new Error('FK em uso'));

      await expect(service.delete(5)).rejects.toThrow('FK em uso');

      expect(storageMock.deleteStored).not.toHaveBeenCalled();
      expect(storageMock.deleteUploaded).not.toHaveBeenCalled();
    });

    it('deve propagar falhas da limpeza de ficheiros', async () => {
      repository.getById.mockResolvedValue(makeExisting());
      repository.delete.mockResolvedValue(undefined);
      storageMock.deleteStored.mockRejectedValueOnce(new Error('EACCES'));

      await expect(service.delete(5)).rejects.toThrow('EACCES');

      // o registo já foi removido antes da falha no disco
      expect(repository.delete).toHaveBeenCalledWith(5);
      expect(storageMock.deleteStored).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        expect.any(Array),
      );
    });

    it('deve resolver sem retorno em caso de sucesso', async () => {
      repository.getById.mockResolvedValue(makeExisting());
      repository.delete.mockResolvedValue(undefined);

      await expect(service.delete(5)).resolves.toBeUndefined();
    });
  });

  // =========================================================================
  // reject
  // =========================================================================
  describe('reject', () => {
    const D5_NOTE_ID = 10;
    const REJECTING_USER = 33;

    const makeSchedule = (id: number) => ({ id, id_nota_d5: D5_NOTE_ID });

    const makeItem = (
      id: number,
      overrides: Partial<RejectD5ScheduleDTO> = {},
    ): RejectD5ScheduleDTO =>
      ({
        id,
        restrictionId: 85,
        description: `descrição ${id}`,
        ...overrides,
      }) as RejectD5ScheduleDTO;

    beforeEach(() => {
      repository.getByD5NoteId.mockResolvedValue([
        makeSchedule(1),
        makeSchedule(2),
        makeSchedule(3),
      ]);
      repository.rejectMany.mockResolvedValue(undefined);
      mapper.toRejectionSnapshot.mockImplementation(
        (schedule: any) =>
          ({ id_nota_d5: schedule.id_nota_d5, snapshotOf: schedule.id }) as any,
      );
    });

    // --- saídas antecipadas ---
    it('deve sair sem I/O quando a lista é vazia', async () => {
      await expect(
        service.reject(D5_NOTE_ID, [], REJECTING_USER),
      ).resolves.toBeUndefined();

      expect(repository.getByD5NoteId).not.toHaveBeenCalled();
      expect(repository.rejectMany).not.toHaveBeenCalled();
    });

    // --- caminho feliz ---
    it('deve buscar as programações da nota D5 informada', async () => {
      await service.reject(D5_NOTE_ID, [makeItem(1)], REJECTING_USER);

      expect(repository.getByD5NoteId).toHaveBeenCalledTimes(1);
      expect(repository.getByD5NoteId).toHaveBeenCalledWith(D5_NOTE_ID);
    });

    it('deve gerar um snapshot por item usando a programação, o motivo e o reprovador', async () => {
      const s1 = makeSchedule(1);
      const s2 = makeSchedule(2);
      repository.getByD5NoteId.mockResolvedValue([s1, s2]);

      await service.reject(
        D5_NOTE_ID,
        [makeItem(1), makeItem(2)],
        REJECTING_USER,
      );

      expect(mapper.toRejectionSnapshot).toHaveBeenCalledTimes(2);
      expect(mapper.toRejectionSnapshot).toHaveBeenNthCalledWith(1, s1, {
        restrictionId: 85,
        description: 'descrição 1',
        rejectingUserId: REJECTING_USER,
      });
      expect(mapper.toRejectionSnapshot).toHaveBeenNthCalledWith(2, s2, {
        restrictionId: 85,
        description: 'descrição 2',
        rejectingUserId: REJECTING_USER,
      });
    });

    it('deve persistir os ids e os snapshots através do rejectMany', async () => {
      await service.reject(
        D5_NOTE_ID,
        [makeItem(1), makeItem(3)],
        REJECTING_USER,
      );

      expect(repository.rejectMany).toHaveBeenCalledTimes(1);
      expect(repository.rejectMany).toHaveBeenCalledWith(
        [1, 3],
        [
          { id_nota_d5: D5_NOTE_ID, snapshotOf: 1 },
          { id_nota_d5: D5_NOTE_ID, snapshotOf: 3 },
        ],
        10,
      );
    });

    it('deve manter a ordem do payload, e não a ordem devolvida pelo repositório', async () => {
      await service.reject(
        D5_NOTE_ID,
        [makeItem(3), makeItem(1), makeItem(2)],
        REJECTING_USER,
      );

      expect(repository.rejectMany).toHaveBeenCalledWith(
        [3, 1, 2],
        [
          { id_nota_d5: D5_NOTE_ID, snapshotOf: 3 },
          { id_nota_d5: D5_NOTE_ID, snapshotOf: 1 },
          { id_nota_d5: D5_NOTE_ID, snapshotOf: 2 },
        ],
        10,
      );
    });

    it('deve resolver sem retorno em caso de sucesso', async () => {
      await expect(
        service.reject(D5_NOTE_ID, [makeItem(1)], REJECTING_USER),
      ).resolves.toBeUndefined();
    });

    it('não deve tocar no sistema de ficheiros', async () => {
      await service.reject(D5_NOTE_ID, [makeItem(1)], REJECTING_USER);

      expect(storageMock.deleteUploaded).not.toHaveBeenCalled();
    });

    // --- validação de existência ---
    it('deve lançar NotFound listando os ids que não pertencem à nota D5', async () => {
      const call = service.reject(
        D5_NOTE_ID,
        [makeItem(1), makeItem(98), makeItem(99)],
        REJECTING_USER,
      );

      await expect(call).rejects.toThrow(NotFoundException);
      await expect(
        service.reject(
          D5_NOTE_ID,
          [makeItem(1), makeItem(98), makeItem(99)],
          REJECTING_USER,
        ),
      ).rejects.toThrow(
        'Programações não encontradas para esta nota D5: 98, 99',
      );
    });

    it('deve tratar como inexistente uma programação de outra nota D5', async () => {
      // o repositório só devolve as da nota 10; o id 500 pertence a outra
      await expect(
        service.reject(D5_NOTE_ID, [makeItem(500)], REJECTING_USER),
      ).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFound quando a nota não tem nenhuma programação', async () => {
      repository.getByD5NoteId.mockResolvedValue([]);

      await expect(
        service.reject(D5_NOTE_ID, [makeItem(1)], REJECTING_USER),
      ).rejects.toThrow('Programações não encontradas para esta nota D5: 1');
    });

    it('deve ser atómico: um id inexistente impede a reprovação de todos', async () => {
      await expect(
        service.reject(
          D5_NOTE_ID,
          [makeItem(1), makeItem(2), makeItem(99)],
          REJECTING_USER,
        ),
      ).rejects.toThrow(NotFoundException);

      expect(mapper.toRejectionSnapshot).not.toHaveBeenCalled();
      expect(repository.rejectMany).not.toHaveBeenCalled();
    });

    // --- propagação de erros ---
    it('deve propagar falhas ao buscar as programações', async () => {
      repository.getByD5NoteId.mockRejectedValue(new Error('timeout'));

      await expect(
        service.reject(D5_NOTE_ID, [makeItem(1)], REJECTING_USER),
      ).rejects.toThrow('timeout');
      expect(repository.rejectMany).not.toHaveBeenCalled();
    });

    it('deve propagar falhas do mapper sem chamar o rejectMany', async () => {
      mapper.toRejectionSnapshot.mockImplementation(() => {
        throw new Error('snapshot inválido');
      });

      await expect(
        service.reject(D5_NOTE_ID, [makeItem(1)], REJECTING_USER),
      ).rejects.toThrow('snapshot inválido');
      expect(repository.rejectMany).not.toHaveBeenCalled();
    });

    it('deve propagar falhas do rejectMany', async () => {
      repository.rejectMany.mockRejectedValue(new Error('transação falhou'));

      await expect(
        service.reject(D5_NOTE_ID, [makeItem(1)], REJECTING_USER),
      ).rejects.toThrow('transação falhou');
    });
  });
});
