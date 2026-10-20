import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ManageD5NoteService } from 'src/application/usecases/d5Notes/notes/manageD5Note.service';
import { ID5NotesRepository } from 'src/domain/repositories/d5Notes/ID5notesRepository';
import { UpdateD5NoteDTO } from 'src/interface/dtos/d5NotesDTO';

const makePrismaError = (code: string) =>
  new Prisma.PrismaClientKnownRequestError('erro', {
    code,
    clientVersion: '5.0.0',
  });

describe('ManageD5NoteService', () => {
  let service: ManageD5NoteService;
  let repository: jest.Mocked<Pick<ID5NotesRepository, 'getById' | 'update'>>;

  const NOTE_ID = 1;
  const USER_ID = 99;
  const DATA: UpdateD5NoteDTO = { partnerId: 3 };

  beforeEach(() => {
    repository = {
      getById: jest.fn().mockResolvedValue({ id: NOTE_ID }),
      update: jest.fn().mockResolvedValue(undefined),
    };
    service = new ManageD5NoteService(
      repository as unknown as ID5NotesRepository,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  describe('validação do payload', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['objeto vazio', {}],
    ])('deve lançar BadRequest quando o payload é %s', async (_l, payload) => {
      await expect(
        service.update(NOTE_ID, payload as UpdateD5NoteDTO, USER_ID),
      ).rejects.toThrow(BadRequestException);

      expect(repository.getById).not.toHaveBeenCalled();
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('deve usar a mensagem correta', async () => {
      await expect(
        service.update(NOTE_ID, {} as UpdateD5NoteDTO, USER_ID),
      ).rejects.toThrow('Nenhum campo fornecido para atualização.');
    });
  });

  describe('nota inexistente', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
    ])('deve lançar NotFound quando getById devolve %s', async (_l, value) => {
      repository.getById.mockResolvedValue(value as never);

      await expect(service.update(NOTE_ID, DATA, USER_ID)).rejects.toThrow(
        new NotFoundException('Nota D5 não encontrada.'),
      );
      expect(repository.update).not.toHaveBeenCalled();
    });

    it('deve propagar erros do getById sem conversão', async () => {
      const error = new Error('falha de conexão');
      repository.getById.mockRejectedValue(error);

      await expect(service.update(NOTE_ID, DATA, USER_ID)).rejects.toBe(error);
      expect(repository.update).not.toHaveBeenCalled();
    });
  });

  describe('atualização com sucesso', () => {
    it('deve verificar a existência e delegar ao repositório', async () => {
      await expect(
        service.update(NOTE_ID, DATA, USER_ID),
      ).resolves.toBeUndefined();

      expect(repository.getById).toHaveBeenCalledWith(NOTE_ID);
      expect(repository.update).toHaveBeenCalledWith(NOTE_ID, DATA, USER_ID);
    });

    it('deve consultar antes de atualizar', async () => {
      await service.update(NOTE_ID, DATA, USER_ID);

      expect(repository.getById.mock.invocationCallOrder[0]).toBeLessThan(
        repository.update.mock.invocationCallOrder[0],
      );
    });

    it.each([
      ['apenas parceira', { partnerId: 3 }],
      ['apenas status', { statusId: 7 }],
      ['apenas observação', { observation: 'texto' }],
      ['todos os campos', { partnerId: 3, statusId: 7, observation: 'txt' }],
    ])('deve aceitar %s', async (_l, payload) => {
      await service.update(NOTE_ID, payload, USER_ID);
      expect(repository.update).toHaveBeenCalledWith(NOTE_ID, payload, USER_ID);
    });
  });

  describe('erros do Prisma no update', () => {
    it('deve converter P2025 em NotFoundException', async () => {
      repository.update.mockRejectedValue(makePrismaError('P2025'));

      await expect(service.update(NOTE_ID, DATA, USER_ID)).rejects.toThrow(
        new NotFoundException('Nota D5 não encontrada.'),
      );
    });

    it('deve converter P2003 em BadRequestException', async () => {
      repository.update.mockRejectedValue(makePrismaError('P2003'));

      await expect(service.update(NOTE_ID, DATA, USER_ID)).rejects.toThrow(
        new BadRequestException('Parceira ou status inexistente.'),
      );
    });

    it('deve propagar outros códigos do Prisma', async () => {
      const error = makePrismaError('P2002');
      repository.update.mockRejectedValue(error);

      await expect(service.update(NOTE_ID, DATA, USER_ID)).rejects.toBe(error);
    });

    it('deve propagar erros que não são do Prisma', async () => {
      const error = new Error('timeout');
      repository.update.mockRejectedValue(error);

      await expect(service.update(NOTE_ID, DATA, USER_ID)).rejects.toBe(error);
    });
  });
});
