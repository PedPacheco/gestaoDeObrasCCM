import { HttpStatus } from '@nestjs/common';

export const DEFAULT_NEST_MESSAGES = [
  'Bad Request',
  'Unauthorized',
  'Forbidden',
  'Not Found',
  'Conflict',
];

export const FRIENDLY_MESSAGES: Partial<Record<number, string>> = {
  [HttpStatus.BAD_REQUEST]:
    'Os dados enviados são inválidos. Verifique e tente novamente',
  [HttpStatus.UNAUTHORIZED]: 'Você não está autorizado a acessar este recurso',
  [HttpStatus.FORBIDDEN]: 'Você não tem permissão para realizar esta ação',
  [HttpStatus.NOT_FOUND]: 'O recurso solicitado não foi encontrado',
  [HttpStatus.CONFLICT]: 'Dados já existentes',
};

export const DOMAIN_FALLBACK_MESSAGE =
  'Não foi possível processar a solicitação';
export const INTERNAL_ERROR_MESSAGE =
  'Erro interno no servidor. Tente novamente mais tarde';
