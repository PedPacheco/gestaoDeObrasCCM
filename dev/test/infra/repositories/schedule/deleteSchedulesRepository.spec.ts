import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { DeleteSchedulesRepository } from 'src/infra/repositories/works/schedule/deleteSchedulesRepository';

describe('DeleteSchedulesRepository', () => {
  let repository: DeleteSchedulesRepository;

  const mockPrisma = {
    programacoes: { delete: vi.fn() },
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

  afterEach(vi.clearAllMocks);

  describe('delete', () => {
    it('Should call method delete with correct id', async () => {
      mockPrisma.programacoes.delete.mockResolvedValueOnce({});

      await repository.delete(1);

      expect(mockPrisma.programacoes.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('Should throw BadRequestException if schedule has linked report (P2003)', async () => {
      mockPrisma.programacoes.delete.mockRejectedValueOnce({ code: 'P2003' });

      await expect(repository.delete(1)).rejects.toThrow(BadRequestException);
      await expect(repository.delete(1)).resolves; // não chamar duas vezes, ver nota abaixo
    });

    it('Should throw NotFoundException if id not found (P2025)', async () => {
      mockPrisma.programacoes.delete.mockRejectedValueOnce({ code: 'P2025' });

      await expect(repository.delete(1)).rejects.toThrow(NotFoundException);
    });

    it('Should throw InternalServerErrorException on unexpected error', async () => {
      mockPrisma.programacoes.delete.mockRejectedValueOnce(
        new Error('DB error'),
      );

      await expect(repository.delete(1)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
