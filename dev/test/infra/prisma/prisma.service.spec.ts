import { Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from 'src/infra/prisma/prisma.service';

// vi.hoisted: os mocks têm de existir antes de os vi.mock serem executados
const { PrismaPgMock, prismaClientCtor } = vi.hoisted(() => ({
  PrismaPgMock: vi.fn(),
  prismaClientCtor: vi.fn(),
}));

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: PrismaPgMock,
}));

// Substitui o cliente gerado por uma classe leve (sem motor nem ligação)
vi.mock('src/infra/generated/prisma/client', () => ({
  PrismaClient: class {
    constructor(options: unknown) {
      prismaClientCtor(options);
    }
    async $connect(): Promise<void> {}
    async $disconnect(): Promise<void> {}
  },
}));

const BASE_URL = 'postgresql://user:pass@localhost:5432/testdb';

const createService = async (): Promise<PrismaService> => {
  const module: TestingModule = await Test.createTestingModule({
    providers: [PrismaService],
  }).compile();

  return module.get<PrismaService>(PrismaService);
};

describe('PrismaService', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('DATABASE_URL', `${BASE_URL}?schema=construcao_sp`);
    logSpy = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    logSpy.mockRestore();
  });

  describe('construção', () => {
    it('should be defined', async () => {
      const service = await createService();

      expect(service).toBeDefined();
    });

    it('should create the adapter with the connection string and the schema from the URL', async () => {
      await createService();

      expect(PrismaPgMock).toHaveBeenCalledTimes(1);
      expect(PrismaPgMock).toHaveBeenCalledWith(
        { connectionString: `${BASE_URL}?schema=construcao_sp` },
        { schema: 'construcao_sp' },
      );
    });

    it('should use the "public" schema when the URL has no schema', async () => {
      vi.stubEnv('DATABASE_URL', BASE_URL);

      await createService();

      expect(PrismaPgMock).toHaveBeenCalledWith(
        { connectionString: BASE_URL },
        { schema: 'public' },
      );
    });

    it('should pass the adapter and log levels to PrismaClient', async () => {
      await createService();

      expect(prismaClientCtor).toHaveBeenCalledWith({
        adapter: expect.anything(),
        log: ['warn', 'error'],
      });
    });

    it('should throw when DATABASE_URL is not defined', () => {
      vi.stubEnv('DATABASE_URL', '');

      expect(() => new PrismaService()).toThrow(
        'DATABASE_URL não está definida',
      );
      expect(PrismaPgMock).not.toHaveBeenCalled();
      expect(prismaClientCtor).not.toHaveBeenCalled();
    });
  });

  describe('onModuleInit', () => {
    it('should connect and log success', async () => {
      const service = await createService();
      const connectSpy = vi.spyOn(service, '$connect');

      await service.onModuleInit();

      expect(connectSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('Prisma connected successfully');
    });

    it('should propagate the error and not log success when connection fails', async () => {
      const service = await createService();
      vi.spyOn(service, '$connect').mockRejectedValue(
        new Error('Connection refused'),
      );

      await expect(service.onModuleInit()).rejects.toThrow(
        'Connection refused',
      );
      expect(logSpy).not.toHaveBeenCalledWith('Prisma connected successfully');
    });
  });

  describe('onModuleDestroy', () => {
    it('should disconnect and log success', async () => {
      const service = await createService();
      const disconnectSpy = vi.spyOn(service, '$disconnect');

      await service.onModuleDestroy();

      expect(disconnectSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('Prisma disconnected successfully');
    });
  });
});
