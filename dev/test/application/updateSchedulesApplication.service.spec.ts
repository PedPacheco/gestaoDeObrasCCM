import { Test, TestingModule } from '@nestjs/testing';
import { UpdateSchedulesApplicationService } from 'src/application/updateSchedulesApplication.service';
import { ExecutionReportService } from 'src/domain/services/executionReport.service';
import { UpdateSchedulesService } from 'src/domain/services/schedule/updateSchedules.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';

describe('UpdateScheduleApplicationService', () => {
  let service: UpdateSchedulesApplicationService;

  const mockPrisma = {
    $transaction: jest.fn(),
  };

  const mockUpdateSchedulesService = {
    update: jest.fn(),
  };

  const mockExecutionReportService = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSchedulesApplicationService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: UpdateSchedulesService,
          useValue: mockUpdateSchedulesService,
        },
        {
          provide: ExecutionReportService,
          useValue: mockExecutionReportService,
        },
      ],
    }).compile();

    service = module.get<UpdateSchedulesApplicationService>(
      UpdateSchedulesApplicationService,
    );
  });

  afterEach(jest.clearAllMocks);

  const mockDTO = {
    id: 1,
    idWork: 123,
    idUser: 99,
    dataProg: new Date('2025-06-10'),
    startTime: '08:00',
    finishTime: '17:00',
    prog: 80,
  };

  it('should call update and not call executionReportService if executionReportRequired is false', async () => {
    const mockResult = {
      success: true,
      scheduleId: 1,
      executionReportRequired: false,
      idWork: 123,
    };

    mockPrisma.$transaction.mockImplementation(async (cb) => cb({}));
    mockUpdateSchedulesService.update.mockResolvedValue(mockResult);

    const result = await service.update(mockDTO);

    expect(mockUpdateSchedulesService.update).toHaveBeenCalledWith(
      mockDTO,
      expect.any(Object),
    );
    expect(mockExecutionReportService.create).not.toHaveBeenCalled();
    expect(result).toEqual(mockResult);
  });

  it('should call executionReportService.create if executionReportRequired is true', async () => {
    const mockResult = {
      success: true,
      scheduleId: 1,
      executionReportRequired: true,
      idWork: 123,
    };

    mockPrisma.$transaction.mockImplementation(async (cb) => cb({}));
    mockUpdateSchedulesService.update.mockResolvedValue(mockResult);

    await service.update(mockDTO);

    expect(mockExecutionReportService.create).toHaveBeenCalledWith(
      {
        idSchedule: 1,
        idUser: 99,
        idWork: 123,
      },
      expect.any(Object),
    );
  });

  it('should throw error and log if something fails inside transaction', async () => {
    const error = new Error('Erro interno');

    jest.spyOn(console, 'error').mockImplementation();

    mockUpdateSchedulesService.update.mockImplementation(() => {
      throw error;
    });

    mockPrisma.$transaction.mockImplementation(async (cb) => cb({}));

    await expect(service.update(mockDTO)).rejects.toThrow('Erro interno');

    expect(console.error).toHaveBeenCalledWith('Erro na transação:', error);
  });
});
