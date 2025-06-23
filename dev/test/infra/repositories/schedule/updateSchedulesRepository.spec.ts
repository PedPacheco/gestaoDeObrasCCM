import { UpdateSchedulesRepository } from 'src/infra/repositories/schedule/UpdateSchedulesRepository';
import { NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('UpdateSchedulesRepository', () => {
  let repository: UpdateSchedulesRepository;

  // Crie manualmente o mock com jest.fn()
  const updateMock = jest.fn();

  const mockTx = {
    programacoes: {
      update: updateMock,
    },
  } as any as Prisma.TransactionClient; // 👈 agora o Jest reconhece o mock

  beforeEach(() => {
    repository = new UpdateSchedulesRepository();
    jest.clearAllMocks();
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
