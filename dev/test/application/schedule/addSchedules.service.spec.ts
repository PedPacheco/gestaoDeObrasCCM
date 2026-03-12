import { AddSchedulesService } from 'src/application/usecases/schedule/addSchedules.service';
import { ADD_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IAddSchedulesRepository';

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import {
  mockAddSchedulesServiceData,
  mockAddSchedulesServiceDataNotTimeValid,
  mockAddSchedulesServiceDataWithoutIdWork,
  mockAddSchedulesServiceDataWithWrongProg,
  mockAddSchedulesServiceFormattedData,
} from '../../../test/mocks/mockAddScheduleService';

describe('AddSchedulesService', () => {
  let addSchedulesService: AddSchedulesService;

  const mockRepository = {
    addSchedules: jest.fn(),
  };

  const mockTx = {
    schedules: {
      create: jest.fn().mockResolvedValue({ id: 1 }), // ou o método que você espera
    },
  } as unknown as Prisma.TransactionClient;

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
      await expect(
        addSchedulesService.add(null as any, mockTx),
      ).rejects.toThrow(BadRequestException);
    });

    it('Should call method add and pass the formatted parameters to the repository, if repository return 0 throw error', async () => {
      mockRepository.addSchedules.mockResolvedValue(undefined);

      await addSchedulesService.add(mockAddSchedulesServiceData, mockTx);

      expect(mockRepository.addSchedules).toHaveBeenCalledWith(
        mockAddSchedulesServiceFormattedData,
        mockTx,
      );
    });

    it('Should call method add and throw error with this text: ID da obra é obrigatório', async () => {
      await expect(
        addSchedulesService.add(
          mockAddSchedulesServiceDataWithoutIdWork,
          mockTx,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        addSchedulesService.add(
          mockAddSchedulesServiceDataWithoutIdWork,
          mockTx,
        ),
      ).rejects.toThrow('Erro ao criar programação: ID da obra é obrigatório');
    });

    it('Should call method add and throw error with this text: Programado deve estar entre 0 e 100', async () => {
      await expect(
        addSchedulesService.add(
          mockAddSchedulesServiceDataWithWrongProg,
          mockTx,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        addSchedulesService.add(
          mockAddSchedulesServiceDataWithWrongProg,
          mockTx,
        ),
      ).rejects.toThrow(
        'Erro ao criar programação: Programado deve estar entre 0 e 100',
      );
    });

    it('Should call method add and throw error with this text: Horário de fim deve ser posterior ao início', async () => {
      await expect(
        addSchedulesService.add(
          mockAddSchedulesServiceDataNotTimeValid,
          mockTx,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        addSchedulesService.add(
          mockAddSchedulesServiceDataNotTimeValid,
          mockTx,
        ),
      ).rejects.toThrow(
        'Erro ao criar programação: Horário de fim deve ser posterior ao início',
      );
    });
  });
});
