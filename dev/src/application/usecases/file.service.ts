import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { access, unlink } from 'node:fs/promises';
import { resolve, sep } from 'node:path';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  async deleteFile(filePath: string, baseDir?: string): Promise<void> {
    const resolved = resolve(filePath);

    if (baseDir) {
      const base = resolve(baseDir);

      if (!resolved.startsWith(base + sep)) {
        this.logger.error(
          `Tentativa de acesso fora do diretório permitido: ${filePath}`,
        );
        throw new BadRequestException('Caminho de ficheiro inválido');
      }
    }

    try {
      await access(resolved);
      await unlink(resolved);
      this.logger.log(`Arquivo removido: ${resolved}`);
    } catch (error) {
      const err = error as NodeJS.ErrnoException;

      if (err?.code === 'ENOENT') {
        this.logger.warn(`Arquivo não encontrado: ${resolved}`);
        return;
      }

      this.logger.error(`Erro ao remover arquivo ${resolved}`, err?.stack);
    }
  }

  async deleteMany(paths: string[], baseDir?: string): Promise<void> {
    if (!paths?.length) return;

    await Promise.allSettled(
      paths.map((path) => this.deleteFile(path, baseDir)),
    );
  }
}
