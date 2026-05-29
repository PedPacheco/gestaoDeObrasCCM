import { ConsoleLogger, Injectable } from '@nestjs/common';

@Injectable()
export class AppLogger extends ConsoleLogger {
  error(message: any, stack?: string, context?: string) {
    super.error(
      JSON.stringify({
        level: 'error',
        message,
        stack,
        context,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
