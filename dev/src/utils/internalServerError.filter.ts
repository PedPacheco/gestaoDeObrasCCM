import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response, Request } from 'express';

@Catch(InternalServerErrorException)
export class InternalServerErrorExceptionFilter implements ExceptionFilter {
  catch(exception: InternalServerErrorException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();

    response.status(status).json({
      statusCode: status,
      path: request.url,
      message: 'Erro ao processar a solicitação',
    });
  }
}
