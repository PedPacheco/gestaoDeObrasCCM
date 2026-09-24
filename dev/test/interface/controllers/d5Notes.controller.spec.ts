import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { FindD5NotesService } from 'src/application/usecases/d5Notes/notes/findD5Notes.service';
import { FindD5SchedulesService } from 'src/application/usecases/d5Notes/schedules/findD5Schedules.service';
import { ManageD5NoteScheduleService } from 'src/application/usecases/d5Notes/schedules/manageD5NoteSchedule.service';
import { D5NotesController } from 'src/interface/controllers/d5Notes.controller';
import {
  CreateProgramacaoD5Dto,
  D5NotesFiltersDTO,
  D5NotesSchedulesFiltersDTO,
  UpdateScheduleD5Dto,
} from 'src/interface/dtos/d5NotesDTO';

// ---------------------------------------------------------------------------
// Mocks dos guards (evita dependências de autenticação/permissões nos testes)
// ---------------------------------------------------------------------------
jest.mock('src/core/guards/newPermission.guard', () => ({
  AreaViewGuard: jest.fn(
    () =>
      class {
        canActivate = () => true;
      },
  ),
  AreaEditGuard: jest.fn(
    () =>
      class {
        canActivate = () => true;
      },
  ),
}));

describe('D5NotesController', () => {
  let controller: D5NotesController;

  const findD5NotesService = {
    get: jest.fn(),
    getById: jest.fn(),
  };

  const findD5SchedulesService = {
    findD5NotesSchedules: jest.fn(),
    findByD5NoteId: jest.fn(),
  };

  const manageD5NoteScheduleService = {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  beforeAll(() => {
    // Silencia o console.log existente no getAll sem perder a asserção
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [D5NotesController],
      providers: [
        { provide: FindD5NotesService, useValue: findD5NotesService },
        { provide: FindD5SchedulesService, useValue: findD5SchedulesService },
        {
          provide: ManageD5NoteScheduleService,
          useValue: manageD5NoteScheduleService,
        },
      ],
    }).compile();

    controller = module.get<D5NotesController>(D5NotesController);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(() => jest.restoreAllMocks());

  it('deve estar definido', () => {
    expect(controller).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // GET /notas-d5
  // -------------------------------------------------------------------------
  describe('getAll', () => {
    const filters = { page: 1, limit: 10 } as unknown as D5NotesFiltersDTO;

    it('deve retornar as notas D5 com o envelope de resposta correto', async () => {
      const data = [{ id: 1 }, { id: 2 }];
      findD5NotesService.get.mockResolvedValue(data);

      const result = await controller.getAll(filters);

      expect(findD5NotesService.get).toHaveBeenCalledTimes(1);
      expect(findD5NotesService.get).toHaveBeenCalledWith(filters);
      expect(console.log).toHaveBeenCalledWith(data);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Notas D5 retornadas com sucesso',
        data,
      });
    });

    it('deve propagar erros do serviço', async () => {
      const error = new Error('falha ao buscar notas');
      findD5NotesService.get.mockRejectedValue(error);

      await expect(controller.getAll(filters)).rejects.toThrow(error);
    });
  });

  // -------------------------------------------------------------------------
  // GET /notas-d5/programacoes
  // -------------------------------------------------------------------------
  describe('getSchedules', () => {
    const filters = {
      notaId: 10,
    } as unknown as D5NotesSchedulesFiltersDTO;

    it('deve retornar as programações filtradas', async () => {
      const data = [{ id: 99 }];
      findD5SchedulesService.findD5NotesSchedules.mockResolvedValue(data);

      const result = await controller.getSchedules(filters);

      expect(findD5SchedulesService.findD5NotesSchedules).toHaveBeenCalledWith(
        filters,
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Programações da Nota D5 retornado com sucesso',
        data,
      });
    });

    it('deve propagar erros do serviço', async () => {
      const error = new Error('falha nas programações');
      findD5SchedulesService.findD5NotesSchedules.mockRejectedValue(error);

      await expect(controller.getSchedules(filters)).rejects.toThrow(error);
    });
  });

  // -------------------------------------------------------------------------
  // GET /notas-d5/:id
  // -------------------------------------------------------------------------
  describe('getById', () => {
    it('deve retornar os detalhes da nota D5', async () => {
      const data = { id: 5, descricao: 'Nota teste' };
      findD5NotesService.getById.mockResolvedValue(data);

      const result = await controller.getById(5);

      expect(findD5NotesService.getById).toHaveBeenCalledWith(5);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Detalhes da nota D5 retornado com sucesso',
        data,
      });
    });

    it('deve propagar erros do serviço (ex.: NotFound)', async () => {
      const error = new Error('Nota não encontrada');
      findD5NotesService.getById.mockRejectedValue(error);

      await expect(controller.getById(404)).rejects.toThrow(error);
    });
  });

  // -------------------------------------------------------------------------
  // GET /notas-d5/programacoes/:id
  // -------------------------------------------------------------------------
  describe('getSchedulesByD5NoteId', () => {
    it('deve retornar as programações da nota informada', async () => {
      const data = [{ id: 1, notaId: 7 }];
      findD5SchedulesService.findByD5NoteId.mockResolvedValue(data);

      const result = await controller.getSchedulesByD5NoteId(7);

      expect(findD5SchedulesService.findByD5NoteId).toHaveBeenCalledWith(7);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Programações da Nota D5 retornado com sucesso',
        data,
      });
    });

    it('deve propagar erros do serviço', async () => {
      const error = new Error('erro inesperado');
      findD5SchedulesService.findByD5NoteId.mockRejectedValue(error);

      await expect(controller.getSchedulesByD5NoteId(7)).rejects.toThrow(error);
    });
  });

  // -------------------------------------------------------------------------
  // POST /notas-d5/programacoes
  // -------------------------------------------------------------------------
  describe('createD5NoteSchedule', () => {
    const dto = {
      notaId: 1,
      dataInicio: '2026-01-01',
    } as unknown as CreateProgramacaoD5Dto;

    it('deve criar a programação e retornar sucesso', async () => {
      manageD5NoteScheduleService.create.mockResolvedValue(undefined);

      const result = await controller.createD5NoteSchedule(dto);

      expect(manageD5NoteScheduleService.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Programação para Nota D5 criada com sucesso',
      });
    });

    it('deve propagar erros de criação', async () => {
      const error = new Error('dados inválidos');
      manageD5NoteScheduleService.create.mockRejectedValue(error);

      await expect(controller.createD5NoteSchedule(dto)).rejects.toThrow(error);
    });
  });

  // -------------------------------------------------------------------------
  // PUT /notas-d5/programacoes/:id
  // -------------------------------------------------------------------------
  describe('updateD5NotesSchedule', () => {
    const dto = { status: 'CONCLUIDA' } as unknown as UpdateScheduleD5Dto;
    const files = [
      { originalname: 'anexo.pdf' },
    ] as unknown as Express.Multer.File[];
    const req = { user: { sub: 'user-123' } };

    it('deve atualizar a programação com ficheiros e utilizador autenticado', async () => {
      manageD5NoteScheduleService.update.mockResolvedValue(undefined);

      const result = await controller.updateD5NotesSchedule(
        15,
        files,
        dto,
        req,
      );

      expect(manageD5NoteScheduleService.update).toHaveBeenCalledWith(
        15,
        dto,
        files,
        'user-123',
      );
      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Programação atualizada com sucesso',
      });
    });

    it('deve atualizar mesmo sem ficheiros enviados', async () => {
      manageD5NoteScheduleService.update.mockResolvedValue(undefined);

      await controller.updateD5NotesSchedule(15, [], dto, req);

      expect(manageD5NoteScheduleService.update).toHaveBeenCalledWith(
        15,
        dto,
        [],
        'user-123',
      );
    });

    it('deve propagar erros de atualização', async () => {
      const error = new Error('programação inexistente');
      manageD5NoteScheduleService.update.mockRejectedValue(error);

      await expect(
        controller.updateD5NotesSchedule(15, files, dto, req),
      ).rejects.toThrow(error);
    });

    it('deve falhar se o utilizador não estiver presente no request', async () => {
      await expect(
        controller.updateD5NotesSchedule(15, files, dto, {} as any),
      ).rejects.toThrow(TypeError);
    });
  });

  // -------------------------------------------------------------------------
  // DELETE /notas-d5/programacoes/:id
  // -------------------------------------------------------------------------
  describe('deleteSchedule', () => {
    it('deve eliminar a programação e retornar NO_CONTENT', async () => {
      manageD5NoteScheduleService.delete.mockResolvedValue(undefined);

      const result = await controller.deleteSchedule(3);

      expect(manageD5NoteScheduleService.delete).toHaveBeenCalledWith(3);
      expect(result).toEqual({
        statusCode: HttpStatus.NO_CONTENT,
        message: 'Relatório excluído com sucesso',
      });
    });

    it('deve propagar erros de eliminação', async () => {
      const error = new Error('não foi possível excluir');
      manageD5NoteScheduleService.delete.mockRejectedValue(error);

      await expect(controller.deleteSchedule(3)).rejects.toThrow(error);
    });
  });
});
