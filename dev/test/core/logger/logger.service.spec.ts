import { ConsoleLogger } from '@nestjs/common';
import { AppLogger } from 'src/core/logger/logger.service';

describe('AppLogger', () => {
  let logger: AppLogger;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const TIMESTAMP = '2026-05-18T12:00:00.000Z';

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(TIMESTAMP));

    consoleErrorSpy = vi
      .spyOn(ConsoleLogger.prototype, 'error')
      .mockImplementation(() => {});

    logger = new AppLogger();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('errorWithMetadata', () => {
    it('should call super.error with formatted json payload and trace', () => {
      logger.errorWithMetadata(
        'database connection failed',
        { scheduleId: 16 },
        'DatabaseService',
        'stack trace here',
      );

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level: 'error',
          message: 'database connection failed',
          metadata: { scheduleId: 16 },
          context: 'DatabaseService',
          timestamp: TIMESTAMP,
        }),
        'stack trace here',
      );
    });

    it('should omit undefined optional parameters from the payload', () => {
      logger.errorWithMetadata('unexpected error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level: 'error',
          message: 'unexpected error',
          timestamp: TIMESTAMP,
        }),
        undefined,
      );
    });

    it('should serialize nested metadata objects', () => {
      const metadata = {
        statusCode: 500,
        error: 'Internal Server Error',
        details: { path: '/programacoes/16' },
      };

      logger.errorWithMetadata(
        'request failed',
        metadata,
        'HttpExceptionFilter',
        'stack trace',
      );

      const [payload, trace] = consoleErrorSpy.mock.calls[0];

      expect(JSON.parse(payload as string)).toEqual({
        level: 'error',
        message: 'request failed',
        metadata,
        context: 'HttpExceptionFilter',
        timestamp: TIMESTAMP,
      });
      expect(trace).toBe('stack trace');
    });
  });
});
