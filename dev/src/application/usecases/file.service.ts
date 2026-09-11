import { access, unlink } from 'fs/promises';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  async deleteFile(path: string): Promise<void> {
    try {
      await access(path);
      await unlink(path);

      this.logger.log(`Arquivo removido: ${path}`);
    } catch (error) {
      if (
        error instanceof Error &&
        'code' in error &&
        (error as NodeJS.ErrnoException).code === 'ENOENT'
      ) {
        this.logger.warn(`Arquivo não encontrado: ${path}`);
        return;
      }

      this.logger.error(
        `Erro ao remover arquivo ${path}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
