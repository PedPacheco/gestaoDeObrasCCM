import { BadRequestException } from '@nestjs/common';
import { access, unlink } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

import { FileService } from 'src/application/usecases/file.service';

// ---------------------------------------------------------------------------
// ⚠️ O serviço importa 'node:fs/promises' — o mock tem de usar o mesmo
//    especificador, caso contrário não é intercetado.
// ---------------------------------------------------------------------------
jest.mock('node:fs/promises', () => ({
  access: jest.fn(),
  unlink: jest.fn(),
}));

const accessMock = access as jest.MockedFunction<typeof access>;
const unlinkMock = unlink as jest.MockedFunction<typeof unlink>;

const makeErrno = (code: string, message = code): NodeJS.ErrnoException => {
  const error = new Error(message) as NodeJS.ErrnoException;
  error.code = code;
  return error;
};

describe('FileService', () => {
  let service: FileService;
  let logSpy: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;
  let errorSpy: jest.SpyInstance;

  const BASE_DIR = resolve('/var/uploads');
  const INSIDE = resolve(BASE_DIR, 'ficheiro.pdf');

  beforeEach(() => {
    service = new FileService();

    logSpy = jest.spyOn(service['logger'], 'log').mockImplementation(() => {});
    warnSpy = jest
      .spyOn(service['logger'], 'warn')
      .mockImplementation(() => {});
    errorSpy = jest
      .spyOn(service['logger'], 'error')
      .mockImplementation(() => {});

    accessMock.mockResolvedValue(undefined);
    unlinkMock.mockResolvedValue(undefined);
  });

  afterEach(() => jest.resetAllMocks());

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  // =========================================================================
  // deleteFile — remoção
  // =========================================================================
  describe('deleteFile', () => {
    const filePath = '/tmp/test-file.txt';
    const expectedPath = resolve(filePath);

    it('deve remover o ficheiro quando existe', async () => {
      await service.deleteFile(filePath);

      expect(accessMock).toHaveBeenCalledWith(expectedPath);
      expect(unlinkMock).toHaveBeenCalledWith(expectedPath);
      expect(logSpy).toHaveBeenCalledWith(`Arquivo removido: ${expectedPath}`);
    });

    it('deve normalizar caminhos relativos antes de operar', async () => {
      await service.deleteFile('./pasta/../ficheiro.txt');

      expect(accessMock).toHaveBeenCalledWith(resolve('ficheiro.txt'));
    });

    it('deve verificar a existência antes de remover', async () => {
      const ordem: string[] = [];
      accessMock.mockImplementation(async () => {
        ordem.push('access');
      });
      unlinkMock.mockImplementation(async () => {
        ordem.push('unlink');
      });

      await service.deleteFile(filePath);

      expect(ordem).toEqual(['access', 'unlink']);
    });

    // -----------------------------------------------------------------
    // Erros
    // -----------------------------------------------------------------
    it('não deve remover quando o ficheiro não existe (ENOENT no access)', async () => {
      accessMock.mockRejectedValue(makeErrno('ENOENT'));

      await service.deleteFile(filePath);

      expect(unlinkMock).not.toHaveBeenCalled();
      expect(warnSpy).toHaveBeenCalledWith(
        `Arquivo não encontrado: ${expectedPath}`,
      );
      expect(errorSpy).not.toHaveBeenCalled();
      expect(logSpy).not.toHaveBeenCalled();
    });

    it('deve tratar ENOENT lançado pelo unlink (corrida entre processos)', async () => {
      unlinkMock.mockRejectedValue(makeErrno('ENOENT'));

      await service.deleteFile(filePath);

      expect(warnSpy).toHaveBeenCalledWith(
        `Arquivo não encontrado: ${expectedPath}`,
      );
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it.each([
      ['EACCES', 'permissão negada'],
      ['EPERM', 'operação não permitida'],
      ['EBUSY', 'recurso ocupado'],
    ])('deve registar erro para o código %s sem lançar', async (code, msg) => {
      const err = makeErrno(code, msg);
      unlinkMock.mockRejectedValue(err);

      await expect(service.deleteFile(filePath)).resolves.toBeUndefined();

      expect(errorSpy).toHaveBeenCalledWith(
        `Erro ao remover arquivo ${expectedPath}`,
        err.stack,
      );
    });

    it('deve registar a stack quando o erro é uma Error', async () => {
      const err = new Error('Erro ao deletar');
      unlinkMock.mockRejectedValue(err);

      await service.deleteFile(filePath);

      expect(errorSpy.mock.calls[0][0]).toBe(
        `Erro ao remover arquivo ${expectedPath}`,
      );
      expect(errorSpy.mock.calls[0][1]).toContain('Error: Erro ao deletar');
    });

    it('deve registar sem stack quando o erro não é uma Error', async () => {
      unlinkMock.mockRejectedValue({ message: 'Falha' } as any);

      await service.deleteFile(filePath);

      expect(errorSpy.mock.calls[0][0]).toBe(
        `Erro ao remover arquivo ${expectedPath}`,
      );
      expect(errorSpy.mock.calls[0][1]).toBeUndefined();
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
    ])(
      'deve tolerar rejeição com %s (optional chaining)',
      async (_l, value) => {
        unlinkMock.mockRejectedValue(value as any);

        await expect(service.deleteFile(filePath)).resolves.toBeUndefined();

        expect(errorSpy).toHaveBeenCalledWith(
          `Erro ao remover arquivo ${expectedPath}`,
          undefined,
        );
      },
    );

    it('nunca deve propagar erros de I/O', async () => {
      accessMock.mockRejectedValue(makeErrno('EIO'));

      await expect(service.deleteFile(filePath)).resolves.toBeUndefined();
    });
  });

  // =========================================================================
  // deleteFile — contenção de diretório (path traversal)
  // =========================================================================
  describe('deleteFile — contenção de diretório', () => {
    it('deve permitir um ficheiro dentro do diretório base', async () => {
      await service.deleteFile(INSIDE, BASE_DIR);

      expect(unlinkMock).toHaveBeenCalledWith(INSIDE);
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it('deve permitir um ficheiro em subpasta do diretório base', async () => {
      const nested = resolve(BASE_DIR, 'sub', 'a.pdf');

      await service.deleteFile(nested, BASE_DIR);

      expect(unlinkMock).toHaveBeenCalledWith(nested);
    });

    it('deve ignorar a verificação quando baseDir é omitido', async () => {
      await service.deleteFile('/etc/passwd');

      expect(unlinkMock).toHaveBeenCalledWith(resolve('/etc/passwd'));
      expect(errorSpy).not.toHaveBeenCalled();
    });

    it.each([
      ['string vazia', ''],
      ['undefined', undefined],
    ])(
      'deve ignorar a verificação quando baseDir é %s',
      async (_l, baseDir) => {
        await service.deleteFile('/etc/passwd', baseDir as any);

        expect(unlinkMock).toHaveBeenCalled();
      },
    );

    it('deve rejeitar travessia com ..', async () => {
      const traversal = resolve(BASE_DIR, '..', 'secreto.txt');

      await expect(service.deleteFile(traversal, BASE_DIR)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.deleteFile(traversal, BASE_DIR)).rejects.toThrow(
        'Caminho de ficheiro inválido',
      );
    });

    it('deve rejeitar um caminho absoluto fora do diretório base', async () => {
      await expect(service.deleteFile('/etc/passwd', BASE_DIR)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar o próprio diretório base (exige separador final)', async () => {
      await expect(service.deleteFile(BASE_DIR, BASE_DIR)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('deve rejeitar um diretório irmão com prefixo comum', async () => {
      // '/var/uploads-publico' começa por '/var/uploads' mas não é subdiretório
      await expect(
        service.deleteFile(`${BASE_DIR}-publico/a.pdf`, BASE_DIR),
      ).rejects.toThrow(BadRequestException);
    });

    it('deve registar a tentativa antes de lançar', async () => {
      const traversal = resolve(BASE_DIR, '..', 'secreto.txt');

      await expect(service.deleteFile(traversal, BASE_DIR)).rejects.toThrow(
        BadRequestException,
      );

      expect(errorSpy).toHaveBeenCalledWith(
        `Tentativa de acesso fora do diretório permitido: ${traversal}`,
      );
    });

    it('não deve tocar no sistema de ficheiros quando o caminho é rejeitado', async () => {
      await expect(service.deleteFile('/etc/passwd', BASE_DIR)).rejects.toThrow(
        BadRequestException,
      );

      expect(accessMock).not.toHaveBeenCalled();
      expect(unlinkMock).not.toHaveBeenCalled();
    });

    it('deve normalizar o baseDir relativo antes de comparar', async () => {
      await service.deleteFile(resolve('uploads', 'a.pdf'), './uploads');

      expect(unlinkMock).toHaveBeenCalledWith(resolve('uploads', 'a.pdf'));
    });

    it('deve usar o separador nativo do sistema', () => {
      // documenta a dependência de path.sep na regra de contenção
      expect(`${BASE_DIR}${sep}`).toBe(BASE_DIR + sep);
    });
  });

  // =========================================================================
  // deleteMany
  // =========================================================================
  describe('deleteMany', () => {
    it.each([
      ['lista vazia', []],
      ['null', null],
      ['undefined', undefined],
    ])('deve retornar imediatamente com %s', async (_l, paths) => {
      await expect(service.deleteMany(paths as any)).resolves.toBeUndefined();

      expect(accessMock).not.toHaveBeenCalled();
      expect(unlinkMock).not.toHaveBeenCalled();
    });

    it('deve remover todos os ficheiros da lista', async () => {
      const paths = ['/tmp/a.pdf', '/tmp/b.pdf', '/tmp/c.pdf'];

      await service.deleteMany(paths);

      expect(unlinkMock).toHaveBeenCalledTimes(3);
      paths.forEach((path) =>
        expect(unlinkMock).toHaveBeenCalledWith(resolve(path)),
      );
    });

    it('deve propagar o baseDir a cada remoção', async () => {
      const spy = jest.spyOn(service, 'deleteFile');

      await service.deleteMany(['/tmp/a.pdf', '/tmp/b.pdf'], BASE_DIR);

      expect(spy).toHaveBeenCalledWith('/tmp/a.pdf', BASE_DIR);
      expect(spy).toHaveBeenCalledWith('/tmp/b.pdf', BASE_DIR);
    });

    it('deve executar as remoções em paralelo', async () => {
      const ordem: string[] = [];
      unlinkMock.mockImplementation(async (p: any) => {
        ordem.push(`inicio:${p}`);
        await new Promise((r) => setTimeout(r, 5));
        ordem.push(`fim:${p}`);
      });

      await service.deleteMany(['/tmp/a.pdf', '/tmp/b.pdf']);

      // ambos arrancam antes de qualquer um terminar
      expect(ordem[0]).toContain('inicio');
      expect(ordem[1]).toContain('inicio');
    });

    it('deve continuar após a falha de um ficheiro (allSettled)', async () => {
      unlinkMock
        .mockRejectedValueOnce(new Error('EACCES'))
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      await expect(
        service.deleteMany(['/tmp/a.pdf', '/tmp/b.pdf', '/tmp/c.pdf']),
      ).resolves.toBeUndefined();

      expect(unlinkMock).toHaveBeenCalledTimes(3);
    });

    it('deve absorver a rejeição de caminho inválido sem propagar', async () => {
      // deleteFile lança BadRequestException, mas allSettled não propaga
      await expect(
        service.deleteMany(
          ['/etc/passwd', resolve(BASE_DIR, 'ok.pdf')],
          BASE_DIR,
        ),
      ).resolves.toBeUndefined();

      expect(unlinkMock).toHaveBeenCalledTimes(1);
      expect(unlinkMock).toHaveBeenCalledWith(resolve(BASE_DIR, 'ok.pdf'));
    });

    it('deve lidar com um único ficheiro', async () => {
      await service.deleteMany(['/tmp/unico.pdf']);

      expect(unlinkMock).toHaveBeenCalledTimes(1);
    });

    it('deve tentar remover duplicados individualmente', async () => {
      await service.deleteMany(['/tmp/a.pdf', '/tmp/a.pdf']);

      expect(unlinkMock).toHaveBeenCalledTimes(2);
    });

    it('nunca deve rejeitar, mesmo com todas as remoções a falhar', async () => {
      unlinkMock.mockRejectedValue(new Error('EIO'));

      await expect(
        service.deleteMany(['/tmp/a.pdf', '/tmp/b.pdf']),
      ).resolves.toBeUndefined();
    });
  });
});
