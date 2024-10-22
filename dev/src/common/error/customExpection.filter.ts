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

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.getResponse() as string | object;

      if (typeof message === 'object' && 'error' in message) {
        message = (message as any).message;
      }

      if (!message || typeof message === 'object') {
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
          default:
            message = exception.message;
            break;
        }
      }
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Erro interno no servidor. Tente novamente mais tarde';
    }

    if (status === 404) {
      message = 'O recurso solicitado não foi encontrado';
    }

    response.status(status).json({
      statusCode: status,
      path: request.url,
      message,
      timestamp: new Date().toISOString(),
    });
  }
}
