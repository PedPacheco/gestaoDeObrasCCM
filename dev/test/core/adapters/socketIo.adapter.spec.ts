import type { INestApplicationContext } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import type { ServerOptions } from 'socket.io';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type MockInstance,
} from 'vitest';

import { SocketIoAdapter } from 'src/core/adapters/socketIo.adapter';
import { getAllowedOrigins } from 'src/core/config/cors.config';

// The specifier must match the source import.
vi.mock('src/core/config/cors.config', () => ({
  getAllowedOrigins: vi.fn(),
}));

const ORIGINS = ['https://app.example.com', 'https://admin.example.com'];
const FAKE_SERVER = { fake: 'socket.io server' };

const options = (value: Record<string, unknown>) =>
  value as unknown as ServerOptions;

describe('SocketIoAdapter', () => {
  let superCreate: MockInstance;
  let adapter: SocketIoAdapter;

  beforeEach(() => {
    vi.mocked(getAllowedOrigins).mockReset().mockReturnValue(ORIGINS);
    superCreate = vi
      .spyOn(IoAdapter.prototype, 'createIOServer')
      .mockReturnValue(FAKE_SERVER as never);

    adapter = new SocketIoAdapter({} as INestApplicationContext);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is an IoAdapter', () => {
    expect(adapter).toBeInstanceOf(IoAdapter);
  });

  it('does not read the origins when it is created', () => {
    expect(getAllowedOrigins).not.toHaveBeenCalled();
  });

  // ───────────────────────────────────────────────────────────────────
  describe('createIOServer', () => {
    it('delegates to IoAdapter with the port and returns its server', () => {
      const server = adapter.createIOServer(3001);

      expect(server).toBe(FAKE_SERVER);
      expect(superCreate).toHaveBeenCalledTimes(1);
      expect(superCreate).toHaveBeenCalledWith(3001, {
        cors: { origin: ORIGINS, credentials: true },
      });
    });

    it('reads the origins from the environment defaults', () => {
      adapter.createIOServer(3001);

      expect(getAllowedOrigins).toHaveBeenCalledTimes(1);
      expect(getAllowedOrigins).toHaveBeenCalledWith();
    });

    it('keeps the other options provided by Nest', () => {
      adapter.createIOServer(
        0,
        options({
          path: '/ws',
          transports: ['websocket'],
          pingTimeout: 30_000,
        }),
      );

      expect(superCreate).toHaveBeenCalledWith(0, {
        path: '/ws',
        transports: ['websocket'],
        pingTimeout: 30_000,
        cors: { origin: ORIGINS, credentials: true },
      });
    });

    it('replaces any cors configuration coming from the gateway decorator', () => {
      adapter.createIOServer(
        0,
        options({
          cors: { origin: '*', credentials: false, methods: ['GET'] },
        }),
      );

      expect(superCreate.mock.calls[0][1].cors).toEqual({
        origin: ORIGINS,
        credentials: true,
      });
    });

    it('does not mutate the options it receives', () => {
      const original = options({ path: '/ws', cors: { origin: '*' } });

      adapter.createIOServer(0, original);

      expect(original).toEqual({ path: '/ws', cors: { origin: '*' } });
      expect(superCreate.mock.calls[0][1]).not.toBe(original);
    });

    it('resolves the origins at runtime, on every call', () => {
      vi.mocked(getAllowedOrigins)
        .mockReturnValueOnce(['https://first.example.com'])
        .mockReturnValueOnce(['https://second.example.com']);

      adapter.createIOServer(0);
      adapter.createIOServer(0);

      expect(
        superCreate.mock.calls.map(([, opts]) => opts.cors.origin),
      ).toEqual([
        ['https://first.example.com'],
        ['https://second.example.com'],
      ]);
    });

    it('passes an empty origin list when no origin is configured (current behaviour)', () => {
      vi.mocked(getAllowedOrigins).mockReturnValue([]);

      adapter.createIOServer(0);

      expect(superCreate).toHaveBeenCalledWith(0, {
        cors: { origin: [], credentials: true },
      });
    });
  });
});
