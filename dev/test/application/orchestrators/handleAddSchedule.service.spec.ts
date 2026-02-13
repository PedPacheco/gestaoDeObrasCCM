import { Test, TestingModule } from '@nestjs/testing';
import { HandleAddScheduleService } from 'src/application/orchestrators/handleAddSchedule.service';
import { AddSchedulesService } from 'src/application/schedule/addSchedules.service';
import { WorksServicesService } from 'src/application/services/worksServices.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateScheduleWithServicesDTO } from 'src/interface/dtos/scheduleDTO';

describe('HandleAddScheduleService', () => {
  let service: HandleAddScheduleService;

  const mockPrisma = {
    $transaction: jest.fn(),
  };

  const mockAddSchedulesService = {
    add: jest.fn(),
  };

  const mockStatusFlowRepository = {
    updateStatusWorks: jest.fn(),
    updateScheduleStatus: jest.fn(),
  };

  const mockWorksServicesService = {
    calculateScheduledProgress: jest.fn(),
    scheduleServices: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleAddScheduleService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: AddSchedulesService,
          useValue: mockAddSchedulesService,
        },
        {
          provide: STATUS_FLOW_REPOSITORY,
          useValue: mockStatusFlowRepository,
        },
        { provide: WorksServicesService, useValue: mockWorksServicesService },
      ],
    }).compile();

    service = module.get<HandleAddScheduleService>(HandleAddScheduleService);
  });

  afterEach(jest.clearAllMocks);

  describe('add', () => {
    it('should add schedule and update work status within a transaction', async () => {
      const data: CreateScheduleWithServicesDTO = {
        schedule: {
          idWork: 123,
        },
        services: [{ id: 1, idTeam: 1, prog: 1 }],
      } as any;

      mockPrisma.$transaction.mockImplementation(async (cb) => cb({}));

      mockWorksServicesService.calculateScheduledProgress.mockResolvedValue(80);

      await service.add(data);

      expect(mockAddSchedulesService.add).toHaveBeenCalledWith(
        {
          idWork: 123,
          prog: 80,
        },
        expect.any(Object),
      );
      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        43,
        data.schedule.idWork,
        expect.any(Object),
      );
    });
  });
});
