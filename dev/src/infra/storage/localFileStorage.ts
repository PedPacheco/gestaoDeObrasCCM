// src/infra/storage/localFileStorage.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { open as openFile, unlink, type FileHandle } from 'fs/promises';
import { isAbsolute, join, relative, resolve, sep } from 'path';
import { IFileStorage } from 'src/domain/contracts/storage/IFileStorage';
import { StorageKind, StoredFile } from 'src/domain/types';

const ENV_KEY: Record<StorageKind, string> = {
  [StorageKind.VIABILIDADE]: 'UPLOAD_DEST',
  [StorageKind.AS_BUILD]: 'UPLOAD_AS_BUILD',
};

const NOT_FOUND_CODES = new Set(['ENOENT', 'EISDIR', 'ENOTDIR']);

@Injectable()
export class LocalFileStorage implements IFileStorage {
  private readonly logger = new Logger(LocalFileStorage.name);

  constructor(private readonly config: ConfigService) {}

  private baseDir(kind: StorageKind): string {
    return this.config.getOrThrow<string>(ENV_KEY[kind]);
  }

  private isInside(base: string, target: string): boolean {
    const rel = relative(base, target);
    return (
      !!rel && rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel)
    );
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

  async open(kind: StorageKind, name: string): Promise<StoredFile | null> {
    const base = resolve(this.baseDir(kind));
    const target = resolve(base, name);
    if (!this.isInside(base, target)) {
      this.logger.warn(`Leitura recusada fora da pasta base: ${name}`);
      return null;
    }

    let handle: FileHandle | undefined;
    try {
      handle = await openFile(target, 'r');
      const info = await handle.stat();
      if (!info.isFile()) {
        await handle.close();
        return null;
      }
      // autoClose: o handle fecha quando o stream termina ou falha
      return { stream: handle.createReadStream(), size: info.size };
    } catch (err) {
      await handle?.close().catch(() => undefined);
      if (NOT_FOUND_CODES.has((err as NodeJS.ErrnoException).code ?? ''))
        return null;
      this.logger.error(`Falha ao abrir ${target}: ${(err as Error).message}`);
      throw err; // EACCES, EMFILE… → 500, sem disfarçar como 404
    }
  }

  /** Apaga só dentro da pasta base. Nunca lança erro. */
  private async deleteMany(paths: string[], baseDir: string): Promise<void> {
    const base = resolve(baseDir);

    await Promise.all(
      paths.map(async (path) => {
        const target = resolve(path);

        if (!this.isInside(base, target)) {
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
