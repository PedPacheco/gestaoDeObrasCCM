import { HandleAddScheduleService } from 'src/application/services/orchestrators/handleAddSchedule.service';
import { AddSchedulesService } from 'src/application/services/schedule/addSchedules.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { SchedulesDataDTO } from 'src/interface/dtos/scheduleDTO';

import { Test, TestingModule } from '@nestjs/testing';

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
      ],
    }).compile();

    service = module.get<HandleAddScheduleService>(HandleAddScheduleService);
  });

  afterEach(jest.clearAllMocks);

  describe('add', () => {
    it('should add schedule and update work status within a transaction', async () => {
      const data: SchedulesDataDTO = {
        idWork: 123,
      } as any;

      mockPrisma.$transaction.mockImplementation(async (cb) => cb({}));

      await service.add(data);

      expect(mockAddSchedulesService.add).toHaveBeenCalledWith(
        data,
        expect.any(Object),
      );
      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        43,
        data.idWork,
        expect.any(Object),
      );
    });
  });
});
