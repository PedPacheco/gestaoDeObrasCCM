import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let jwtService: JwtService;
  let reflector: Reflector;

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
          },
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: jest.fn(),
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

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(true);

    expect(await authGuard.canActivate(context)).toBe(true);
  });

  it('should throw UnauthorizedExpection if token is null', async () => {
    const context = createMockExecutionContext();

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should throw UnauthorizedExpection if token is invalid', async () => {
    const context = createMockExecutionContext('Bearer invalidtoken');

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest
      .spyOn(jwtService, 'verifyAsync')
      .mockRejectedValue(new Error('Invalid token'));

    await expect(authGuard.canActivate(context)).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('should validate and attach user to the request', async () => {
    const mockPayload = { sub: 1, username: 'testuser' };

    const context = createMockExecutionContext('Bearer mockToken');

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(false);
    jest.spyOn(jwtService, 'verifyAsync').mockResolvedValue(mockPayload);

    const result = await authGuard.canActivate(context);

    const request = context.switchToHttp().getRequest();

    expect(result).toBe(true);
    expect(request['user']).toEqual(mockPayload);
  });

  function createMockExecutionContext(tokenHeader?: string): ExecutionContext {
    const request = {
      headers: {
        authorization: tokenHeader,
      },
      user: undefined,
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
  }
});
