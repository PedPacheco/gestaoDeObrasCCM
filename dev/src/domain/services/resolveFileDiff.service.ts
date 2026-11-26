// src/domain/services/resolveFileDiff.ts

import { ValidationError } from '../errors/domain.error';

export interface FileDiff {
  finalPaths: string[];
  toRemove: string[];
}

export function resolveFileDiff(
  stored: string[],
  keptFiles: string[] | undefined,
  uploaded: string[],
): FileDiff {
  const kept = keptFiles ?? stored;

  const forged = kept.filter((path) => !stored.includes(path));

  if (forged.length > 0) {
    throw new ValidationError(
      'Lista de anexos contém ficheiros que não pertencem a esta programação.',
    );
  }

  return {
    finalPaths: [...kept, ...uploaded],
    toRemove: stored.filter((path) => !kept.includes(path)),
  };
}
