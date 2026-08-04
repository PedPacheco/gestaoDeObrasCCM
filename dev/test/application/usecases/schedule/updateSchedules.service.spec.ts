import { UpdateSchedulesService } from 'src/application/usecases/schedule/updateSchedules.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/contracts/IStatusFlowRepository';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/contracts/schedule/IFindScheduleByIdRepository';
import { UPDATE_SCHEDULES_REPOSITORY } from 'src/domain/contracts/schedule/IUpdateSchedulesRepository';

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';

import {
  mockUpdateSchedulesService,
  mockUpdateSchedulesServiceFormattedData,
  mockUpdateSchedulesServiceWithoutIdWork,
} from '../../../mocks/schedules/mockUpdateSchedules';
import { ScheduleExecutionValidatorService } from 'src/application/usecases/schedule/scheduleExecutionValidator.service';

describe('UpdateSchedulesService', () => {
  let updateSchedulesService: UpdateSchedulesService;

  const mockTransaction = {
    programacoes: {
      update: jest.fn(),
    },
  } as unknown as Prisma.TransactionClient;

  const mockRepository = {
    update: jest.fn(),
    findExecutionOfSchedules: jest.fn(),
  };

  const mockScheduleExecutionValidatorService = {
    validateExecutionAndUpdateStatus: jest.fn(),
  };

  const mockStatusFlowRepository = {
    updateStatusWorks: jest.fn(),
    updateScheduleStatus: jest.fn(),
  };

  const mockFindScheduleByIdRepository = {
    findById: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSchedulesService,
        { provide: UPDATE_SCHEDULES_REPOSITORY, useValue: mockRepository },
        { provide: STATUS_FLOW_REPOSITORY, useValue: mockStatusFlowRepository },
        {
          provide: FIND_SCHEDULE_BY_ID_REPOSITORY,
          useValue: mockFindScheduleByIdRepository,
        },
        { provide: STATUS_FLOW_REPOSITORY, useValue: mockStatusFlowRepository },
        {
          provide: ScheduleExecutionValidatorService,
          useValue: mockScheduleExecutionValidatorService,
        },
      ],
    }).compile();

    updateSchedulesService = module.get<UpdateSchedulesService>(
      UpdateSchedulesService,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('update', () => {
    it('should call method update and throw BadRequestExpection', async () => {
      await expect(
        updateSchedulesService.update(null as any, mockTransaction),
      ).rejects.toThrow(BadRequestException);
    });

    it('Should call method update and pass the formatted parameters to the repository, if repository return 0 throw error', async () => {
      mockRepository.update.mockResolvedValue(undefined);
      mockRepository.findExecutionOfSchedules.mockResolvedValue([80, null]);
      mockFindScheduleByIdRepository.findById.mockResolvedValue({
        reprovada: false,
        id_status_programacao: 5,
      });

      await updateSchedulesService.update(
        mockUpdateSchedulesService,
        mockTransaction,
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        mockUpdateSchedulesServiceFormattedData,
        mockTransaction,
      );
    });

    it('Should call method update and update status of work and status of schedule, if id_status_programacao equal 7', async () => {
      mockRepository.update.mockResolvedValue(undefined);
      mockRepository.findExecutionOfSchedules.mockResolvedValue([80, null]);
      mockFindScheduleByIdRepository.findById.mockResolvedValue({
        reprovada: true,
        id_status_programacao: 7,
      });

      await updateSchedulesService.update(
        mockUpdateSchedulesService,
        mockTransaction,
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        mockUpdateSchedulesServiceFormattedData,
        mockTransaction,
      );
      expect(
        mockStatusFlowRepository.updateScheduleStatus,
      ).toHaveBeenCalledWith(1, 1, mockTransaction);
      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        43,
        3146044,
        mockTransaction,
      );
    });

    it('Should call method update and update status of work and status of schedule', async () => {
      mockRepository.update.mockResolvedValue(undefined);
      mockRepository.findExecutionOfSchedules.mockResolvedValue([80, 80]);
      mockFindScheduleByIdRepository.findById.mockResolvedValue({
        reprovada: true,
        id_status_programacao: 7,
      });

      const mockData = { ...mockUpdateSchedulesService, prog: 20, exec: 20 };

      await updateSchedulesService.update(mockData, mockTransaction);

      expect(mockRepository.update).toHaveBeenCalledWith(
        { ...mockUpdateSchedulesServiceFormattedData, prog: 20, exec: 20 },
        mockTransaction,
      );
      expect(
        mockStatusFlowRepository.updateScheduleStatus,
      ).toHaveBeenCalledWith(1, 1, mockTransaction);
      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        43,
        3146044,
        mockTransaction,
      );
    });

    it('Should call method update and throw error with this text: ID da obra é obrigatório', async () => {
      await expect(
        updateSchedulesService.update(
          mockUpdateSchedulesServiceWithoutIdWork,
          mockTransaction,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        updateSchedulesService.update(
          mockUpdateSchedulesServiceWithoutIdWork,
          mockTransaction,
        ),
      ).rejects.toThrow('Erro ao criar programação: ID da obra é obrigatório');
    });

    it('should throw BadRequestException if repository.update fails', async () => {
      mockRepository.update.mockImplementationOnce(() => {
        throw new Error('Erro forçado no repositório');
      });

      const result = updateSchedulesService.update(
        mockUpdateSchedulesService,
        mockTransaction as any,
      );

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow(
        'Erro ao criar relatório: Erro forçado no repositório',
      );
    });
  });
});
