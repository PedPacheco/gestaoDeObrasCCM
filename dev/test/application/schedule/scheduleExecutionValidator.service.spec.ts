import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ScheduleExecutionValidatorService } from 'src/application/schedule/scheduleExecutionValidator.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';

describe('ScheduleExecutionValidatorService', () => {
  let service: ScheduleExecutionValidatorService;

  const mockStatusFlowRepository = {
    updateScheduleStatus: jest.fn(),
    updateStatusWorks: jest.fn(),
  };

  const mockTransaction = {
    programacoes: {
      update: jest.fn(),
    },
  } as unknown as Prisma.TransactionClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleExecutionValidatorService,
        { provide: STATUS_FLOW_REPOSITORY, useValue: mockStatusFlowRepository },
      ],
    }).compile();

    service = module.get<ScheduleExecutionValidatorService>(
      ScheduleExecutionValidatorService,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('validateExecutionAndUpdateStatus', () => {
    it('should throw BadRequest if the sum of executions is greater than 100', async () => {
      const data = {
        id: 1,
        idWork: 1,
        exec: 80,
        prog: 80,
        dataProg: new Date('17/05/2025'),
      };

      await expect(
        service.validateExecutionAndUpdateStatus(data, 80, mockTransaction),
      ).rejects.toThrow(
        new BadRequestException(
          'O valor da execução da obra não pode ser superior a 100',
        ),
      );
    });

    it('Should call statusFlowRepository when prog value and exec value are equal', async () => {
      const data = {
        id: 1,
        idWork: 1,
        exec: 80,
        prog: 80,
        dataProg: new Date('17/05/2025'),
      };

      await service.validateExecutionAndUpdateStatus(data, 10, mockTransaction);

      expect(
        mockStatusFlowRepository.updateScheduleStatus,
      ).toHaveBeenCalledWith(4, 1, mockTransaction);
      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        37,
        1,
        mockTransaction,
      );
    });

    it('Should call statusFlowRepository when  exec value is 0', async () => {
      const data = {
        id: 1,
        idWork: 1,
        exec: 0,
        prog: 80,
        dataProg: new Date('17/05/2025'),
      };

      await service.validateExecutionAndUpdateStatus(data, 10, mockTransaction);

      expect(
        mockStatusFlowRepository.updateScheduleStatus,
      ).toHaveBeenCalledWith(5, 1, mockTransaction);
      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        36,
        1,
        mockTransaction,
      );
    });

    it('Should call statusFlowRepository when exec value is greater than 0 and prog is greater then exec', async () => {
      const data = {
        id: 1,
        idWork: 1,
        exec: 20,
        prog: 80,
        dataProg: new Date('17/05/2025'),
      };

      await service.validateExecutionAndUpdateStatus(data, 10, mockTransaction);

      expect(
        mockStatusFlowRepository.updateScheduleStatus,
      ).toHaveBeenCalledWith(6, 1, mockTransaction);
      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        36,
        1,
        mockTransaction,
      );
    });
  });
});
