import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { mockUpdateSchedulesServiceFormattedData } from '../../../../test/mocks/mockAddScheduleService';
import { UpdateSchedulesRepository } from 'src/infra/repositories/schedule/updateSchedulesRepository';
import { NotFoundException } from '@nestjs/common';

describe('UpdateSchedulesRepository', () => {
  let repository: UpdateSchedulesRepository;

  const mockPrisma = {
    programacoes: { update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSchedulesRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<UpdateSchedulesRepository>(
      UpdateSchedulesRepository,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('UpdateSchedules', () => {
    it('Should call method update and throw NotFoundExpection if id not found', async () => {
      mockPrisma.programacoes.update.mockRejectedValueOnce({ code: 'P2025' });

      const input = {
        id: 9999,
        startTime: '08:00',
        finishTime: '17:00',
      };

      await expect(repository.update(input)).rejects.toThrow(
        new NotFoundException(`Agendamento com ID ${input.id} não encontrado`),
      );
    });

    it('Should call method update and return count of data created', async () => {
      mockPrisma.programacoes.update.mockResolvedValue({ count: 2 });

      const { id, ...withoutId } = mockUpdateSchedulesServiceFormattedData;

      await repository.update(mockUpdateSchedulesServiceFormattedData);

      expect(mockPrisma.programacoes.update).toHaveBeenCalledWith({
        where: { id },
        data: withoutId,
      });
    });
  });
});
