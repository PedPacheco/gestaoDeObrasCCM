import { join } from 'path';
import { D5NoteScheduleMapper } from 'src/application/mappers/d5NotesScheduleMapper';
import { ManageD5NoteScheduleService } from 'src/application/usecases/d5Notes/schedules/manageD5NoteSchedule.service';
import { FileService } from 'src/application/usecases/file.service';
import { D5NoteSchedule } from 'src/domain/entities/schedules/d5NotesSchedule.entity';
import { D5_NOTES_SCHEDULES_REPOSITORY } from 'src/domain/repositories/d5Notes/ID5NotesSchedulesRepository';
import { resolveFileDiff } from 'src/domain/services/resolveFileDiff.service';
import {
  CreateProgramacaoD5Dto,
  UpdateScheduleD5Dto,
} from 'src/interface/dtos/d5NotesDTO';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

// ---------------------------------------------------------------------------
// Mocks de colaboradores
// ---------------------------------------------------------------------------
jest.mock('src/application/mappers/d5NotesScheduleMapper', () => ({
  D5NoteScheduleMapper: {
    fromCreateInput: jest.fn(),
    fromUpdateInput: jest.fn(),
    toDomain: jest.fn(),
    toPersistenceCreate: jest.fn(),
    toPersistenceUpdate: jest.fn(),
  },
}));

jest.mock('src/domain/entities/schedules/D5NotesSchedule.entity', () => ({
  D5NoteSchedule: { create: jest.fn() },
}));

jest.mock('src/domain/services/resolveFileDiff.service', () => ({
  resolveFileDiff: jest.fn(),
}));

const mapper = D5NoteScheduleMapper as jest.Mocked<typeof D5NoteScheduleMapper>;
const entity = D5NoteSchedule as jest.Mocked<typeof D5NoteSchedule>;
const fileDiff = resolveFileDiff as jest.MockedFunction<typeof resolveFileDiff>;

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
    ...overrides,
  }) as unknown as D5NoteSchedule;

describe('ManageD5NoteScheduleService', () => {
  let service: ManageD5NoteScheduleService;
  let loggerErrorSpy: jest.SpyInstance;

  const repository = {
    create: jest.fn(),
    getById: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const fileService = { deleteMany: jest.fn() };

  beforeEach(async () => {
    process.env.UPLOAD_AS_BUILD = UPLOAD_DIR;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ManageD5NoteScheduleService,
        { provide: D5_NOTES_SCHEDULES_REPOSITORY, useValue: repository },
        { provide: FileService, useValue: fileService },
      ],
    }).compile();

    service = module.get(ManageD5NoteScheduleService);

    loggerErrorSpy = jest
      .spyOn((service as any).logger, 'error')
      .mockImplementation(() => undefined);
    fileService.deleteMany.mockResolvedValue(undefined);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(() => jest.restoreAllMocks());

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
      expect(repository.create).toHaveBeenCalledWith(persistence);
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
    } as unknown as UpdateScheduleD5Dto;

    /** Prepara o caminho feliz completo. */
    const arrangeHappyPath = (
      overrides: {
        existing?: Record<string, unknown>;
        finalPaths?: string[];
        toRemove?: string[];
      } = {},
    ) => {
      const existing = overrides.existing ?? makeExisting();
      const current = makeCurrent();

      repository.getById.mockResolvedValue(existing);
      mapper.toDomain.mockReturnValue(current);
      fileDiff.mockReturnValue({
        finalPaths: overrides.finalPaths ?? ['antigo.pdf', 'novo.pdf'],
        toRemove: overrides.toRemove ?? ['obsoleto.pdf'],
      } as any);
      mapper.fromUpdateInput.mockReturnValue({} as any);
      entity.create.mockReturnValue({ id: 1 } as any);
      mapper.toPersistenceUpdate.mockReturnValue({ obs: 'x' } as any);
      repository.update.mockResolvedValue(undefined);

      return { existing, current };
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
        expect(fileService.deleteMany).not.toHaveBeenCalled();
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
      expect(repository.update).toHaveBeenCalledWith(1, { obs: 'x' });
      expect(fileService.deleteMany).toHaveBeenCalledTimes(1);
      expect(fileService.deleteMany).toHaveBeenCalledWith(
        [join(UPLOAD_DIR, 'obsoleto.pdf')],
        UPLOAD_DIR,
      );
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

      expect(fileService.deleteMany).toHaveBeenCalledWith([], UPLOAD_DIR);
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

        expect(fileService.deleteMany).toHaveBeenCalledWith(
          ['/tmp/abs/novo.pdf'],
          UPLOAD_DIR,
        );
        expect(repository.update).not.toHaveBeenCalled();
        expect(loggerErrorSpy).not.toHaveBeenCalled();
      });

      it('deve fazer rollback quando o repositório falha na leitura', async () => {
        repository.getById.mockRejectedValue(new Error('timeout'));
        const files = [makeFile('a.pdf', '/tmp/a.pdf')];

        await expect(service.update(1, dto, files, 20)).rejects.toThrow(
          'timeout',
        );
        expect(fileService.deleteMany).toHaveBeenCalledWith(
          ['/tmp/a.pdf'],
          UPLOAD_DIR,
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

        expect(repository.update).not.toHaveBeenCalled();
        expect(fileService.deleteMany).toHaveBeenCalledWith(
          ['/tmp/dup.pdf'],
          UPLOAD_DIR,
        );
      });

      it('deve fazer rollback quando a escrita no repositório falha', async () => {
        arrangeHappyPath();
        repository.update.mockRejectedValue(new Error('constraint violada'));
        const files = [makeFile('b.pdf', '/tmp/b.pdf')];

        await expect(service.update(1, dto, files, 20)).rejects.toThrow(
          'constraint violada',
        );
        expect(fileService.deleteMany).toHaveBeenCalledWith(
          ['/tmp/b.pdf'],
          UPLOAD_DIR,
        );
      });

      // --- committed = true: não há rollback dos novos ficheiros ---
      it('não deve remover os novos uploads quando a limpeza pós-commit falha', async () => {
        arrangeHappyPath();
        fileService.deleteMany.mockRejectedValueOnce(new Error('EACCES'));
        const files = [makeFile('c.pdf', '/tmp/c.pdf')];

        await expect(service.update(1, dto, files, 20)).rejects.toThrow(
          'EACCES',
        );

        // a escrita foi confirmada: os ficheiros novos têm de permanecer em disco
        expect(repository.update).toHaveBeenCalledTimes(1);
        expect(fileService.deleteMany).toHaveBeenCalledTimes(1);
        expect(fileService.deleteMany).not.toHaveBeenCalledWith(
          ['/tmp/c.pdf'],
          UPLOAD_DIR,
        );
        expect(loggerErrorSpy).not.toHaveBeenCalled();
      });

      // --- falha do próprio rollback: erro original preservado ---
      it('deve preservar o erro de negócio quando o próprio rollback falha', async () => {
        repository.getById.mockResolvedValue(null);
        fileService.deleteMany.mockRejectedValue(new Error('disco ocupado'));

        await expect(
          service.update(1, dto, [makeFile('d.pdf', '/tmp/d.pdf')], 20),
        ).rejects.toThrow('Programação não encontrada.');

        expect(fileService.deleteMany).toHaveBeenCalledWith(
          ['/tmp/d.pdf'],
          UPLOAD_DIR,
        );
        expect(repository.update).not.toHaveBeenCalled();
      });

      it('deve registar em log a falha de limpeza com a stack do erro', async () => {
        repository.getById.mockResolvedValue(null);
        const cleanupError = new Error('disco ocupado');
        fileService.deleteMany.mockRejectedValue(cleanupError);

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
        fileService.deleteMany.mockRejectedValue('falha string');

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

        expect(fileService.deleteMany).toHaveBeenCalledWith([], UPLOAD_DIR);
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
      expect(fileService.deleteMany).not.toHaveBeenCalled();
    });

    it('deve eliminar o registo antes de limpar o disco', async () => {
      const ordem: string[] = [];
      repository.getById.mockResolvedValue(
        makeExisting({ caminhos_arquivos: ['a.pdf', 'b.pdf'] }),
      );
      repository.delete.mockImplementation(async () => {
        ordem.push('repositorio');
      });
      fileService.deleteMany.mockImplementation(async () => {
        ordem.push('disco');
      });

      await service.delete(5);

      expect(ordem).toEqual(['repositorio', 'disco']);
      expect(fileService.deleteMany).toHaveBeenCalledWith(
        [join(UPLOAD_DIR, 'a.pdf'), join(UPLOAD_DIR, 'b.pdf')],
        UPLOAD_DIR,
      );
    });

    it('deve tratar caminhos_arquivos null como lista vazia', async () => {
      repository.getById.mockResolvedValue(
        makeExisting({ caminhos_arquivos: null }),
      );
      repository.delete.mockResolvedValue(undefined);

      await service.delete(5);

      expect(fileService.deleteMany).toHaveBeenCalledWith([], UPLOAD_DIR);
    });

    it('deve propagar falhas do repositório sem tocar no disco', async () => {
      repository.getById.mockResolvedValue(makeExisting());
      repository.delete.mockRejectedValue(new Error('FK em uso'));

      await expect(service.delete(5)).rejects.toThrow('FK em uso');
      expect(fileService.deleteMany).not.toHaveBeenCalled();
    });

    it('deve propagar falhas da limpeza de ficheiros', async () => {
      repository.getById.mockResolvedValue(makeExisting());
      repository.delete.mockResolvedValue(undefined);
      fileService.deleteMany.mockRejectedValue(new Error('ENOENT'));

      await expect(service.delete(5)).rejects.toThrow('ENOENT');
      expect(repository.delete).toHaveBeenCalledWith(5);
    });

    it('deve resolver sem retorno em caso de sucesso', async () => {
      repository.getById.mockResolvedValue(makeExisting());
      repository.delete.mockResolvedValue(undefined);

      await expect(service.delete(5)).resolves.toBeUndefined();
    });
  });
});
