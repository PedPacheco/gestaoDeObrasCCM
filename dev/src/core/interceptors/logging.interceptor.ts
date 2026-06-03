import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, ip, body, query } = request;
    const startedAt = Date.now();

    this.logger.log(
      JSON.stringify({
        type: 'request',
        method,
        url: originalUrl,
        ip,
        query,
        bodyKeys: Object.keys(body || {}),
      }),
    );

    return next.handle().pipe(
      tap(() => {
        this.logger.log(
          JSON.stringify({
            type: 'response',
            method,
            url: originalUrl,
            durationMs: Date.now() - startedAt,
          }),
        );
      }),
    );
  }
}
