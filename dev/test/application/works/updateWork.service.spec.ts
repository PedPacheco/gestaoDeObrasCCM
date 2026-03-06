import { UpdateWorkService } from 'src/application/services/works/updateWork.service';
import { UPDATE_WORK_REPOSITORY } from 'src/domain/repositories/works/IUpdateWorkRepository';

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

describe('UpdateWorkService', () => {
  let updateWorkService: UpdateWorkService;

  const mockRepository = {
    update: jest.fn(),
  };

  const mockTx = {
    obras: {
      create: jest.fn().mockResolvedValue({ id: 1 }), // ou o método que você espera
    },
  } as unknown as Prisma.TransactionClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateWorkService,
        { provide: UPDATE_WORK_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    updateWorkService = module.get<UpdateWorkService>(UpdateWorkService);
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
          tipo_ads: 'Convencional',
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
          tipo_ads: 'Convencional',
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
          tipo_ads: 'Convencional',
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
          tipo_ads: 'Convencional',
          data_empreitamento: new Date('05-17-2025'),
          observ_obra: null,
        },
        1,
        mockTx,
      );
    });
  });
});
