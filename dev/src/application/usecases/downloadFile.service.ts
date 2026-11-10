import {
  FILE_STORAGE,
  IFileStorage,
  StorageKind,
} from 'src/domain/contracts/storage/IFileStorage';
import { StoredFile } from 'src/domain/types';

// src/application/usecases/files/downloadFile.service.ts
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class DownloadFileService {
  constructor(@Inject(FILE_STORAGE) private readonly storage: IFileStorage) {}

  /** Devolve null se o ficheiro não estiver disponível. */
  execute(kind: StorageKind, name: string): Promise<StoredFile | null> {
    // futuro: verificar se o utilizador pode ver este ficheiro (registo/área)
    return this.storage.open(kind, name);
  }
}
