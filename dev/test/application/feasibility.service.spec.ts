import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';

import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/repositories/IFeasibilityRepository';
import { FeasibilityService } from 'src/application/feasibility.service';
import { FileService } from 'src/application/file.service';

// Mocks
const mockRepository: jest.Mocked<IFeasibilityRepository> = {
  exists: jest.fn(),
  saveFiles: jest.fn(),
  findFiles: jest.fn(),
  deleteFiles: jest.fn(),
};

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
  // handleUpload(idWork, files)
  // -------------------------------------------------------------------------

  it('deve lançar erro se nenhum arquivo for enviado', async () => {
    await expect(service.handleUpload(1, [])).rejects.toThrow(
      new BadRequestException('Nenhum arquivo foi enviado.'),
    );
  });

  it('deve lançar erro se idWork não for enviado', async () => {
    await expect(service.handleUpload(undefined as any, [{}])).rejects.toThrow(
      new BadRequestException('O ID da obra é obrigatório.'),
    );
  });

  it('deve lançar erro se já existirem arquivos importados', async () => {
    mockRepository.exists.mockResolvedValue([{ id: 1 }]);

    await expect(service.handleUpload(10, [{}])).rejects.toThrow(
      new BadRequestException('Já existem arquivos importados para esta obra.'),
    );

    expect(mockRepository.exists).toHaveBeenCalledWith(10);
  });

  it('deve salvar os arquivos quando idWork é válido e não existem arquivos', async () => {
    mockRepository.exists.mockResolvedValue([]);
    mockRepository.saveFiles.mockResolvedValue(undefined);

    await service.handleUpload(7, [{ nome: 'file1.pdf' }]);

    expect(mockRepository.exists).toHaveBeenCalledWith(7);
    expect(mockRepository.saveFiles).toHaveBeenCalledWith(7, [
      { nome: 'file1.pdf' },
    ]);
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
      { id: 1, caminho_arquivo: '/tmp/a.pdf' },
      { id: 2, caminho_arquivo: '/tmp/b.pdf' },
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

    expect(mockRepository.deleteFiles).toHaveBeenCalledWith(5);
  });
});
