// Importar mocks
import { access, unlink } from 'fs/promises';
import { FileService } from 'src/application/usecases/file.service';

import { Test, TestingModule } from '@nestjs/testing';

// Mock do módulo 'fs'
jest.mock('fs/promises', () => ({
  access: jest.fn(),
  unlink: jest.fn(),
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

  it('deve remover o arquivo quando ele existir', async () => {
    (access as jest.Mock).mockResolvedValue(true);

    await service.deleteFile(filePath);

    expect(access).toHaveBeenCalledWith(filePath);
    expect(unlink).toHaveBeenCalledWith(filePath);
    expect(loggerLogSpy).toHaveBeenCalledWith(`Arquivo removido: ${filePath}`);
  });

  it('não deve remover o arquivo quando ele não existir', async () => {
    const enoentError = new Error(
      'ENOENT: no such file or directory',
    ) as NodeJS.ErrnoException;
    enoentError.code = 'ENOENT'; // ← essencial para o serviço reconhecer

    (access as jest.Mock).mockRejectedValue(enoentError); // ← access rejeita

    await service.deleteFile(filePath);

    expect(access).toHaveBeenCalledWith(filePath);
    expect(unlink).not.toHaveBeenCalled();
    expect(loggerWarnSpy).toHaveBeenCalledWith(
      `Arquivo não encontrado: ${filePath}`,
    );
    expect(loggerErrorSpy).not.toHaveBeenCalled();
  });

  it('deve registrar erro quando unlink lançar exceção', async () => {
    (access as jest.Mock).mockResolvedValue(true);
    (unlink as jest.Mock).mockImplementation(() => {
      throw new Error('Erro ao deletar');
    });

    await service.deleteFile(filePath);

    expect(loggerErrorSpy).toHaveBeenCalled();
    expect(loggerErrorSpy.mock.calls[0][0]).toBe(
      `Erro ao remover arquivo ${filePath}`,
    );
    expect(loggerErrorSpy.mock.calls[0][1]).toContain('Error: Erro ao deletar');
  });

  it('deve registrar erro quando unlink lançar exceção', async () => {
    (access as jest.Mock).mockResolvedValue(true);
    const customError = { message: 'Falha' };

    (unlink as jest.Mock).mockImplementation(() => {
      throw customError;
    });

    await service.deleteFile(filePath);

    expect(loggerErrorSpy).toHaveBeenCalled();
    expect(loggerErrorSpy.mock.calls[0][0]).toBe(
      `Erro ao remover arquivo ${filePath}`,
    );
    expect(loggerErrorSpy.mock.calls[0][1]).toBeUndefined();
  });
});
