import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import {
  ConflictError,
  DomainError,
  NotFoundError,
  ValidationError,
} from 'src/domain/errors/domain.error';
import {
  DEFAULT_NEST_MESSAGES,
  DOMAIN_FALLBACK_MESSAGE,
  FRIENDLY_MESSAGES,
  INTERNAL_ERROR_MESSAGE,
} from '../constants/error.constants';

function domainErrorStatus(error: DomainError): number {
  if (error instanceof ValidationError) return HttpStatus.BAD_REQUEST;
  if (error instanceof NotFoundError) return HttpStatus.NOT_FOUND;
  if (error instanceof ConflictError) return HttpStatus.CONFLICT;
  return HttpStatus.UNPROCESSABLE_ENTITY;
}

function formatValidationMessages(messages: string[]): string[] {
  return messages.map((msg) => {
    const match = msg.match(/(?:\w+\.)?(\w+)\s(.+)/);
    if (match) {
      const [, field, errorMsg] = match;
      return `O campo ${field} ${errorMsg}`;
    }
    return msg;
  });
}

function isEmptyOrDefault(message: unknown): boolean {
  return (
    message === undefined ||
    message === null ||
    (typeof message === 'string' && DEFAULT_NEST_MESSAGES.includes(message)) ||
    (typeof message === 'object' &&
      !Array.isArray(message) &&
      Object.keys(message).length === 0)
  );
}

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | object | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const rawMessage = (exceptionResponse as { message?: unknown }).message;
        message = Array.isArray(rawMessage)
          ? formatValidationMessages(rawMessage as string[])
          : (rawMessage as string | object | undefined);
      } else {
        message = exception.message;
      }

      if (isEmptyOrDefault(message)) {
        message = FRIENDLY_MESSAGES[status] ?? exception.message;
      }
    } else if (exception instanceof DomainError) {
      status = domainErrorStatus(exception);
      message =
        exception.message ||
        FRIENDLY_MESSAGES[status] ||
        DOMAIN_FALLBACK_MESSAGE;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = INTERNAL_ERROR_MESSAGE;
    }

    if (
      status === HttpStatus.NOT_FOUND &&
      typeof message === 'string' &&
      message.includes('Cannot')
    ) {
      message = FRIENDLY_MESSAGES[HttpStatus.NOT_FOUND];
    }

    if (
      status === HttpStatus.BAD_REQUEST &&
      typeof message === 'string' &&
      message.includes('Validation failed')
    ) {
      message = FRIENDLY_MESSAGES[HttpStatus.BAD_REQUEST];
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
