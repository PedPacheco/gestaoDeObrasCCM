import { InternalServerErrorException } from '@nestjs/common';
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
    updateData: {
      id: 1,
      idWork: 123,
      idUser: 99,
      dataProg: new Date('2025-06-10'),
      startTime: '08:00',
      finishTime: '17:00',
      prog: 80,
    },
    executionReportData: { supervisor: 'Erick' },
  };

  const mockDTOWithoutExecutionReport = {
    updateData: {
      id: 1,
      idWork: 123,
      idUser: 99,
      dataProg: new Date('2025-06-10'),
      startTime: '08:00',
      finishTime: '17:00',
      prog: 80,
    },
    executionReportData: {},
  };

  it('should call update and not call executionReportService if executionReportRequired is false', async () => {
    const mockResult = {
      success: true,
      scheduleId: 1,
      scheduledFinishTime: '17-05-2025',
      idWork: 123,
    };

    mockPrisma.$transaction.mockImplementation(async (cb) => cb({}));
    mockUpdateSchedulesService.update.mockResolvedValue(mockResult);

    const result = await service.update(mockDTOWithoutExecutionReport);

    expect(mockUpdateSchedulesService.update).toHaveBeenCalledWith(
      mockDTOWithoutExecutionReport.updateData,
      expect.any(Object),
    );
    expect(mockExecutionReportService.create).not.toHaveBeenCalled();
    expect(result).toBeUndefined();
  });

  it('should call executionReportService.create if executionReportRequired is true', async () => {
    const mockResult = {
      success: true,
      scheduleId: 1,
      scheduledFinishTime: '17-05-2025',
      idWork: 123,
    };

    mockPrisma.$transaction.mockImplementation(async (cb) => cb({}));
    mockUpdateSchedulesService.update.mockResolvedValue(mockResult);

    await service.update(mockDTO);

    expect(mockExecutionReportService.create).toHaveBeenCalledWith(
      {
        idSchedule: 1,
        idWork: 123,
        supervisor: 'Erick',
      },
      '17-05-2025',
      expect.any(Object),
    );
  });

  it('should throw InternalServerErrorException if something fails inside transaction', async () => {
    const error = new Error('Erro interno');

    mockUpdateSchedulesService.update.mockImplementation(() => {
      throw error;
    });

    mockPrisma.$transaction.mockImplementation(async (callback) => {
      return await callback({});
    });

    await expect(service.update(mockDTO)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
