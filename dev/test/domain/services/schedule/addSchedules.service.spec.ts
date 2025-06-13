import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ADD_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IAddSchedulesRepository';
import { AddSchedulesService } from 'src/domain/services/schedule/addSchedules.service';
import {
  mockAddSchedulesServiceData,
  mockAddSchedulesServiceDataNotTimeValid,
  mockAddSchedulesServiceDataWithoutIdWork,
  mockAddSchedulesServiceDataWithWrongProg,
  mockAddSchedulesServiceFormattedData,
} from '../../../../test/mocks/mockAddScheduleService';

describe('AddSchedulesService', () => {
  let addSchedulesService: AddSchedulesService;

  const mockRepository = {
    addSchedules: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddSchedulesService,
        {
          provide: ADD_SCHEDULES_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    addSchedulesService = module.get<AddSchedulesService>(AddSchedulesService);
  });

  afterEach(jest.clearAllMocks);

  describe('add', () => {
    it('Should call method add and throw error', async () => {
      await expect(addSchedulesService.add(null as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('Should call method add and pass the formatted parameters to the repository, if repository return 0 throw error', async () => {
      mockRepository.addSchedules.mockResolvedValue(undefined);

      await addSchedulesService.add(mockAddSchedulesServiceData);

      expect(mockRepository.addSchedules).toHaveBeenCalledWith(
        mockAddSchedulesServiceFormattedData,
      );
    });

    it('Should call method add and throw error with this text: ID da obra é obrigatório', async () => {
      await expect(
        addSchedulesService.add(mockAddSchedulesServiceDataWithoutIdWork),
      ).rejects.toThrow(BadRequestException);

      await expect(
        addSchedulesService.add(mockAddSchedulesServiceDataWithoutIdWork),
      ).rejects.toThrow('Erro ao criar programação: ID da obra é obrigatório');
    });

    it('Should call method add and throw error with this text: Programado deve estar entre 0 e 100', async () => {
      await expect(
        addSchedulesService.add(mockAddSchedulesServiceDataWithWrongProg),
      ).rejects.toThrow(BadRequestException);

      await expect(
        addSchedulesService.add(mockAddSchedulesServiceDataWithWrongProg),
      ).rejects.toThrow(
        'Erro ao criar programação: Programado deve estar entre 0 e 100',
      );
    });

    it('Should call method add and throw error with this text: Horário de fim deve ser posterior ao início', async () => {
      await expect(
        addSchedulesService.add(mockAddSchedulesServiceDataNotTimeValid),
      ).rejects.toThrow(BadRequestException);

      await expect(
        addSchedulesService.add(mockAddSchedulesServiceDataNotTimeValid),
      ).rejects.toThrow(
        'Erro ao criar programação: Horário de fim deve ser posterior ao início',
      );
    });
  });
});
