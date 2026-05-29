import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { of } from 'rxjs';
import { LoggingInterceptor } from 'src/core/interceptors/logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  let context: ExecutionContext;
  let next: CallHandler;

  const mockLog = jest.fn();

  beforeEach(() => {
    interceptor = new LoggingInterceptor();

    jest.spyOn(Logger.prototype, 'log').mockImplementation(mockLog);

    context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'POST',
          originalUrl: '/users',
          ip: '127.0.0.1',
          query: {
            page: '1',
          },
          body: {
            name: 'Pedro',
            email: 'pedro@test.com',
          },
        }),
      }),
    } as any;

    next = {
      handle: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should log request data before calling next.handle', (done) => {
    next.handle = jest.fn().mockReturnValue(of({ success: true }));

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(mockLog).toHaveBeenNthCalledWith(
          1,
          JSON.stringify({
            type: 'request',
            method: 'POST',
            url: '/users',
            ip: '127.0.0.1',
            query: {
              page: '1',
            },
            bodyKeys: ['name', 'email'],
          }),
        );

        done();
      },
    });
  });

  it('should call next.handle', (done) => {
    next.handle = jest.fn().mockReturnValue(of({ success: true }));

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(next.handle).toHaveBeenCalledTimes(1);

        done();
      },
    });
  });

  it('should log response data after request completion', (done) => {
    jest.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1500);

    next.handle = jest.fn().mockReturnValue(of({ success: true }));

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(mockLog).toHaveBeenNthCalledWith(
          2,
          JSON.stringify({
            type: 'response',
            method: 'POST',
            url: '/users',
            durationMs: 500,
          }),
        );

        done();
      },
    });
  });

  it('should return the same response emitted by next.handle', (done) => {
    const response = {
      success: true,
      data: {
        id: 1,
      },
    };

    next.handle = jest.fn().mockReturnValue(of(response));

    interceptor.intercept(context, next).subscribe({
      next: (result) => {
        expect(result).toEqual(response);

        done();
      },
    });
  });

  it('should handle undefined body by logging empty bodyKeys array', (done) => {
    context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'GET',
          originalUrl: '/health',
          ip: '127.0.0.1',
          query: {},
          body: undefined,
        }),
      }),
    } as any;

    next.handle = jest.fn().mockReturnValue(of({ ok: true }));

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(mockLog).toHaveBeenNthCalledWith(
          1,
          JSON.stringify({
            type: 'request',
            method: 'GET',
            url: '/health',
            ip: '127.0.0.1',
            query: {},
            bodyKeys: [],
          }),
        );

        done();
      },
    });
  });

  it('should handle empty body object correctly', (done) => {
    context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'PUT',
          originalUrl: '/profile',
          ip: '192.168.0.1',
          query: {},
          body: {},
        }),
      }),
    } as any;

    next.handle = jest.fn().mockReturnValue(of({ updated: true }));

    interceptor.intercept(context, next).subscribe({
      next: () => {
        expect(mockLog).toHaveBeenNthCalledWith(
          1,
          JSON.stringify({
            type: 'request',
            method: 'PUT',
            url: '/profile',
            ip: '192.168.0.1',
            query: {},
            bodyKeys: [],
          }),
        );

        done();
      },
    });
  });
});
