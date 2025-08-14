import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionReportService } from 'src/application/executionReport.service';
import { HandleSchedulesUpdateService } from 'src/application/orchestrators/handleSchedulesUpdate.service';
import { UpdateSchedulesService } from 'src/application/schedule/updateSchedules.service';
import { GetWorkDetailsService } from 'src/application/works/getWorkDetails.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';

describe('HandleUpdateScheduleService', () => {
  let service: HandleSchedulesUpdateService;

  const mockPrisma = {
    $transaction: jest.fn(),
  };

  const mockUpdateSchedulesService = {
    update: jest.fn(),
  };

  const mockExecutionReportService = {
    create: jest.fn(),
  };

  const mockGetDetailsService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleSchedulesUpdateService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: UpdateSchedulesService,
          useValue: mockUpdateSchedulesService,
        },
        {
          provide: ExecutionReportService,
          useValue: mockExecutionReportService,
        },
        { provide: GetWorkDetailsService, useValue: mockGetDetailsService },
      ],
    }).compile();

    service = module.get<HandleSchedulesUpdateService>(
      HandleSchedulesUpdateService,
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
    mockGetDetailsService.get.mockResolvedValue({ id_status: 35 });

    const result = await service.update(mockDTOWithoutExecutionReport, true);

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
    mockGetDetailsService.get.mockResolvedValue({ id_status: 35 });

    await service.update(mockDTO, true);

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

    await expect(service.update(mockDTO, false)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('should throw BadRequestException when work status is restricted and user has permission flag set', async () => {
    mockGetDetailsService.get.mockResolvedValue({ id_status: 37 });

    mockUpdateSchedulesService.update.mockResolvedValue({});

    await expect(service.update(mockDTO, true)).rejects.toThrow(
      new BadRequestException(
        'Usuário não tem permissão para atualizar essa obra',
      ),
    );

    expect(mockUpdateSchedulesService.update).not.toHaveBeenCalled();
  });
});
