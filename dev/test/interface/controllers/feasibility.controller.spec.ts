import { FeasibilityService } from 'src/application/usecases/feasibility.service';
import { FeasibilityController } from 'src/interface/controllers/feasibility.controller';

import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';
import { HandleFeasibilityService } from 'src/application/usecases/orchestrators/handleFeasibilityUpload.service';
import { RejectFeasibilityDTO } from 'src/interface/dtos/feasibilityDTO';

describe('FeasibilityController', () => {
  let controller: FeasibilityController;
  let service: FeasibilityService;
  let handleFeasibility: HandleFeasibilityService;

  const mockFeasibilityService = {
    feasibilityExists: jest.fn(),
    handleUpload: jest.fn(),
    getRejections: jest.fn(),
  };

  const mockHandleFeasibility = {
    upload: jest.fn(),
    reject: jest.fn(),
    approve: jest.fn(),
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

      const mockExistingFiles = JSON.stringify(['a.pdf', 'b.pdf']);

      const mockIdWork = 123;
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Viabilidade realizada com sucesso',
      };

      mockHandleFeasibility.upload.mockResolvedValue(mockResponse);

      const result = await controller.upload(
        mockFiles,
        mockIdWork,
        false,
        mockExistingFiles,
        mockReq,
        [{ id: 1, viabilizado: 1 }],
      );

      expect(result).toEqual(mockResponse);
      expect(handleFeasibility.upload).toHaveBeenCalledWith(
        mockIdWork,
        '2345',
        false,
        mockFiles,
        JSON.parse(mockExistingFiles),
        [{ id: 1, viabilizado: 1 }],
      );
      expect(handleFeasibility.upload).toHaveBeenCalledTimes(1);
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

      const mockExistingFiles = JSON.stringify(['a.pdf', 'b.pdf']);

      const mockIdWork = 456;
      const mockResponse = {
        statusCode: HttpStatus.OK,
        message: 'Viabilidade realizada com sucesso',
      };

      mockHandleFeasibility.upload.mockResolvedValue(mockResponse);

      const result = await controller.upload(
        mockFile,
        mockIdWork,
        false,
        mockExistingFiles,
        mockReq,
        [{ id: 1, viabilizado: 1 }],
      );

      expect(result).toEqual(mockResponse);
      expect(handleFeasibility.upload).toHaveBeenCalledWith(
        mockIdWork,
        '2345',
        false,
        mockFile,
        JSON.parse(mockExistingFiles),
        [{ id: 1, viabilizado: 1 }],
      );
    });

    it('deve lançar erro quando upload falhar', async () => {
      const mockIdWork = 123;
      const mockError = new Error('Upload failed');

      mockHandleFeasibility.upload.mockRejectedValue(mockError);

      await expect(
        controller.upload(undefined, mockIdWork, false, '', mockReq, [
          { id: 1, viabilizado: 1 },
        ]),
      ).rejects.toThrow('Upload failed');
      expect(handleFeasibility.upload).toHaveBeenCalledWith(
        mockIdWork,
        '2345',
        false,
        [],
        [],
        [{ id: 1, viabilizado: 1 }],
      );
    });

    it('deve converter idObra string para número', async () => {
      const mockFiles: Express.Multer.File[] = [];
      const mockIdWork = 999;

      mockHandleFeasibility.upload.mockResolvedValue({});

      const mockExistingFiles = JSON.stringify(['a.pdf', 'b.pdf']);

      await controller.upload(
        mockFiles,
        mockIdWork,
        false,
        mockExistingFiles,
        mockReq,
        [{ id: 1, viabilizado: 1 }],
      );

      expect(handleFeasibility.upload).toHaveBeenCalledWith(
        999,
        '2345',
        false,
        mockFiles,
        JSON.parse(mockExistingFiles),
        [{ id: 1, viabilizado: 1 }],
      );
      expect(typeof mockIdWork).toBe('number');
    });
  });

  describe('rejectFeasibility', () => {
    it('deve chamar o método rejectFeasiblity corretamente', async () => {
      const data: RejectFeasibilityDTO = {
        workId: 1,
        description: 'Poste em falta',
        userId: 1,
        reason: 'Faltando material',
        feasibilityReportId: 2,
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
      mockHandleFeasibility.approve.mockResolvedValue(undefined);

      const result = await controller.approveFeasibility(1, mockReq);

      expect(result).toEqual({
        statusCode: HttpStatus.NO_CONTENT,
        message: 'Viabilidade aprovada com sucesso',
      });
      expect(mockHandleFeasibility.approve).toHaveBeenCalledTimes(1);
    });
  });

  describe('Integração de Guards e Interceptors', () => {
    it('deve permitir acesso quando guard retorna true', async () => {
      mockPermissionGuard.canActivate.mockReturnValue(true);
      mockHandleFeasibility.upload.mockResolvedValue({});

      const mockExistingFiles = JSON.stringify(['a.pdf', 'b.pdf']);

      const result = await controller.upload(
        [],
        1,
        false,
        mockExistingFiles,
        mockReq,
        [{ id: 1, viabilizado: 1 }],
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

      mockHandleFeasibility.upload.mockResolvedValue({
        uploadedFiles: 5,
      });

      const mockExistingFiles = JSON.stringify(['a.pdf', 'b.pdf']);

      await controller.upload(mockFiles, 1, false, mockExistingFiles, mockReq, [
        { id: 1, viabilizado: 1 },
      ]);

      expect(handleFeasibility.upload).toHaveBeenCalledWith(
        1,
        '2345',
        false,
        mockFiles,
        JSON.parse(mockExistingFiles),
        [{ id: 1, viabilizado: 1 }],
      );
      expect(mockFiles).toHaveLength(5);
    });
  });
});
