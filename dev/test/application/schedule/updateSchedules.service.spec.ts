import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UPDATE_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { UpdateSchedulesService } from 'src/application/schedule/updateSchedules.service';
import { Prisma } from '@prisma/client';
import { ScheduleExecutionValidatorService } from 'src/application/schedule/scheduleExecutionValidator.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import {
  mockUpdateSchedulesService,
  mockUpdateSchedulesServiceFormattedData,
  mockUpdateSchedulesServiceWithoutIdWork,
} from '../../../test/mocks/mockAddScheduleService';

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

  const mockStatusFlowRepository = {
    updateStatusWorks: jest.fn(),
    updateScheduleStatus: jest.fn(),
  };

  const mockExecutionValidator = {
    validateExecutionAndUpdateStatus: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSchedulesService,
        {
          provide: ScheduleExecutionValidatorService,
          useValue: mockExecutionValidator,
        },
        { provide: UPDATE_SCHEDULES_REPOSITORY, useValue: mockRepository },
        { provide: STATUS_FLOW_REPOSITORY, useValue: mockStatusFlowRepository },
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

      await updateSchedulesService.update(
        mockUpdateSchedulesService,
        mockTransaction,
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        mockUpdateSchedulesServiceFormattedData,
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

    it('should throw BadRequest if the sum of executions is greater than 100', async () => {
      mockRepository.update.mockResolvedValue(undefined);
      mockRepository.findExecutionOfSchedules.mockResolvedValue([80, 0]);
      mockExecutionValidator.validateExecutionAndUpdateStatus.mockResolvedValue(
        undefined,
      );

      await expect(
        updateSchedulesService.update(
          { ...mockUpdateSchedulesService, exec: 30 },
          mockTransaction as any,
        ),
      ).rejects.toThrow(
        new BadRequestException(
          'O valor da execução da obra não pode ser superior a 100',
        ),
      );
    });
  });
});
