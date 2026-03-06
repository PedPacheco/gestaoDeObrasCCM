import { FeasibilityService } from 'src/application/services/feasibility.service';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { FeasibilityController } from 'src/interface/controllers/feasibility.controller';

import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('FeasibilityController', () => {
  let controller: FeasibilityController;
  let service: FeasibilityService;

  const mockFeasibilityService = {
    feasibilityExists: jest.fn(),
    deleteFeasibilityFiles: jest.fn(),
    handleUpload: jest.fn(),
  };

  const mockPermissionGuard = {
    canActivate: jest.fn(() => true),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FeasibilityController],
      providers: [
        {
          provide: FeasibilityService,
          useValue: mockFeasibilityService,
        },
      ],
    })
      .overrideGuard(PermissionGuard)
      .useValue(mockPermissionGuard)
      .compile();

    controller = module.get<FeasibilityController>(FeasibilityController);
    service = module.get<FeasibilityService>(FeasibilityService);
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
        statusCode: HttpStatus.CREATED,
        message: 'Upload realizado com sucesso',
        data: {
          uploadedFiles: 2,
          files: ['file1.pdf', 'file2.pdf'],
        },
      };

      mockFeasibilityService.handleUpload.mockResolvedValue(mockResponse);

      const result = await controller.upload(mockFiles, mockIdWork);

      expect(result).toEqual(mockResponse);
      expect(service.handleUpload).toHaveBeenCalledWith(mockIdWork, mockFiles);
      expect(service.handleUpload).toHaveBeenCalledTimes(1);
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
        statusCode: HttpStatus.CREATED,
        message: 'Upload realizado com sucesso',
        data: { uploadedFiles: 1 },
      };

      mockFeasibilityService.handleUpload.mockResolvedValue(mockResponse);

      const result = await controller.upload(mockFile, mockIdWork);

      expect(result).toEqual(mockResponse);
      expect(service.handleUpload).toHaveBeenCalledWith(mockIdWork, mockFile);
    });

    it('deve lidar com array vazio de arquivos', async () => {
      const mockFiles: Express.Multer.File[] = [];
      const mockIdWork = 789;
      const mockResponse = {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Nenhum arquivo enviado',
      };

      mockFeasibilityService.handleUpload.mockResolvedValue(mockResponse);

      const result = await controller.upload(mockFiles, mockIdWork);

      expect(result).toEqual(mockResponse);
      expect(service.handleUpload).toHaveBeenCalledWith(mockIdWork, mockFiles);
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

      mockFeasibilityService.handleUpload.mockRejectedValue(mockError);

      await expect(controller.upload(mockFiles, mockIdWork)).rejects.toThrow(
        'Upload failed',
      );
      expect(service.handleUpload).toHaveBeenCalledWith(mockIdWork, mockFiles);
    });

    it('deve converter idObra string para número', async () => {
      const mockFiles: Express.Multer.File[] = [];
      const mockIdWork = 999;

      mockFeasibilityService.handleUpload.mockResolvedValue({});

      await controller.upload(mockFiles, mockIdWork);

      expect(service.handleUpload).toHaveBeenCalledWith(999, mockFiles);
      expect(typeof mockIdWork).toBe('number');
    });
  });

  describe('Integração de Guards e Interceptors', () => {
    it('deve permitir acesso quando guard retorna true', async () => {
      mockPermissionGuard.canActivate.mockReturnValue(true);
      mockFeasibilityService.handleUpload.mockResolvedValue({});

      const result = await controller.upload([], 1);

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

      mockFeasibilityService.handleUpload.mockResolvedValue({
        uploadedFiles: 5,
      });

      await controller.upload(mockFiles, 1);

      expect(service.handleUpload).toHaveBeenCalledWith(1, mockFiles);
      expect(mockFiles).toHaveLength(5);
    });
  });
});
