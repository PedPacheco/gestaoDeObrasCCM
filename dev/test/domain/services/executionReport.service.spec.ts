import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { EXECUTION_REPORT_REPOSITORY } from 'src/domain/repositories/IExecutionReportRepository';
import { ExecutionReportService } from 'src/domain/services/executionReport.service';

describe('ExecutionReportService', () => {
  let service: ExecutionReportService;

  const mockRepository = {
    create: jest.fn(),
    findByScheduleId: jest.fn(),
  };

  const mockTransaction = {
    programacoes: {
      update: jest.fn(),
    },
  } as unknown as Prisma.TransactionClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionReportService,
        { provide: EXECUTION_REPORT_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ExecutionReportService>(ExecutionReportService);
  });

  describe('create', () => {
    it('Should call method create and return void if schedule exists', async () => {
      mockRepository.findByScheduleId.mockResolvedValue(true);

      const result = await service.create(
        {
          idSchedule: 1,
          idUser: 1,
          idWork: 1,
        },
        mockTransaction,
      );

      expect(result).toBeUndefined();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('Should call method create and call method create of repository sent data and transaction', async () => {
      mockRepository.findByScheduleId.mockResolvedValue(false);

      const result = await service.create(
        {
          idSchedule: 1,
          idUser: 1,
          idWork: 1,
        },
        mockTransaction,
      );

      expect(result).toBeUndefined();
      expect(mockRepository.create).toHaveBeenCalledWith(
        {
          idSchedule: 1,
          idUser: 1,
          idWork: 1,
        },
        mockTransaction,
      );
    });
  });
});
