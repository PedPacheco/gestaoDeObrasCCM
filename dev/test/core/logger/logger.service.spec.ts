import { ConsoleLogger } from '@nestjs/common';
import { AppLogger } from 'src/core/logger/logger.service';

describe('AppLogger', () => {
  let logger: AppLogger;

  beforeEach(() => {
    logger = new AppLogger();
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe('error', () => {
    it('should call super.error with formatted json payload', () => {
      const consoleErrorSpy = vi
        .spyOn(ConsoleLogger.prototype, 'error')
        .mockImplementation();

      vi
        .spyOn(Date.prototype, 'toISOString')
        .mockReturnValue('2026-05-18T12:00:00.000Z');

      logger.error(
        'database connection failed',
        'stack trace here',
        'DatabaseService',
      );

      expect(consoleErrorSpy).toHaveBeenCalledTimes(1);

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level: 'error',
          message: 'database connection failed',
          stack: 'stack trace here',
          context: 'DatabaseService',
          timestamp: '2026-05-18T12:00:00.000Z',
        }),
      );
    });

    it('should handle undefined optional parameters', () => {
      const consoleErrorSpy = vi
        .spyOn(ConsoleLogger.prototype, 'error')
        .mockImplementation();

      vi
        .spyOn(Date.prototype, 'toISOString')
        .mockReturnValue('2026-05-18T12:00:00.000Z');

      logger.error('unexpected error');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level: 'error',
          message: 'unexpected error',
          stack: undefined,
          context: undefined,
          timestamp: '2026-05-18T12:00:00.000Z',
        }),
      );
    });

    it('should support object messages', () => {
      const consoleErrorSpy = vi
        .spyOn(ConsoleLogger.prototype, 'error')
        .mockImplementation();

      vi
        .spyOn(Date.prototype, 'toISOString')
        .mockReturnValue('2026-05-18T12:00:00.000Z');

      const message = {
        statusCode: 500,
        error: 'Internal Server Error',
      };

      logger.error(message, 'stack trace', 'HttpExceptionFilter');

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        JSON.stringify({
          level: 'error',
          message,
          stack: 'stack trace',
          context: 'HttpExceptionFilter',
          timestamp: '2026-05-18T12:00:00.000Z',
        }),
      );
    });
  });
});
