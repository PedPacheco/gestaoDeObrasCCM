import { StorageKind, StoredFile } from 'src/domain/types';

// src/domain/contracts/storage/IFileStorage.ts
export const FILE_STORAGE = Symbol('FILE_STORAGE');

export interface IFileStorage {
  /** Apaga ficheiros já guardados (nomes que estão na base de dados). */
  deleteStored(kind: StorageKind, names: string[]): Promise<void>;
  /** Apaga uploads acabados de gravar (caminhos absolutos do Multer). */
  deleteUploaded(kind: StorageKind, paths: string[]): Promise<void>;
  /** Abre um ficheiro guardado. Devolve null se não existir ou estiver fora da pasta base. */
  open(kind: StorageKind, name: string): Promise<StoredFile | null>;
}
