import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  ParseEnumPipe,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { extname } from 'node:path';
import { DownloadFileService } from 'src/application/usecases/downloadFile.service';
import { StorageKind } from 'src/domain/types';

import {
  isInlineExtension,
  mimeTypeFor,
} from 'src/shared/upload/uploadPresets';

const SAFE_NAME = /^[A-Za-z0-9_-]+\.[A-Za-z0-9]{2,5}$/; // ajuste conforme o levantamento dos nomes antigos

@Controller('arquivos')
export class FilesController {
  constructor(private readonly downloadFile: DownloadFileService) {}

  @Get(':tipo/:nome')
  async download(
    @Param('tipo', new ParseEnumPipe(StorageKind)) tipo: StorageKind,
    @Param('nome') nome: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    if (!SAFE_NAME.test(nome))
      throw new BadRequestException('Nome de arquivo inválido');

    const file = await this.downloadFile.execute(tipo, nome);

    if (!file) throw new NotFoundException('Arquivo não encontrado');

    const ext = extname(nome).toLowerCase();
    res.set({
      'Content-Type': mimeTypeFor(ext),
      'Content-Length': String(file.size),
      'Content-Disposition': `${isInlineExtension(ext) ? 'inline' : 'attachment'}; filename="${nome}"`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    });

    return new StreamableFile(file.stream);
  }
}
