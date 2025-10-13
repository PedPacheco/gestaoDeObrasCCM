import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { UpdateSchedulesRepository } from 'src/infra/repositories/schedule/updateSchedulesRepository';

describe('UpdateSchedulesRepository', () => {
  let repository: UpdateSchedulesRepository;

  const updateMock = jest.fn();

  const mockPrisma = {
    programacoes: {
      findMany: jest.fn(),
    },
  };

  const mockTx = {
    programacoes: {
      update: updateMock,
    },
  } as any as Prisma.TransactionClient;

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

  describe('update', () => {
    it('should throw NotFoundException if P2025 error occurs', async () => {
      updateMock.mockRejectedValueOnce({ code: 'P2025' });

      const input = {
        id: 9999,
        startTime: '08:00',
        finishTime: '17:00',
      };

      await expect(repository.update(input, mockTx)).rejects.toThrow(
        new NotFoundException(`Agendamento com ID ${input.id} não encontrado`),
      );
    });

    it('should throw error if  error occurs', async () => {
      const error = new Error('DB connection failed');
      (mockTx.programacoes.update as jest.Mock).mockRejectedValue(error);

      const input = {
        id: 9999,
        startTime: '08:00',
        finishTime: '17:00',
      };

      await expect(repository.update(input, mockTx)).rejects.toThrow(
        'DB connection failed',
      );
    });

    it('should call update with correct params', async () => {
      updateMock.mockResolvedValueOnce({});

      const input = {
        id: 123,
        startTime: '09:00',
        finishTime: '18:00',
      };

      await repository.update(input, mockTx);

      expect(updateMock).toHaveBeenCalledWith({
        where: { id: 123 },
        data: {
          startTime: '09:00',
          finishTime: '18:00',
        },
      });
    });
  });

  describe('findExecutionOfSchedules', () => {
    it('should throw NotFoundException if P2025 error occurs', async () => {
      mockPrisma.programacoes.findMany.mockRejectedValue({ code: 'P2025' });

      await expect(
        repository.findExecutionOfSchedules(23, 5424),
      ).rejects.toThrow(
        new NotFoundException(`Agendamento com ID ${23} não encontrado`),
      );
    });

    it('should throw error if error occurs', async () => {
      const error = new Error('DB connection failed');
      (mockPrisma.programacoes.findMany as jest.Mock).mockRejectedValue(error);

      await expect(
        repository.findExecutionOfSchedules(23, 5424),
      ).rejects.toThrow('DB connection failed');
    });

    it('should return all schedules with an ID different from the passed ID', async () => {
      mockPrisma.programacoes.findMany.mockResolvedValue([
        { prog: 0, exec: 80 },
        { prog: 0, exec: null },
      ]);

      const result = await repository.findExecutionOfSchedules(332, 32445);

      expect(result).toEqual([
        { prog: 0, exec: 80 },
        { prog: 0, exec: null },
      ]);
    });
  });
});
