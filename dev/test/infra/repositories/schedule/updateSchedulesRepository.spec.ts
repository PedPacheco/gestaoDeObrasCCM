import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { UpdateSchedulesRepository } from 'src/infra/repositories/schedule/updateSchedulesRepository';

describe('UpdateSchedulesRepository', () => {
  let repository: UpdateSchedulesRepository;

  const updateMock = jest.fn();

  const mockTx = {
    programacoes: {
      update: updateMock,
    },
  } as any as Prisma.TransactionClient; // 👈 agora o Jest reconhece o mock

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UpdateSchedulesRepository],
    }).compile();

    repository = module.get<UpdateSchedulesRepository>(
      UpdateSchedulesRepository,
    );
  });

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
