export class DomainError extends Error {
  constructor(
    message: string,
    readonly code: string = 'DOMAIN_ERROR',
  ) {
    super(message);
    this.name = new.target.name;
  }
}

export class ValidationError extends DomainError {
  constructor(message: string, code = 'VALIDATION_ERROR') {
    super(message, code);
  }
}
export class NotFoundError extends DomainError {
  constructor(message: string, code = 'NOT_FOUND') {
    super(message, code);
  }
}
export class ConflictError extends DomainError {
  constructor(message: string, code = 'CONFLICT') {
    super(message, code);
  }
}
