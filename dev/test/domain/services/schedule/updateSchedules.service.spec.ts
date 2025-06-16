import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UPDATE_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { UpdateSchedulesService } from 'src/domain/services/schedule/updateSchedules.service';
import {
  mockUpdateSchedulesService,
  mockUpdateSchedulesServiceFormattedData,
  mockUpdateSchedulesServiceWithoutIdWork,
} from '../../../../test/mocks/mockAddScheduleService';

describe('UpdateSchedulesService', () => {
  let updateSchedulesService: UpdateSchedulesService;

  const mockRepository = {
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSchedulesService,
        { provide: UPDATE_SCHEDULES_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    updateSchedulesService = module.get<UpdateSchedulesService>(
      UpdateSchedulesService,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('update', () => {
    it('should call method update and throw BadRequestExpection', async () => {
      await expect(updateSchedulesService.update(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Should call method update and pass the formatted parameters to the repository, if repository return 0 throw error', async () => {
      mockRepository.update.mockResolvedValue(undefined);

      await updateSchedulesService.update(mockUpdateSchedulesService);

      expect(mockRepository.update).toHaveBeenCalledWith(
        mockUpdateSchedulesServiceFormattedData,
      );
    });

    it('Should call method update and throw error with this text: ID da obra é obrigatório', async () => {
      await expect(
        updateSchedulesService.update(mockUpdateSchedulesServiceWithoutIdWork),
      ).rejects.toThrow(BadRequestException);

      await expect(
        updateSchedulesService.update(mockUpdateSchedulesServiceWithoutIdWork),
      ).rejects.toThrow('Erro ao criar programação: ID da obra é obrigatório');
    });
  });
});
