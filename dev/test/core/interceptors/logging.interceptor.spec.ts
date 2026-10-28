import { CallHandler, ExecutionContext, Logger } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import { LoggingInterceptor } from 'src/core/interceptors/logging.interceptor';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;

  let context: ExecutionContext;
  let next: CallHandler;

  const mockLog = vi.fn();

  beforeEach(() => {
    interceptor = new LoggingInterceptor();

    vi.spyOn(Logger.prototype, 'log').mockImplementation(mockLog);

    context = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
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
      handle: vi.fn(),
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should log request data before calling next.handle', async () => {
    next.handle = vi.fn().mockReturnValue(of({ success: true }));

    await lastValueFrom(interceptor.intercept(context, next));

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
  });

  it('should call next.handle', async () => {
    next.handle = vi.fn().mockReturnValue(of({ success: true }));

    await lastValueFrom(interceptor.intercept(context, next));

    expect(next.handle).toHaveBeenCalledTimes(1);
  });

  it('should log response data after request completion', async () => {
    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1500);

    next.handle = vi.fn().mockReturnValue(of({ success: true }));

    await lastValueFrom(interceptor.intercept(context, next));

    expect(mockLog).toHaveBeenNthCalledWith(
      2,
      JSON.stringify({
        type: 'response',
        method: 'POST',
        url: '/users',
        durationMs: 500,
      }),
    );
  });

  it('should return the same response emitted by next.handle', async () => {
    const response = {
      success: true,
      data: {
        id: 1,
      },
    };

    next.handle = vi.fn().mockReturnValue(of(response));

    const result = await lastValueFrom(interceptor.intercept(context, next));

    expect(result).toEqual(response);
  });

  it('should handle undefined body by logging empty bodyKeys array', async () => {
    context = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          method: 'GET',
          originalUrl: '/health',
          ip: '127.0.0.1',
          query: {},
          body: undefined,
        }),
      }),
    } as any;

    next.handle = vi.fn().mockReturnValue(of({ ok: true }));

    await lastValueFrom(interceptor.intercept(context, next));

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
  });

  it('should handle empty body object correctly', async () => {
    context = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          method: 'PUT',
          originalUrl: '/profile',
          ip: '192.168.0.1',
          query: {},
          body: {},
        }),
      }),
    } as any;

    next.handle = vi.fn().mockReturnValue(of({ updated: true }));

    await lastValueFrom(interceptor.intercept(context, next));

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
  });
});
