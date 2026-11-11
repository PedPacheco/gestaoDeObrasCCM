import { HttpException } from '@nestjs/common';

export const CAPEX_GENERIC_ERROR_MESSAGE =
  'Ocorreu um erro inesperado ao processar o CAPEX.';

/**
 * Mensagem de erro que pode ser enviada ao cliente via WebSocket.
 *
 * - HttpException: erro de negócio, a mensagem é segura.
 * - Qualquer outro erro (banco, exceljs, bug): mensagem genérica,
 *   o detalhe fica apenas no log do servidor.
 */
export function toSafeCapexErrorMessage(
  error: unknown,
  fallback: string = CAPEX_GENERIC_ERROR_MESSAGE,
): string {
  return error instanceof HttpException ? error.message : fallback;
}
