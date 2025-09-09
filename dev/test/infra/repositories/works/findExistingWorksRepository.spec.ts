import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { FindExistingWorksRepository } from 'src/infra/repositories/works/findExistingWorksRepository';

describe('FindExistingWorksRepository', () => {
  let repository: FindExistingWorksRepository;
  const mockPrisma = {
    obras: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindExistingWorksRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<FindExistingWorksRepository>(
      FindExistingWorksRepository,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('findExistingMarketWorks', () => {
    it('Should return formatted data of existing market works', async () => {
      mockPrisma.obras.findMany.mockResolvedValue([{ ovnota: '123253543' }]);

      const result = await repository.findExistingWorks(['123253543']);

      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith({
        where: { ovnota: { in: ['123253543'] } },
        select: { ovnota: true },
      });
      expect(result).toEqual(['123253543']);
    });

    it('Should return empty array if no data sent to the repository', async () => {
      const result = await repository.findExistingWorks([]);

      expect(mockPrisma.obras.findMany).toHaveBeenCalledTimes(0);
      expect(result).toEqual([]);
    });

    it('should throw an error and log it if prisma fails', async () => {
      const error = new Error('Prisma failure');

      mockPrisma.obras.findMany.mockRejectedValue(error);

      const loggerSpy = jest.spyOn(repository['logger'], 'error');

      await expect(repository.findExistingWorks(['4343'])).rejects.toThrow(
        error,
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        'Erro ao buscar obra de mercado:',
        error.stack,
      );
    });
  });

  describe('findExistingOrders', () => {
    it('should return the formatted data of the existing orders', async () => {
      mockPrisma.obras.findMany.mockResolvedValue([
        {
          ordem_dci: '123534',
          ordem_dcd: '245425',
          ordem_dca: '143454',
          ordem_dcim: '2454543',
        },
      ]);

      const result = await repository.findExistingOrders([
        {
          ordem_dci: '123534',
          ordem_dcd: '245425',
          ordem_dca: '143454',
          ordem_dcim: '2454543',
        },
      ]);

      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { ordem_dci: { in: ['123534'] } },
            { ordem_dcd: { in: ['245425'] } },
            { ordem_dca: { in: ['143454'] } },
            { ordem_dcim: { in: ['2454543'] } },
          ],
        },
        select: {
          ordem_dci: true,
          ordem_dcd: true,
          ordem_dca: true,
          ordem_dcim: true,
        },
      });
      expect(result).toEqual(['123534', '245425', '143454', '2454543']);
    });

    it('Should return empty array if no sent data to the repository', async () => {
      const result = await repository.findExistingOrders([]);

      expect(mockPrisma.obras.findMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('Should return empty array if all existing orders', async () => {
      mockPrisma.obras.findMany.mockResolvedValue([]);

      const result = await repository.findExistingOrders([
        {
          ordem_dci: null,
          ordem_dcd: null,
          ordem_dca: null,
          ordem_dcim: null,
        },
      ]);

      expect(mockPrisma.obras.findMany).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });
  });
});
