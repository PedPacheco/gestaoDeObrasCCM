// src/domain/contracts/storage/IFileStorage.ts
export const FILE_STORAGE = Symbol('FILE_STORAGE');

export enum StorageKind {
  VIABILIDADE = 'viabilidade',
  AS_BUILD = 'as_build',
}

export interface IFileStorage {
  /** Caminho absoluto de um ficheiro guardado. */
  resolve(kind: StorageKind, name: string): string;
  /** Apaga ficheiros já guardados (nomes que estão na base de dados). */
  deleteStored(kind: StorageKind, names: string[]): Promise<void>;
  /** Apaga uploads acabados de gravar (caminhos absolutos do Multer). */
  deleteUploaded(kind: StorageKind, paths: string[]): Promise<void>;
}
