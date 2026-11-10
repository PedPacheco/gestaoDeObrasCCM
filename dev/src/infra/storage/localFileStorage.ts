// src/infra/storage/localFileStorage.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { unlink } from 'fs/promises';
import { isAbsolute, join, relative, resolve } from 'path';
import {
  IFileStorage,
  StorageKind,
} from 'src/domain/contracts/storage/IFileStorage';

const ENV_KEY: Record<StorageKind, string> = {
  [StorageKind.VIABILIDADE]: 'UPLOAD_DEST',
  [StorageKind.AS_BUILD]: 'UPLOAD_AS_BUILD',
};

@Injectable()
export class LocalFileStorage implements IFileStorage {
  private readonly logger = new Logger(LocalFileStorage.name);

  constructor(private readonly config: ConfigService) {}

  private baseDir(kind: StorageKind): string {
    return this.config.getOrThrow<string>(ENV_KEY[kind]);
  }

  resolve(kind: StorageKind, name: string): string {
    return join(this.baseDir(kind), name);
  }

  deleteStored(kind: StorageKind, names: string[]): Promise<void> {
    const base = this.baseDir(kind);
    return this.deleteMany(
      names.filter(Boolean).map((n) => join(base, n)),
      base,
    );
  }

  deleteUploaded(kind: StorageKind, paths: string[]): Promise<void> {
    return this.deleteMany(paths.filter(Boolean), this.baseDir(kind));
  }

  /** Apaga só dentro da pasta base. Nunca lança erro. */
  private async deleteMany(paths: string[], baseDir: string): Promise<void> {
    const base = resolve(baseDir);

    await Promise.all(
      paths.map(async (path) => {
        const target = resolve(path);
        const rel = relative(base, target);

        if (!rel || rel.startsWith('..') || isAbsolute(rel)) {
          this.logger.warn(`Exclusão recusada fora da pasta base: ${path}`);
          return;
        }

        await unlink(target).catch((err: NodeJS.ErrnoException) => {
          if (err.code !== 'ENOENT') {
            this.logger.error(`Falha ao apagar ${target}: ${err.message}`);
          }
        });
      }),
    );
  }
}
