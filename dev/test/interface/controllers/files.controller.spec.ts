import {
  BadRequestException,
  NotFoundException,
  StreamableFile,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'node:stream';
import { DownloadFileService } from 'src/application/usecases/downloadFile.service';
import { StorageKind } from 'src/domain/types';
import { FilesController } from 'src/interface/controllers/files.controller';

describe('FilesController', () => {
  let controller: FilesController;

  const downloadFile = { execute: vi.fn() };
  const res = { set: vi.fn() } as any;

  const makeFile = (size = 10) => ({
    stream: Readable.from(['conteudo']),
    size,
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [{ provide: DownloadFileService, useValue: downloadFile }],
    }).compile();

    controller = module.get(FilesController);
  });

  describe('nome de arquivo inválido', () => {
    it.each([
      '../segredo.pdf',
      'sem-extensao',
      'nome com espaco.pdf',
      'arquivo.extensaomuitolonga',
      'a/b.pdf',
    ])('lança BadRequestException para "%s"', async (nome) => {
      await expect(
        controller.download(StorageKind.AS_BUILD, nome, res),
      ).rejects.toThrow(BadRequestException);
      expect(downloadFile.execute).not.toHaveBeenCalled();
    });
  });

  describe('arquivo inexistente', () => {
    it('lança NotFoundException quando o service retorna null', async () => {
      downloadFile.execute.mockResolvedValue(null);

      await expect(
        controller.download(StorageKind.VIABILIDADE, 'relatorio.pdf', res),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('download com sucesso', () => {
    it('devolve um StreamableFile e consulta o service com tipo e nome', async () => {
      downloadFile.execute.mockResolvedValue(makeFile());

      const result = await controller.download(
        StorageKind.AS_BUILD,
        'relatorio.pdf',
        res,
      );

      expect(downloadFile.execute).toHaveBeenCalledWith(
        StorageKind.AS_BUILD,
        'relatorio.pdf',
      );
      expect(result).toBeInstanceOf(StreamableFile);
    });

    it('define os cabeçalhos de segurança e tamanho', async () => {
      downloadFile.execute.mockResolvedValue(makeFile(123));

      await controller.download(StorageKind.AS_BUILD, 'relatorio.pdf', res);

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'Content-Length': '123',
          'X-Content-Type-Options': 'nosniff',
          'Cache-Control': 'private, no-store',
        }),
      );
    });

    it('usa Content-Disposition inline para extensões exibíveis (ex.: pdf)', async () => {
      downloadFile.execute.mockResolvedValue(makeFile());

      await controller.download(StorageKind.AS_BUILD, 'relatorio.pdf', res);

      expect(res.set.mock.calls[0][0]['Content-Disposition']).toBe(
        'inline; filename="relatorio.pdf"',
      );
    });

    it('usa Content-Disposition attachment para extensões não exibíveis (ex.: xlsx)', async () => {
      downloadFile.execute.mockResolvedValue(makeFile());

      await controller.download(StorageKind.VIABILIDADE, 'planilha.xlsx', res);

      expect(res.set.mock.calls[0][0]['Content-Disposition']).toBe(
        'attachment; filename="planilha.xlsx"',
      );
    });

    it('normaliza a extensão para minúsculas ao resolver o mime type', async () => {
      downloadFile.execute.mockResolvedValue(makeFile());

      await controller.download(StorageKind.AS_BUILD, 'RELATORIO.PDF', res);

      expect(res.set.mock.calls[0][0]['Content-Type']).toBeDefined();
    });
  });
});
