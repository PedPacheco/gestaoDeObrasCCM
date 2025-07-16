import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UPDATE_WORK_REPOSITORY } from 'src/domain/repositories/works/IUpdateWorkRepository';
import { UpdateWorkService } from 'src/domain/services/works/updateWork.service';

describe('UpdateWorkService', () => {
  let updateWorkService: UpdateWorkService;

  const mockRepository = {
    update: jest.fn(),
  };

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
      await expect(updateWorkService.update(undefined, 1)).rejects.toThrow(
        BadRequestException,
      );

      await expect(updateWorkService.update(undefined, 1)).rejects.toThrow(
        'Valores não inseridos para edição da obra.',
      );
    });

    it('should call method insertMarketWorks and return the default format of data', async () => {
      await updateWorkService.update(
        {
          id_status: 1,
          id_turma: 4,
          tipo_ads: 'Convencional',
          data_empreitamento: new Date('05-17-2025'),
        },
        1,
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        {
          id_status: 1,
          id_turma: 4,
          tipo_ads: 'Convencional',
          data_empreitamento: new Date('05-17-2025'),
        },
        1,
      );
    });
  });
});
