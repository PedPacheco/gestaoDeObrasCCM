import { FeasibilityService } from 'src/application/usecases/feasibility.service';
import { FileService } from 'src/application/usecases/file.service';
import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/contracts/IFeasibilityRepository';

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('FeasibilityService', () => {
  let service: FeasibilityService;

  const mockRepository: jest.Mocked<IFeasibilityRepository> = {
    exists: jest.fn(),
    saveFiles: jest.fn(),
    findFiles: jest.fn(),
    approve: jest.fn(),
    getRejections: jest.fn(),
    updateFiles: jest.fn(),
    makeItemsFeasible: jest.fn(),
    reject: jest.fn(),
    getProjectDate: jest.fn(),
  };

  const mockFileService = {
    deleteFile: jest.fn(),
  };

  beforeEach(async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-07-06T12:00:00Z'));

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

  afterEach(() => {
    jest.useRealTimers();
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
});
