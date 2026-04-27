import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch()
export class CustomExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string | object;

    const defaultNestMessages = [
      'Bad Request',
      'Unauthorized',
      'Forbidden',
      'Not Found',
      'Conflict',
    ];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      console.log(exception);

      if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        const rawMessage = (exceptionResponse as any).message;

        if (Array.isArray(rawMessage)) {
          message = rawMessage.map((msg: string) => {
            const match = msg.match(/(?:\w+\.)?(\w+)\s(.+)/);

            if (match) {
              const [, field, errorMsg] = match;
              return `O campo ${field} ${errorMsg}`;
            }
          });
        } else {
          message = rawMessage;
        }
      } else {
        message = exception.message;
      }

      const isMessageEmptyOrDefault =
        message === undefined ||
        message === null ||
        (typeof message === 'string' &&
          defaultNestMessages.includes(message)) ||
        (typeof message === 'object' &&
          !Array.isArray(message) &&
          Object.keys(message).length === 0);

      if (isMessageEmptyOrDefault) {
        switch (status) {
          case HttpStatus.BAD_REQUEST:
            message =
              'Os dados enviados são inválidos. Verifique e tente novamente';
            break;
          case HttpStatus.UNAUTHORIZED:
            message = 'Você não está autorizado a acessar este recurso';
            break;
          case HttpStatus.FORBIDDEN:
            message = 'Você não tem permissão para realizar esta ação';
            break;
          case HttpStatus.NOT_FOUND:
            message = 'O recurso solicitado não foi encontrado';
            break;
          case HttpStatus.CONFLICT:
            message = 'Dados já existentes';
            break;
          default:
            message = exception.message;
            break;
        }
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Erro interno no servidor. Tente novamente mais tarde';
    }

    if (
      status === HttpStatus.NOT_FOUND &&
      typeof message === 'string' &&
      message.includes('Cannot')
    ) {
      message = 'O recurso solicitado não foi encontrado';
    }

    if (
      status === HttpStatus.BAD_REQUEST &&
      typeof message === 'string' &&
      message.includes('Validation failed')
    ) {
      message = 'Os dados enviados são inválidos. Verifique e tente novamente';
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
