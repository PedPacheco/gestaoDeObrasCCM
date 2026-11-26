import { AuthGuard } from 'src/core/guards/auth.guard';

import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { WsException } from '@nestjs/websockets';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: vi.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: vi.fn(),
          },
        },
      ],
    }).compile();

    authGuard = moduleRef.get<AuthGuard>(AuthGuard);
    jwtService = moduleRef.get<JwtService>(JwtService);
    reflector = moduleRef.get<Reflector>(Reflector);
  });

  it('should be defined', () => {
    expect(authGuard).toBeDefined();
  });

  it('should allow access to public routes', async () => {
    const context = createMockExecutionContext();

    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    expect(await authGuard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedExpection if token is null', async () => {
    const context = createMockExecutionContext();

    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedExpection if token is invalid', async () => {
    const context = createMockExecutionContext('Bearer invalidtoken');

    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    vi.spyOn(jwtService, 'verifyAsync').mockRejectedValue(
      new Error('Invalid token'),
    );

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should validate and attach user to the request', async () => {
    const mockPayload = { sub: 1, username: 'testuser' };

    const context = createMockExecutionContext('Bearer mockToken');

    vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    vi.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);

    const result = await authGuard.canActivate(context);

    const request = context.switchToHttp().getRequest();

    expect(result).toBe(true);
    expect(request['user']).toEqual(mockPayload);
  });

  // ============================================================
  // 🔌 CONTEXTO WEBSOCKET
  // ============================================================

  describe('WebSocket context', () => {
    const makeClient = (opts: { user?: any; token?: string } = {}) => ({
      data: { user: opts.user } as Record<string, any>,
      handshake: {
        auth: opts.token ? { token: opts.token } : {},
        headers: {},
      },
    });

    beforeEach(() => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    });

    it('should allow a socket that was already authenticated', async () => {
      const client = makeClient({ user: { sub: 1 } });

      const result = await authGuard.canActivate(createMockWsContext(client));

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should reject an authenticated socket whose JWT already expired', async () => {
      const client = makeClient({
        user: { sub: 1, exp: Math.floor(Date.now() / 1000) - 10 },
      });

      const promise = authGuard.canActivate(createMockWsContext(client));

      await expect(promise).rejects.toThrow(WsException);
      await expect(promise).rejects.toThrow('Sessão expirada');
    });

    it('should reject when there is no user and no token', async () => {
      const client = makeClient();

      await expect(
        authGuard.canActivate(createMockWsContext(client)),
      ).rejects.toThrow('Não autorizado');
    });

    it('should verify the token and attach the user when the socket has no user yet', async () => {
      const payload = { sub: 1, username: 'testuser' };
      const client = makeClient({ token: 'mockToken' });

      vi.spyOn(jwtService, 'verifyAsync').mockResolvedValue(payload);

      const result = await authGuard.canActivate(createMockWsContext(client));

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('mockToken');
      expect(client.data.user).toEqual(payload);
    });

    it('should reject an invalid token with WsException', async () => {
      const client = makeClient({ token: 'invalid' });

      vi.spyOn(jwtService, 'verifyAsync').mockRejectedValue(
        new Error('Invalid token'),
      );

      const promise = authGuard.canActivate(createMockWsContext(client));

      await expect(promise).rejects.toThrow(WsException);
      await expect(promise).rejects.toThrow('Token inválido ou expirado');
    });

    it('should still allow public handlers in a WebSocket context', async () => {
      vi.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

      const result = await authGuard.canActivate(
        createMockWsContext(makeClient()),
      );

      expect(result).toBe(true);
    });
  });

  function createMockWsContext(client: unknown): ExecutionContext {
    return {
      getType: () => 'ws',
      switchToWs: () => ({
        getClient: () => client,
      }),
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as unknown as ExecutionContext;
  }

  function createMockExecutionContext(tokenHeader?: string): ExecutionContext {
    const request = {
      headers: {
        authorization: tokenHeader,
      },
      user: undefined,
    };

    return {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as unknown as ExecutionContext;
  }
});
