import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { DeleteSchedulesRepository } from 'src/infra/repositories/schedule/deleteSchedulesRepository';

describe('DeleteSchedulesRepository', () => {
  let repository: DeleteSchedulesRepository;

  const mockPrisma = {
    programacoes: { delete: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteSchedulesRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<DeleteSchedulesRepository>(
      DeleteSchedulesRepository,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('delete', () => {
    it('Should call method delete and throw NotFoundExpection if id not found', async () => {
      mockPrisma.programacoes.delete.mockRejectedValueOnce({ code: 'P2025' });

      await expect(repository.delete(1)).rejects.toThrow(
        new NotFoundException(`Programação com ID ${1} não encontrada`),
      );
    });

    it('Should call method delete and throw InternalExpection if id not found', async () => {
      mockPrisma.programacoes.delete.mockRejectedValueOnce(
        new Error('DB error'),
      );

      await expect(repository.delete(1)).rejects.toThrow('DB error');
    });

    it('Should call method delete with correct id', async () => {
      await repository.delete(1);

      expect(mockPrisma.programacoes.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });
  });
});
