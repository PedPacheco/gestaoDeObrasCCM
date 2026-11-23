import { HttpException, HttpStatus } from '@nestjs/common';
import {
  CAPEX_GENERIC_ERROR_MESSAGE,
  toSafeCapexErrorMessage,
} from 'src/application/types/usecases/auxiliaryBase/capex-error.util';
import { DomainError } from 'src/domain/errors/domain.error';

describe('toSafeCapexErrorMessage', () => {
  it('retorna a mensagem de uma HttpException', () => {
    const error = new HttpException('Erro de negócio', HttpStatus.BAD_REQUEST);

    expect(toSafeCapexErrorMessage(error)).toBe('Erro de negócio');
  });

  it('retorna a mensagem de um DomainError', () => {
    const error = new DomainError('Regra de domínio violada');

    expect(toSafeCapexErrorMessage(error)).toBe('Regra de domínio violada');
  });

  it('retorna a mensagem genérica para Error comum', () => {
    expect(toSafeCapexErrorMessage(new Error('detalhe interno do banco'))).toBe(
      CAPEX_GENERIC_ERROR_MESSAGE,
    );
  });

  it('retorna a mensagem genérica para valores que não são erro', () => {
    expect(toSafeCapexErrorMessage('texto')).toBe(CAPEX_GENERIC_ERROR_MESSAGE);
    expect(toSafeCapexErrorMessage(null)).toBe(CAPEX_GENERIC_ERROR_MESSAGE);
    expect(toSafeCapexErrorMessage(undefined)).toBe(
      CAPEX_GENERIC_ERROR_MESSAGE,
    );
  });

  it('usa o fallback informado quando o erro não é seguro', () => {
    expect(toSafeCapexErrorMessage(new Error('x'), 'Falha customizada')).toBe(
      'Falha customizada',
    );
  });

  it('ignora o fallback quando o erro é seguro', () => {
    const error = new HttpException('Seguro', HttpStatus.CONFLICT);

    expect(toSafeCapexErrorMessage(error, 'Falha customizada')).toBe('Seguro');
  });
});
