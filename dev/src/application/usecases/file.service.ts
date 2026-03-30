import { Injectable, Logger } from '@nestjs/common';
import { existsSync, unlinkSync } from 'fs';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);

  deleteFile(path: string): void {
    try {
      if (existsSync(path)) {
        unlinkSync(path);
        this.logger.log(`Arquivo removido: ${path}`);
      } else {
        this.logger.warn(`Arquivo não encontrado: ${path}`);
      }
    } catch (error) {
      this.logger.error(
        `Erro ao remover arquivo ${path}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
