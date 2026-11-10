import { Readable } from 'node:stream';

export type StoredFile = {
  stream: Readable;
  size: number;
};

export enum StorageKind {
  VIABILIDADE = 'viabilidade',
  AS_BUILD = 'as_build',
}
