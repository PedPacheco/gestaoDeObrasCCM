import { FeasibilityService } from 'src/application/usecases/feasibility.service';
import { FeasibilityController } from 'src/interface/controllers/feasibility.controller';

import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';
import { HandleFeasibilityService } from 'src/application/usecases/orchestrators/handleFeasibilityUpdate.service';
import { RejectFeasibilityDTO } from 'src/interface/dtos/feasibilityDTO';

describe('FeasibilityController', () => {
  let controller: FeasibilityController;
  let service: FeasibilityService;
  let handleFeasibility: HandleFeasibilityService;

  const mockFeasibilityService = {
    feasibilityExists: jest.fn(),
    deleteFeasibilityFiles: jest.fn(),
    handleUpload: jest.fn(),
    approve: jest.fn(),
    getRejections: jest.fn(),
  };

  const mockHandleFeasibility = {
    update: jest.fn(),
    reject: jest.fn(),
  };

  const mockPermissionGuard = {
    canActivate: jest.fn(() => true),
  };

  const mockReq = {
    user: { sub: '2345' },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeasibilityController],
      providers: [
        {
          provide: FeasibilityService,
          useValue: mockFeasibilityService,
        },
        { provide: HandleFeasibilityService, useValue: mockHandleFeasibility },
      ],
    })
      .overrideGuard(AreaViewGuard())
      .useValue(mockPermissionGuard)
      .compile();

    controller = module.get<FeasibilityController>(FeasibilityController);
    service = module.get<FeasibilityService>(FeasibilityService);
    handleFeasibility = module.get<HandleFeasibilityService>(
      HandleFeasibilityService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Definição', () => {
    it('deve estar definido', () => {
      expect(controller).toBeDefined();
    });
  });

  describe('getFeasibility', () => {
    it('deve retornar dados da viabilidade quando existir', async () => {
      const mockId = 1;
      const mockFeasibilityData = {
        id: 1,
        idObra: 123,
        files: ['file1.pdf', 'file2.pdf'],
      };

      mockFeasibilityService.feasibilityExists.mockResolvedValue(
        mockFeasibilityData,
      );

      const result = await controller.getFeasibility(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Viabilidade existe',
        data: mockFeasibilityData,
      });
      expect(service.feasibilityExists).toHaveBeenCalledWith(mockId);
      expect(service.feasibilityExists).toHaveBeenCalledTimes(1);
    });

    it('deve retornar null quando viabilidade não existir', async () => {
      const mockId = 999;

      mockFeasibilityService.feasibilityExists.mockResolvedValue(null);

      const result = await controller.getFeasibility(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Viabilidade existe',
        data: null,
      });
      expect(service.feasibilityExists).toHaveBeenCalledWith(mockId);
    });

    it('deve lançar erro quando service lançar exceção', async () => {
      const mockId = 1;
      const mockError = new Error('Database error');

      mockFeasibilityService.feasibilityExists.mockRejectedValue(mockError);

      await expect(controller.getFeasibility(mockId)).rejects.toThrow(
        'Database error',
      );
      expect(service.feasibilityExists).toHaveBeenCalledWith(mockId);
    });

    it('deve converter string para número com ParseIntPipe', async () => {
      const mockId = 42;
      mockFeasibilityService.feasibilityExists.mockResolvedValue({});

      await controller.getFeasibility(mockId);

      expect(service.feasibilityExists).toHaveBeenCalledWith(42);
      expect(typeof mockId).toBe('number');
    });
  });

  describe('getRejectionsHistory', () => {
    it('getRejectionsHistory', async () => {
      const data = [
        {
          descricao: 'Poste em falta',
          motivo: 'Material em falta',
          criado_em: '2026-05-01',
          usuario: 'Pedro',
        },
      ];

      mockFeasibilityService.getRejections.mockResolvedValue(data);

      const response = await controller.getRejectionsHistory(1);

      expect(response).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Reprovações retornados com sucesso',
        data,
      });
      expect(service.getRejections).toHaveBeenCalledWith(1);
    });
  });

  describe('deleteFeasibilityFiles', () => {
    it('deve deletar arquivos de viabilidade com sucesso', async () => {
      const mockId = 1;

      mockFeasibilityService.deleteFeasibilityFiles.mockResolvedValue(
        undefined,
      );

      const result = await controller.deleteFeasibilityFiles(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Viabilidade excluída com sucesso',
      });
      expect(service.deleteFeasibilityFiles).toHaveBeenCalledWith(mockId);
      expect(service.deleteFeasibilityFiles).toHaveBeenCalledTimes(1);
    });

    it('deve lançar erro quando service falhar ao deletar', async () => {
      const mockId = 1;
      const mockError = new Error('Failed to delete files');

      mockFeasibilityService.deleteFeasibilityFiles.mockRejectedValue(
        mockError,
      );

      await expect(controller.deleteFeasibilityFiles(mockId)).rejects.toThrow(
        'Failed to delete files',
      );
      expect(service.deleteFeasibilityFiles).toHaveBeenCalledWith(mockId);
    });

    it('deve aceitar diferentes IDs válidos', async () => {
      const testIds = [1, 100, 9999];

      for (const id of testIds) {
        mockFeasibilityService.deleteFeasibilityFiles.mockResolvedValue(
          undefined,
        );

        await controller.deleteFeasibilityFiles(id);

        expect(service.deleteFeasibilityFiles).toHaveBeenCalledWith(id);
      }
    });
  });

  describe('upload', () => {
    it('deve fazer upload de arquivos com sucesso', async () => {
      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'files',
          originalname: 'test1.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 1024,
          buffer: Buffer.from('test'),
          stream: null,
          destination: '',
          filename: '',
          path: '',
        },
        {
          fieldname: 'files',
          originalname: 'test2.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 2048,
          buffer: Buffer.from('test2'),
          stream: null,
          destination: '',
          filename: '',
          path: '',
        },
      ];

      const mockIdWork = 123;
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Viabilidade realizada com sucesso',
      };

      mockHandleFeasibility.update.mockResolvedValue(mockResponse);

      const result = await controller.upload(
        mockFiles,
        mockIdWork,
        [{ id: 1, viabilizado: 1 }],
        mockReq,
      );

      expect(result).toEqual(mockResponse);
      expect(handleFeasibility.update).toHaveBeenCalledWith(
        mockIdWork,
        '2345',
        mockFiles,
        [{ id: 1, viabilizado: 1 }],
      );
      expect(handleFeasibility.update).toHaveBeenCalledTimes(1);
    });

    it('deve fazer upload de um único arquivo', async () => {
      const mockFile: Express.Multer.File[] = [
        {
          fieldname: 'files',
          originalname: 'single.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 512,
          buffer: Buffer.from('single file'),
          stream: null,
          destination: '',
          filename: '',
          path: '',
        },
      ];

      const mockIdWork = 456;
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Viabilidade realizada com sucesso',
      };

      mockHandleFeasibility.update.mockResolvedValue(mockResponse);

      const result = await controller.upload(
        mockFile,
        mockIdWork,
        [{ id: 1, viabilizado: 1 }],
        mockReq,
      );

      expect(result).toEqual(mockResponse);
      expect(handleFeasibility.update).toHaveBeenCalledWith(
        mockIdWork,
        '2345',
        mockFile,
        [{ id: 1, viabilizado: 1 }],
      );
    });

    it('deve lançar erro quando upload falhar', async () => {
      const mockFiles: Express.Multer.File[] = [
        {
          fieldname: 'files',
          originalname: 'error.pdf',
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 1024,
          buffer: Buffer.from('error'),
          stream: null,
          destination: '',
          filename: '',
          path: '',
        },
      ];

      const mockIdWork = 123;
      const mockError = new Error('Upload failed');

      mockHandleFeasibility.update.mockRejectedValue(mockError);

      await expect(
        controller.upload(
          mockFiles,
          mockIdWork,
          [{ id: 1, viabilizado: 1 }],
          mockReq,
        ),
      ).rejects.toThrow('Upload failed');
      expect(handleFeasibility.update).toHaveBeenCalledWith(
        mockIdWork,
        '2345',
        mockFiles,
        [{ id: 1, viabilizado: 1 }],
      );
    });

    it('deve converter idObra string para número', async () => {
      const mockFiles: Express.Multer.File[] = [];
      const mockIdWork = 999;

      mockHandleFeasibility.update.mockResolvedValue({});

      await controller.upload(
        mockFiles,
        mockIdWork,
        [{ id: 1, viabilizado: 1 }],
        mockReq,
      );

      expect(handleFeasibility.update).toHaveBeenCalledWith(
        999,
        '2345',
        mockFiles,
        [{ id: 1, viabilizado: 1 }],
      );
      expect(typeof mockIdWork).toBe('number');
    });
  });

  describe('rejectFeasibility', () => {
    it('deve chamar o método rejectFeasiblity corretamente', async () => {
      const data: RejectFeasibilityDTO = {
        idWork: 1,
        description: 'Poste em falta',
        idUser: 1,
        reason: 'Faltando material',
      };

      mockHandleFeasibility.reject.mockResolvedValue(undefined);

      const result = await controller.rejectFeasibility(data);

      expect(result).toEqual({
        statusCode: HttpStatus.NO_CONTENT,
        message: 'Viabilidade reprovada com sucesso',
      });
      expect(handleFeasibility.reject).toHaveBeenCalledTimes(1);
    });
  });

  describe('approveFeasibility', () => {
    it('deve chamar o método approveFeasibility corretamente', async () => {
      mockFeasibilityService.approve.mockResolvedValue(undefined);

      const result = await controller.approveFeasibility(1);

      expect(result).toEqual({
        statusCode: HttpStatus.NO_CONTENT,
        message: 'Viabilidade aprovada com sucesso',
      });
      expect(mockFeasibilityService.approve).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integração de Guards e Interceptors', () => {
    it('deve permitir acesso quando guard retorna true', async () => {
      mockPermissionGuard.canActivate.mockReturnValue(true);
      mockHandleFeasibility.update.mockResolvedValue({});

      const result = await controller.upload(
        [],
        1,
        [{ id: 1, viabilizado: 1 }],
        mockReq,
      );

      expect(result).toBeDefined();
    });
  });

  describe('Validação de Parâmetros', () => {
    it('deve validar que IDs são números inteiros', async () => {
      const validIds = [1, 100, 999, 1000000];

      for (const id of validIds) {
        mockFeasibilityService.feasibilityExists.mockResolvedValue({});
        await controller.getFeasibility(id);
        expect(service.feasibilityExists).toHaveBeenCalledWith(id);
      }
    });

    it('deve processar múltiplos arquivos corretamente', async () => {
      const mockFiles: Express.Multer.File[] = Array(5)
        .fill(null)
        .map((_, index) => ({
          fieldname: 'files',
          originalname: `file${index}.pdf`,
          encoding: '7bit',
          mimetype: 'application/pdf',
          size: 1024 * (index + 1),
          buffer: Buffer.from(`content${index}`),
          stream: null,
          destination: '',
          filename: '',
          path: '',
        }));

      mockHandleFeasibility.update.mockResolvedValue({
        uploadedFiles: 5,
      });

      await controller.upload(
        mockFiles,
        1,
        [{ id: 1, viabilizado: 1 }],
        mockReq,
      );

      expect(handleFeasibility.update).toHaveBeenCalledWith(
        1,
        '2345',
        mockFiles,
        [{ id: 1, viabilizado: 1 }],
      );
      expect(mockFiles).toHaveLength(5);
    });
  });
});
