export type RepositoryErrorCode =
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'FOREIGN_KEY'
  | 'INVALID_DATA'
  | 'UNAVAILABLE'
  | 'UNKNOWN';

export class RepositoryError extends Error {
  constructor(
    message: string,
    public readonly code: RepositoryErrorCode,
    public readonly operation: string,
    public readonly originalError?: unknown,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}
