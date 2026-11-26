import {
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { CustomExceptionFilter } from 'src/core/error/customExpection.filter';
import {
  ConflictError,
  DomainError,
  NotFoundError,
  ValidationError,
} from 'src/domain/errors/domain.error';
import { describe, expect, it, vi } from 'vitest';

function run(exception: unknown, url = '/teste') {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status }),
      getRequest: () => ({ url }),
    }),
  } as unknown as ArgumentsHost;

  new CustomExceptionFilter().catch(exception, host);

  const body = json.mock.calls[0][0];
  return { status: status.mock.calls[0][0], body };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const withoutTimestamp = ({ timestamp, ...rest }: Record<string, unknown>) =>
  rest;

describe('CustomExceptionFilter', () => {
  it('ValidationError → 400 com a mensagem original', () => {
    const { status, body } = run(new ValidationError('Selecione um circuito'));
    expect(status).toBe(400);
    expect(body.message).toBe('Selecione um circuito');
  });

  it('ValidationError devolve o mesmo corpo que BadRequestException (contrato com o front)', () => {
    const a = run(new ValidationError('Selecione um circuito'));
    const b = run(new BadRequestException('Selecione um circuito'));
    expect(withoutTimestamp(a.body)).toEqual(withoutTimestamp(b.body));
  });

  it('NotFoundError → 404', () => {
    expect(run(new NotFoundError('Obra não encontrada')).status).toBe(404);
  });

  it('ConflictError → 409', () => {
    expect(run(new ConflictError('Obra já existe')).status).toBe(409);
  });

  it('DomainError genérico → 422', () => {
    expect(run(new DomainError('Regra violada')).status).toBe(422);
  });

  it('DomainError sem mensagem usa a mensagem amigável', () => {
    const { body } = run(new ValidationError(''));
    expect(body.message).toBe(
      'Os dados enviados são inválidos. Verifique e tente novamente',
    );
  });

  it('erro desconhecido → 500 sem expor detalhes', () => {
    const { status, body } = run(new Error('segredo interno'));
    expect(status).toBe(500);
    expect(body.message).not.toContain('segredo');
  });

  it('regressão: mensagens em array do class-validator continuam formatadas', () => {
    const { body } = run(
      new BadRequestException(['dto.nome must be a string']),
    );
    expect(body.message).toEqual(['O campo nome must be a string']);
  });

  it('regressão: NotFoundException padrão continua com a mensagem amigável', () => {
    const { body } = run(new NotFoundException());
    expect(body.message).toBe('O recurso solicitado não foi encontrado');
  });
});
