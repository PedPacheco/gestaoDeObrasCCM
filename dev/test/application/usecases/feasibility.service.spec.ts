import { FeasibilityService } from 'src/application/usecases/feasibility.service';
import { FileService } from 'src/application/usecases/file.service';
import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/repositories/IFeasibilityRepository';

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

// Mocks
const mockRepository: jest.Mocked<IFeasibilityRepository> = {
  exists: jest.fn(),
  saveFiles: jest.fn(),
  findFiles: jest.fn(),
  deleteFiles: jest.fn(),
  approve: jest.fn(),
  getRejections: jest.fn(),
  makeItemsFeasible: jest.fn(),
  reject: jest.fn(),
};

// const mockTx = {
//   relatorio_viabilidade: {
//     createMany: jest.fn().mockResolvedValue({ count: 2 }),
//   },
// } as unknown as Prisma.TransactionClient;

const mockFileService = {
  deleteFile: jest.fn(),
};

describe('FeasibilityService', () => {
  let service: FeasibilityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeasibilityService,
        {
          provide: FEASIBILITY_REPOSITORY,
          useValue: mockRepository,
        },
        {
          provide: FileService,
          useValue: mockFileService,
        },
      ],
    }).compile();

    service = module.get<FeasibilityService>(FeasibilityService);

    jest.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // feasibilityExists(id)
  // -------------------------------------------------------------------------

  it('deve lançar erro se id não for enviado em feasibilityExists', async () => {
    await expect(service.feasibilityExists(undefined as any)).rejects.toThrow(
      new BadRequestException('Obra não foi enviada'),
    );
  });

  it('deve retornar o resultado da verificação de existência', async () => {
    mockRepository.exists.mockResolvedValue([{ id: 10 }]);

    const result = await service.feasibilityExists(10);

    expect(mockRepository.exists).toHaveBeenCalledWith(10);
    expect(result).toEqual([{ id: 10 }]);
  });

  // -------------------------------------------------------------------------
  // deleteFeasibilityFiles(idWork)
  // -------------------------------------------------------------------------

  it('deve lançar erro quando nenhum arquivo é encontrado para deletar', async () => {
    mockRepository.findFiles.mockResolvedValue([]);

    await expect(service.deleteFeasibilityFiles(1)).rejects.toThrow(
      new BadRequestException('Nenhum arquivo encontrado para esta obra'),
    );
  });

  it('deve remover os arquivos e depois deletar os registros', async () => {
    mockRepository.findFiles.mockResolvedValue([
      { id: 1, caminho_arquivo: '/tmp/a.pdf', id_obra: 2 },
      { id: 2, caminho_arquivo: '/tmp/b.pdf', id_obra: 3 },
    ]);

    mockRepository.deleteFiles.mockResolvedValue(undefined);

    await service.deleteFeasibilityFiles(5);

    expect(mockRepository.findFiles).toHaveBeenCalledWith(5);
    expect(mockFileService.deleteFile).toHaveBeenCalledTimes(2);
    expect(mockFileService.deleteFile).toHaveBeenNthCalledWith(
      1,
      'undefined//tmp/a.pdf',
    );
    expect(mockFileService.deleteFile).toHaveBeenNthCalledWith(
      2,
      'undefined//tmp/b.pdf',
    );

    expect(mockRepository.deleteFiles).toHaveBeenCalledWith(2);
  });

  describe('getRejections', () => {
    it('should return a list of rejections mapped with description, reason, user name, and creation date', async () => {
      const data = [
        {
          descricao: 'Poste em falta',
          motivo: 'Material em falta',
          novo_tabela_usuarios: { nome: 'Pedro' },
          criado_em: '2026-07-11',
        },
      ];

      mockRepository.getRejections.mockResolvedValue(data);

      const response = await service.getRejections(1);

      expect(response).toEqual([
        {
          descricao: 'Poste em falta',
          motivo: 'Material em falta',
          criado_em: '2026-07-11',
          usuario: 'Pedro',
        },
      ]);
    });
  });

  describe('approve', () => {
    it('should call method approve in repository', async () => {
      mockRepository.approve.mockResolvedValue(undefined);

      await service.approve(1);

      expect(mockRepository.approve).toHaveBeenCalled();
    });
  });
});
