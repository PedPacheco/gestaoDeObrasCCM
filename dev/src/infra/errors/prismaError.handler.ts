import { Prisma } from '../generated/prisma/client';
import { RepositoryError } from './repository.error';

/** Nomes das FKs definidos no schema (map: "...") */
const FK_MESSAGES: Record<string, string> = {
  fk_parceira: 'A parceira indicada não existe.',
  fk_usuario_contingencia: 'O utilizador indicado não existe.',
};

const CONNECTION_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

export function toRepositoryError(
  error: unknown,
  operation: string,
): RepositoryError {
  if (error instanceof RepositoryError) return error;

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (CONNECTION_CODES.has(error.code)) {
      return new RepositoryError(
        'Base de dados indisponível ou sem resposta. Tente novamente.',
        'UNAVAILABLE',
        operation,
        error,
      );
    }

    switch (error.code) {
      case 'P2002':
        return new RepositoryError(
          'Já existe um registo com estes dados.',
          'CONFLICT',
          operation,
          error,
        );
      case 'P2003':
        return new RepositoryError(
          resolveForeignKeyMessage(error),
          'FOREIGN_KEY',
          operation,
          error,
        );
      case 'P2025':
        return new RepositoryError(
          'Registo não encontrado.',
          'NOT_FOUND',
          operation,
          error,
        );
      case 'P2000':
        return new RepositoryError(
          'Um dos valores excede o tamanho máximo permitido.',
          'INVALID_DATA',
          operation,
          error,
        );
      case 'P2011':
      case 'P2012':
        return new RepositoryError(
          'Falta preencher um campo obrigatório.',
          'INVALID_DATA',
          operation,
          error,
        );
      case 'P2010':
        return fromRawQueryError(error, operation);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new RepositoryError(
      'Os dados enviados para a base de dados são inválidos.',
      'INVALID_DATA',
      operation,
      error,
    );
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return new RepositoryError(
      'Não foi possível ligar à base de dados.',
      'UNAVAILABLE',
      operation,
      error,
    );
  }

  return new RepositoryError(
    'Erro inesperado ao aceder à base de dados.',
    'UNKNOWN',
    operation,
    error,
  );
}

function resolveForeignKeyMessage(
  error: Prisma.PrismaClientKnownRequestError,
): string {
  const meta = JSON.stringify(error.meta ?? {});
  const match = Object.keys(FK_MESSAGES).find((fk) => meta.includes(fk));
  return match
    ? FK_MESSAGES[match]
    : 'Referência inválida a um registo relacionado.';
}

/** Erros de $queryRaw: o SQLSTATE do Postgres vem em meta.code */
function fromRawQueryError(
  error: Prisma.PrismaClientKnownRequestError,
  operation: string,
): RepositoryError {
  const sqlState = (error.meta as { code?: string } | undefined)?.code;

  switch (sqlState) {
    case '22007': // invalid_datetime_format
    case '22008': // datetime_field_overflow
    case '22P02': // invalid_text_representation
      return new RepositoryError(
        'Parâmetros de consulta inválidos.',
        'INVALID_DATA',
        operation,
        error,
      );
    case '23503':
      return new RepositoryError(
        resolveForeignKeyMessage(error),
        'FOREIGN_KEY',
        operation,
        error,
      );
    case '57014': // query_canceled (timeout)
      return new RepositoryError(
        'A consulta demorou demasiado tempo.',
        'UNAVAILABLE',
        operation,
        error,
      );
    default:
      return new RepositoryError(
        'Erro ao executar a consulta.',
        'UNKNOWN',
        operation,
        error,
      );
  }
}
