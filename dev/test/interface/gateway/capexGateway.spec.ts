import { randomUUID } from 'node:crypto';

import { Logger } from '@nestjs/common';
import type { JwtService } from '@nestjs/jwt';
import { WsException } from '@nestjs/websockets';
import type { Namespace, Socket } from 'socket.io';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

import type { CapexProgressPayload } from 'src/application/types';
import {
  extractTokenFromSocket,
  isPayloadExpired,
} from 'src/core/guards/wsAuth.util';
import {
  CapexGateway,
  getUserId,
} from 'src/interface/gateway/capex/capex.gateway';

vi.mock('src/core/guards/wsAuth.util', () => ({
  extractTokenFromSocket: vi.fn(),
  isPayloadExpired: vi.fn(),
}));

// Mirror the gateway constants (they are not exported).
const FINISHED_TTL_MS = 10 * 60_000;
const IDLE_TTL_MS = 2 * 60 * 60_000;

// ─── Helpers ────────────────────────────────────────────────────────
const progress = (
  phase: string,
  percentage: number,
  extra: Record<string, unknown> = {},
) => ({ phase, percentage, ...extra }) as unknown as CapexProgressPayload;

type Internals = {
  server: unknown;
  jobCache: Map<
    string,
    {
      ownerId: string;
      finished: boolean;
      lastState?: unknown;
      cleanupTimer?: unknown;
    }
  >;
  scheduleCleanup(jobId: string, ms: number): void;
};
const internals = (g: CapexGateway) => g as unknown as Internals;

type FakeClient = {
  id: string;
  data: { user?: Record<string, unknown> };
  join: Mock;
  emit: Mock;
};
const makeClient = (user?: Record<string, unknown>): FakeClient => ({
  id: 'sock-1',
  data: { user },
  join: vi.fn(),
  emit: vi.fn(),
});

/** Asserts that the function throws a WsException with the given message. */
const expectWsError = (fn: () => unknown, message: string) => {
  expect(fn).toThrow(WsException);
  expect(fn).toThrow(message);
};

// ─── Suite ──────────────────────────────────────────────────────────
describe('getUserId', () => {
  it.each([
    ['string id', { id: 'abc' }, 'abc'],
    ['numeric id', { id: 42 }, '42'],
    ['id 0 (falsy but not nullish)', { id: 0 }, '0'],
    ['sub when there is no id', { sub: 'xyz' }, 'xyz'],
    ['sub when id is null', { id: null, sub: 7 }, '7'],
    ['id takes precedence over sub', { id: 1, sub: 2 }, '1'],
  ])('returns the identifier: %s', (_, user, expected) => {
    expect(getUserId(user)).toBe(expected);
  });

  it.each([
    ['undefined user', undefined],
    ['null user', null],
    ['object without id or sub', {}],
    ['null id and sub', { id: null, sub: null }],
  ])('throws for %s', (_, user) => {
    expect(() => getUserId(user)).toThrow('JWT sem identificador de usuário');
  });
});

describe('CapexGateway', () => {
  let gateway: CapexGateway;
  let jwtService: { verifyAsync: Mock };
  let server: { use: Mock; to: Mock };
  let roomEmit: Mock;
  let debugSpy: ReturnType<typeof vi.spyOn>;

  const join = (jobId: unknown, client: FakeClient) =>
    gateway.handleJoin(jobId, client as unknown as Socket);

  beforeEach(() => {
    vi.useFakeTimers();

    vi.mocked(extractTokenFromSocket).mockReset();
    vi.mocked(isPayloadExpired).mockReset().mockReturnValue(false);

    debugSpy = vi
      .spyOn(Logger.prototype, 'debug')
      .mockImplementation(() => undefined);

    jwtService = { verifyAsync: vi.fn() };
    roomEmit = vi.fn();
    server = { use: vi.fn(), to: vi.fn(() => ({ emit: roomEmit })) };

    gateway = new CapexGateway(jwtService as unknown as JwtService);
    internals(gateway).server = server;
  });

  afterEach(() => {
    gateway.onModuleDestroy();
    vi.restoreAllMocks(); // restore spies (setTimeout/Logger) before restoring real timers
    vi.useRealTimers();
  });

  // ───────────────────────────────────────────────────────────────────
  describe('afterInit (authentication middleware)', () => {
    type Middleware = (socket: Socket, next: Mock) => Promise<void>;

    const setup = () => {
      gateway.afterInit(server as unknown as Namespace);
      const middleware = server.use.mock.calls[0][0] as Middleware;
      const socket = { data: {} } as unknown as Socket;
      const next = vi.fn();
      return { middleware, socket, next };
    };

    it('registers a middleware on the namespace', () => {
      gateway.afterInit(server as unknown as Namespace);

      expect(server.use).toHaveBeenCalledTimes(1);
      expect(server.use).toHaveBeenCalledWith(expect.any(Function));
    });

    it('rejects the connection when there is no token', async () => {
      const { middleware, socket, next } = setup();
      vi.mocked(extractTokenFromSocket).mockReturnValue(undefined as never);

      await middleware(socket, next);

      expect(extractTokenFromSocket).toHaveBeenCalledWith(socket);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe('Não autorizado');
    });

    it('accepts the connection and stores the payload in socket.data.user', async () => {
      const { middleware, socket, next } = setup();
      const payload = { id: 'user-1', exp: 9_999_999_999 };
      vi.mocked(extractTokenFromSocket).mockReturnValue('valid-token' as never);
      jwtService.verifyAsync.mockResolvedValue(payload);

      await middleware(socket, next);

      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid-token');
      expect(socket.data.user).toEqual(payload);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(); // no error
    });

    it('rejects the connection when the token is invalid or expired', async () => {
      const { middleware, socket, next } = setup();
      vi.mocked(extractTokenFromSocket).mockReturnValue('bad-token' as never);
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));

      await middleware(socket, next);

      expect(socket.data.user).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe('Token inválido ou expirado');
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('handleConnection / handleDisconnect', () => {
    it('logs the connection at debug level', () => {
      gateway.handleConnection({ id: 'sock-1' } as Socket);
      expect(debugSpy).toHaveBeenCalledWith('WS conectado: sock-1');
    });

    it('logs the disconnection at debug level', () => {
      gateway.handleDisconnect({ id: 'sock-1' } as Socket);
      expect(debugSpy).toHaveBeenCalledWith('WS desconectado: sock-1');
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('handleJoin', () => {
    let jobId: string;

    beforeEach(() => {
      jobId = randomUUID(); // UUID v4
      gateway.createEmitter(jobId, 'owner-1');
    });

    describe('session', () => {
      it('rejects when the socket has no user', () => {
        const client = makeClient(undefined);

        expectWsError(() => join(jobId, client), 'Sessão expirada');
        expect(isPayloadExpired).not.toHaveBeenCalled();
        expect(client.join).not.toHaveBeenCalled();
      });

      it('rejects when the JWT expired after the connection', () => {
        const user = { id: 'owner-1' };
        vi.mocked(isPayloadExpired).mockReturnValue(true);
        const client = makeClient(user);

        expectWsError(() => join(jobId, client), 'Sessão expirada');
        expect(isPayloadExpired).toHaveBeenCalledWith(user);
        expect(client.join).not.toHaveBeenCalled();
      });
    });

    describe('jobId validation', () => {
      it.each([
        ['number', 123],
        ['undefined', undefined],
        ['null', null],
        ['object', { jobId: 'x' }],
      ])('rejects a non-string jobId (%s)', (_, invalid) => {
        expectWsError(
          () => join(invalid, makeClient({ id: 'owner-1' })),
          'jobId inválido',
        );
      });

      it.each([
        ['empty string', ''],
        ['arbitrary text', 'abc'],
        ['UUID v1', 'a8098c1a-f86e-11da-bd1a-00112b49a5f0'],
      ])('rejects a string that is not a UUID v4 (%s)', (_, invalid) => {
        expectWsError(
          () => join(invalid, makeClient({ id: 'owner-1' })),
          'jobId inválido',
        );
      });
    });

    it('rejects a job that is not in the cache', () => {
      const client = makeClient({ id: 'owner-1' });

      expectWsError(
        () => join(randomUUID(), client),
        'Job não encontrado ou expirado',
      );
      expect(client.join).not.toHaveBeenCalled();
    });

    describe('authorization', () => {
      it('rejects a user who is neither the owner nor an admin', () => {
        const client = makeClient({ id: 'other-user' });

        expectWsError(() => join(jobId, client), 'Sem acesso a este job');
        expect(client.join).not.toHaveBeenCalled();
      });

      it('rejects when is_admin is false and the owner is someone else', () => {
        expectWsError(
          () => join(jobId, makeClient({ id: 'other', is_admin: false })),
          'Sem acesso a este job',
        );
      });

      it('accepts the owner identified by id', () => {
        const client = makeClient({ id: 'owner-1' });

        expect(join(jobId, client)).toEqual({ joined: jobId });
        expect(client.join).toHaveBeenCalledWith(jobId);
      });

      it('accepts the owner identified by sub', () => {
        const client = makeClient({ sub: 'owner-1' });

        expect(join(jobId, client)).toEqual({ joined: jobId });
      });

      it('accepts an admin even if not the owner (without reading the id)', () => {
        const client = makeClient({ is_admin: true }); // no id/sub

        expect(join(jobId, client)).toEqual({ joined: jobId });
        expect(client.join).toHaveBeenCalledWith(jobId);
      });

      it('propagates the getUserId error when the JWT has no identifier', () => {
        const client = makeClient({ is_admin: false });

        expect(() => join(jobId, client)).toThrow(
          'JWT sem identificador de usuário',
        );
        expect(() => join(jobId, client)).not.toThrow(WsException);
      });
    });

    describe('room join and replay', () => {
      it('joins the room, logs at debug level and skips replay when there is no previous state', () => {
        const client = makeClient({ id: 'owner-1' });

        const ack = join(jobId, client);

        expect(ack).toEqual({ joined: jobId });
        expect(client.join).toHaveBeenCalledWith(jobId);
        expect(client.emit).not.toHaveBeenCalled();
        expect(debugSpy).toHaveBeenCalledWith(
          `Client sock-1 entrou no room ${jobId}`,
        );
      });

      it('immediately sends the last state (replay) when it exists', () => {
        gateway.emitProgress(jobId, progress('processing', 30));
        const client = makeClient({ id: 'owner-1' });

        join(jobId, client);

        expect(client.emit).toHaveBeenCalledTimes(1);
        expect(client.emit).toHaveBeenCalledWith('capex:progress', {
          jobId,
          phase: 'processing',
          percentage: 30,
        });
      });

      it('accepts a join after done (within the TTL) and replays the final state', () => {
        gateway.emitProgress(jobId, progress('done', 100));
        const client = makeClient({ id: 'owner-1' });

        join(jobId, client);

        expect(client.emit).toHaveBeenCalledWith(
          'capex:progress',
          expect.objectContaining({ phase: 'done', percentage: 100 }),
        );
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('createEmitter', () => {
    it('registers the job with a string ownerId and finished=false', () => {
      const jobId = randomUUID();

      gateway.createEmitter(jobId, 42);

      expect(internals(gateway).jobCache.get(jobId)).toMatchObject({
        ownerId: '42',
        finished: false,
      });
    });

    it('allows a join from a user whose numeric id equals the ownerId', () => {
      const jobId = randomUUID();
      gateway.createEmitter(jobId, 42);

      expect(join(jobId, makeClient({ id: 42 }))).toEqual({ joined: jobId });
    });

    it('returns a function that emits progress to the job room', () => {
      const jobId = randomUUID();
      const emit = gateway.createEmitter(jobId, 'owner-1');

      emit(progress('processing', 10));

      expect(server.to).toHaveBeenCalledWith(jobId);
      expect(roomEmit).toHaveBeenCalledWith('capex:progress', {
        jobId,
        phase: 'processing',
        percentage: 10,
      });
    });

    it('schedules the idle cleanup (2 h)', () => {
      const jobId = randomUUID();
      gateway.createEmitter(jobId, 'owner-1');
      const cache = internals(gateway).jobCache;

      vi.advanceTimersByTime(IDLE_TTL_MS - 1);
      expect(cache.has(jobId)).toBe(true);

      vi.advanceTimersByTime(1);
      expect(cache.has(jobId)).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('emitProgress', () => {
    let jobId: string;
    let emit: (p: CapexProgressPayload) => void;
    const lastEvent = () => roomEmit.mock.calls.at(-1)?.[1];

    beforeEach(() => {
      jobId = randomUUID();
      emit = gateway.createEmitter(jobId, 'owner-1');
    });

    it('ignores unknown jobs', () => {
      gateway.emitProgress(randomUUID(), progress('processing', 50));

      expect(server.to).not.toHaveBeenCalled();
    });

    it('emits the event with the jobId and keeps extra payload fields', () => {
      emit(progress('processing', 25, { message: 'Importing rows' }));

      expect(server.to).toHaveBeenCalledWith(jobId);
      expect(lastEvent()).toEqual({
        jobId,
        phase: 'processing',
        percentage: 25,
        message: 'Importing rows',
      });
    });

    it('stores the event as lastState and keeps finished=false', () => {
      emit(progress('processing', 25));

      expect(internals(gateway).jobCache.get(jobId)).toMatchObject({
        finished: false,
        lastState: { jobId, phase: 'processing', percentage: 25 },
      });
    });

    describe('percentage', () => {
      it('never goes below 0 on the first event', () => {
        emit(progress('processing', -10));
        expect(lastEvent().percentage).toBe(0);
      });

      it('increases normally', () => {
        emit(progress('processing', 20));
        emit(progress('processing', 60));
        expect(lastEvent().percentage).toBe(60);
      });

      it('never regresses', () => {
        emit(progress('processing', 50));
        emit(progress('processing', 20));
        expect(lastEvent().percentage).toBe(50);
      });

      it('is capped at 100', () => {
        emit(progress('processing', 150));
        expect(lastEvent().percentage).toBe(100);
      });
    });

    describe('error phase', () => {
      it('uses 0 when there is no previous state', () => {
        emit(progress('error', 80, { message: 'Failed' }));

        expect(lastEvent()).toEqual({
          jobId,
          phase: 'error',
          percentage: 0,
          message: 'Failed',
        });
      });

      it('keeps the last percentage, ignoring the payload value', () => {
        emit(progress('processing', 40));
        emit(progress('error', 90));

        expect(lastEvent()).toMatchObject({ phase: 'error', percentage: 40 });
        expect(internals(gateway).jobCache.get(jobId)?.finished).toBe(true);
      });
    });

    describe('done phase', () => {
      it('marks the job as finished', () => {
        emit(progress('done', 100));

        expect(lastEvent()).toMatchObject({ phase: 'done', percentage: 100 });
        expect(internals(gateway).jobCache.get(jobId)?.finished).toBe(true);
      });
    });

    it.each(['done', 'error'])('ignores late events after %s', (phase) => {
      emit(progress('processing', 30));
      emit(progress(phase, 100));
      const finalState = internals(gateway).jobCache.get(jobId)?.lastState;
      roomEmit.mockClear();

      emit(progress('processing', 99));
      emit(progress('error', 0));
      emit(progress('done', 100));

      expect(roomEmit).not.toHaveBeenCalled();
      expect(internals(gateway).jobCache.get(jobId)?.lastState).toBe(
        finalState,
      );
    });

    describe('cache cleanup', () => {
      it('resets the idle TTL on every non-terminal event', () => {
        const cache = internals(gateway).jobCache;
        vi.advanceTimersByTime(IDLE_TTL_MS - 1_000);

        emit(progress('processing', 10));

        // goes past the original deadline without removing the job
        vi.advanceTimersByTime(IDLE_TTL_MS - 1);
        expect(cache.has(jobId)).toBe(true);

        vi.advanceTimersByTime(1);
        expect(cache.has(jobId)).toBe(false);
      });

      it('replaces the previous timer instead of piling up timers', () => {
        emit(progress('processing', 10));
        emit(progress('processing', 20));
        emit(progress('processing', 30));

        expect(vi.getTimerCount()).toBe(1);
      });

      it.each(['done', 'error'])('removes the job 10 min after %s', (phase) => {
        const cache = internals(gateway).jobCache;
        emit(progress(phase, 100));

        vi.advanceTimersByTime(FINISHED_TTL_MS - 1);
        expect(cache.has(jobId)).toBe(true);

        vi.advanceTimersByTime(1);
        expect(cache.has(jobId)).toBe(false);
      });

      it('after cleanup, join returns "Job não encontrado ou expirado"', () => {
        emit(progress('done', 100));
        vi.advanceTimersByTime(FINISHED_TTL_MS);

        expectWsError(
          () => join(jobId, makeClient({ id: 'owner-1' })),
          'Job não encontrado ou expirado',
        );
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('scheduleCleanup (private)', () => {
    it('does nothing for a non-existent job', () => {
      internals(gateway).scheduleCleanup('missing', 1_000);

      expect(vi.getTimerCount()).toBe(0);
      expect(internals(gateway).jobCache.has('missing')).toBe(false);
    });

    it('calls unref() on the timer so it does not keep the process alive', () => {
      const unref = vi.fn();
      vi.spyOn(globalThis, 'setTimeout').mockImplementationOnce(
        () => ({ unref }) as unknown as NodeJS.Timeout,
      );

      gateway.createEmitter(randomUUID(), 'owner-1');

      expect(unref).toHaveBeenCalledTimes(1);
    });

    it('works when the timer has no unref (e.g. numeric id)', () => {
      vi.spyOn(globalThis, 'setTimeout').mockImplementationOnce(
        () => 1 as unknown as NodeJS.Timeout,
      );

      expect(() =>
        gateway.createEmitter(randomUUID(), 'owner-1'),
      ).not.toThrow();
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('onModuleDestroy', () => {
    it('clears all timers and empties the cache', () => {
      const a = randomUUID();
      const b = randomUUID();
      const emitA = gateway.createEmitter(a, 'u1');
      gateway.createEmitter(b, 'u2');
      expect(vi.getTimerCount()).toBe(2);

      gateway.onModuleDestroy();

      expect(vi.getTimerCount()).toBe(0);
      expect(internals(gateway).jobCache.size).toBe(0);

      emitA(progress('processing', 50)); // the old emitter no longer has any effect
      expect(server.to).not.toHaveBeenCalled();
    });

    it('does not fail when the cache is empty', () => {
      expect(() => gateway.onModuleDestroy()).not.toThrow();
    });
  });
});
