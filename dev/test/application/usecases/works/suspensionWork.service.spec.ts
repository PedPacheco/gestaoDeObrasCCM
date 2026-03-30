import { FindExistingWorksService } from 'src/application/usecases/works/findExistingWorks.service';
import { SuspensionWorkService } from 'src/application/usecases/works/suspensionWork.service';
import { SUSPENSION_WORK_REPOSITORY } from 'src/domain/repositories/works/ISuspensionWorkRepository';

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('SuspensionWorkService', () => {
  let suspensionWorkService: SuspensionWorkService;
  let findExistingWorksService: FindExistingWorksService;

  const mockRepository = {
    create: jest.fn(),
    createMultiple: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuspensionWorkService,
        {
          provide: FindExistingWorksService,
          useValue: { findExistingWorks: jest.fn() },
        },
        { provide: SUSPENSION_WORK_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    suspensionWorkService = module.get<SuspensionWorkService>(
      SuspensionWorkService,
    );
    findExistingWorksService = module.get<FindExistingWorksService>(
      FindExistingWorksService,
    );
  });

  describe('CreateSuspension', () => {
    it('should throw error if reason of suspension not sent', async () => {
      await expect(
        suspensionWorkService.createSuspension(1, '    '),
      ).rejects.toThrow(BadRequestException);

      await expect(
        suspensionWorkService.createSuspension(1, null),
      ).rejects.toThrow('Motivo da suspensão é obrigatório');
    });

    it('should call method create of suspensionWorkRepository with correct data', async () => {
      await suspensionWorkService.createSuspension(1, 'Obra suspensa');

      expect(mockRepository.create).toHaveBeenCalledWith({
        id_obra: 1,
        data: expect.any(Date),
        motivo: 'Obra suspensa',
      });
    });
  });

  describe('CreateMultipleSuspension', () => {
    it('should throw error if array with data not sent', async () => {
      await expect(
        suspensionWorkService.createMultipleSuspensions([]),
      ).rejects.toThrow(BadRequestException);

      await expect(
        suspensionWorkService.createMultipleSuspensions(null),
      ).rejects.toThrow('Nenhuma obra enviada para ser suspensa');
    });

    it('should call method create of suspensionWorkRepository with correct data', async () => {
      jest
        .spyOn(findExistingWorksService, 'findExistingWorks')
        .mockResolvedValue([{ id: 1, ovnota: '2134' }]);

      const data = [{ ovnota: '2134', motivo: 'Obra suspensa' }];

      await suspensionWorkService.createMultipleSuspensions(data);

      expect(mockRepository.createMultiple).toHaveBeenCalledWith([
        { id_obra: 1, motivo: 'Obra suspensa', data: expect.any(Date) },
      ]);
    });

    it('should throw error if reason of suspension not sent', async () => {
      jest
        .spyOn(findExistingWorksService, 'findExistingWorks')
        .mockResolvedValue([{ id: 1, ovnota: '2134' }]);

      const data = [{ ovnota: '2134', motivo: '' }];

      await expect(
        suspensionWorkService.createMultipleSuspensions(data),
      ).rejects.toThrow(BadRequestException);

      await expect(
        suspensionWorkService.createMultipleSuspensions(data),
      ).rejects.toThrow(
        'O motivo da suspensão da obra ou o próprio número da obra não foi enviado',
      );
    });
  });
});
