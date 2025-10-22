import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { SuspensionWorkRepository } from 'src/infra/repositories/works/suspensionWorkRepository';

describe('SuspensionWorkRepository', () => {
  let repository: SuspensionWorkRepository;

  const mockPrisma = {
    suspensoes: { create: jest.fn() },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuspensionWorkRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<SuspensionWorkRepository>(SuspensionWorkRepository);
  });

  describe('create', () => {
    it('should call method suspensoes.create of prisma and save the data corret', async () => {
      const data = {
        id_obra: 1,
        data: new Date('2025-05-17'),
        motivo: 'Obra suspensa',
      };

      await repository.create(data);

      expect(mockPrisma.suspensoes.create).toHaveBeenCalledWith({
        data: { id_obra: 1, data: expect.any(Date), motivo: 'Obra suspensa' },
      });
    });

    it('should trigger an error if and error occurs while saving the data', async () => {
      const error = new Error('DB error');
      mockPrisma.suspensoes.create.mockRejectedValueOnce(error);

      const data = {
        id_obra: 1,
        data: new Date('2025-05-17'),
        motivo: 'Obra suspensa',
      };

      await expect(repository.create(data)).rejects.toThrow('DB error');
    });
  });

  describe('createMultiple', () => {
    it('should create transaction, after call method suspensoes.createMany and obras.updateMany of prisma', async () => {
      const tx = {
        suspensoes: { createMany: jest.fn() },
        obras: { updateMany: jest.fn() },
      };

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        await callback(tx);
      });

      const data = [
        {
          id_obra: 1,
          data: new Date('2025-05-17'),
          motivo: 'Obra suspensa',
        },
      ];

      await repository.createMultiple(data);

      expect(mockPrisma.$transaction).toHaveBeenCalled();
      expect(tx.suspensoes.createMany).toHaveBeenCalledWith({
        data: data,
      });
      expect(tx.obras.updateMany).toHaveBeenCalledWith({
        data: { id_status: 4 },
        where: { id: { in: [1] } },
      });
    });

    it('should trigger an error if and error occurs while saving or update the data', async () => {
      const error = new Error('DB error');
      mockPrisma.$transaction.mockRejectedValueOnce(error);

      const data = [
        {
          id_obra: 1,
          data: new Date('2025-05-17'),
          motivo: 'Obra suspensa',
        },
      ];

      await expect(repository.createMultiple(data)).rejects.toThrow('DB error');
    });
  });
});
