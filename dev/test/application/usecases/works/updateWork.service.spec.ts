import { UpdateWorkService } from 'src/application/usecases/works/management/updateWork.service';

import { BadRequestException } from '@nestjs/common';
import { Prisma } from 'src/infra/generated/prisma/client';

describe('UpdateWorkService', () => {
  let updateWorkService: UpdateWorkService;

  const mockRepository = {
    update: vi.fn(),
  };

  const mockTx = {
    obras: {
      create: vi.fn().mockResolvedValue({ id: 1 }), // ou o método que você espera
    },
  } as unknown as Prisma.TransactionClient;

  beforeEach(() => {
    vi.clearAllMocks();
    updateWorkService = new UpdateWorkService(mockRepository as any);
  });

  describe('update', () => {
    it('should call method update and throw error if no data send', async () => {
      await expect(
        updateWorkService.update(undefined, 1, mockTx),
      ).rejects.toThrow(BadRequestException);

      await expect(
        updateWorkService.update(undefined, 1, mockTx),
      ).rejects.toThrow('Valores não inseridos para edição da obra.');
    });

    it('should call method insertMarketWorks and return the default format of data', async () => {
      await updateWorkService.update(
        {
          id_status: 1,
          id_turma: 4,

          data_empreitamento: new Date('05-17-2025'),
          observ_obra: 'Observação',
        },
        1,
        mockTx,
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        {
          id_status: 1,
          id_turma: 4,

          data_empreitamento: new Date('05-17-2025'),
          observ_obra: 'Observação',
        },
        1,
        mockTx,
      );
    });

    it('should call method insertMarketWorks with observ_obra field null', async () => {
      await updateWorkService.update(
        {
          id_status: 1,
          id_turma: 4,

          data_empreitamento: new Date('05-17-2025'),
          observ_obra: '        ',
        },
        1,
        mockTx,
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        {
          id_status: 1,
          id_turma: 4,

          data_empreitamento: new Date('05-17-2025'),
          observ_obra: null,
        },
        1,
        mockTx,
      );
    });
  });
});
