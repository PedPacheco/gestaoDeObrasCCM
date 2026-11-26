import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class AppLogger extends ConsoleLogger {
  errorWithMetadata(
    message: string,
    metadata?: Record<string, unknown>,
    context?: string,
    trace?: string,
  ) {
    super.error(
      JSON.stringify({
        level: 'error',
        message,
        metadata,
        context,
        timestamp: new Date().toISOString(),
      }),
      trace,
    );
  }
}
