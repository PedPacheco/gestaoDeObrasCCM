// Importar mocks
import { existsSync, unlinkSync } from 'fs';
import { FileService } from 'src/application/usecases/file.service';

import { Test, TestingModule } from '@nestjs/testing';

// Mock do módulo 'fs'
jest.mock('fs', () => ({
  existsSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe('FileService', () => {
  let service: FileService;
  let loggerLogSpy: jest.SpyInstance;
  let loggerWarnSpy: jest.SpyInstance;
  let loggerErrorSpy: jest.SpyInstance;

  const filePath = '/tmp/test-file.txt';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FileService],
    }).compile();

    service = module.get<FileService>(FileService);

    // Spies para logger
    loggerLogSpy = jest
      .spyOn(service['logger'], 'log')
      .mockImplementation(() => {});
    loggerWarnSpy = jest
      .spyOn(service['logger'], 'warn')
      .mockImplementation(() => {});
    loggerErrorSpy = jest
      .spyOn(service['logger'], 'error')
      .mockImplementation(() => {});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('deve remover o arquivo quando ele existir', () => {
    (existsSync as jest.Mock).mockReturnValue(true);

    service.deleteFile(filePath);

    expect(existsSync).toHaveBeenCalledWith(filePath);
    expect(unlinkSync).toHaveBeenCalledWith(filePath);
    expect(loggerLogSpy).toHaveBeenCalledWith(`Arquivo removido: ${filePath}`);
  });

  it('não deve remover o arquivo quando ele não existir', () => {
    (existsSync as jest.Mock).mockReturnValue(false);

    service.deleteFile(filePath);

    expect(existsSync).toHaveBeenCalledWith(filePath);
    expect(unlinkSync).not.toHaveBeenCalled();
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      `Arquivo não encontrado: ${filePath}`,
    );
  });

  it('deve registrar erro quando unlinkSync lançar exceção', () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    (unlinkSync as jest.Mock).mockImplementation(() => {
      throw new Error('Erro ao deletar');
    });

    service.deleteFile(filePath);

    expect(loggerErrorSpy).toHaveBeenCalled();
    expect(loggerErrorSpy.mock.calls[0][0]).toBe(
      `Erro ao remover arquivo ${filePath}`,
    );
    expect(loggerErrorSpy.mock.calls[0][1]).toContain('Error: Erro ao deletar');
  });

  it('deve registrar erro quando unlinkSync lançar exceção', () => {
    (existsSync as jest.Mock).mockReturnValue(true);
    const customError = { message: 'Falha' };

    (unlinkSync as jest.Mock).mockImplementation(() => {
      throw customError;
    });

    service.deleteFile(filePath);

    expect(loggerErrorSpy).toHaveBeenCalled();
    expect(loggerErrorSpy.mock.calls[0][0]).toBe(
      `Erro ao remover arquivo ${filePath}`,
    );
    expect(loggerErrorSpy.mock.calls[0][1]).toBeUndefined();
  });
});
