import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ProgressRecalculationService } from 'src/application/usecases/services/progressRecalculation.service'; // ajuste
import { WORK_SERVICES_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesRepository';
import {
  ScheduleItem,
  ServiceExecutionStatus,
  WorkItem,
  calculateServiceTotals,
  calculateWorkProgress,
} from 'src/domain/services/pointByPointRules.service';

import { WorkStatus } from 'src/utils/pointByPoint/serviceType.utils';

// ─── Constantes e fixtures ───────────────────────────────────────────
const WORK_ID = 10;

const order = (fn: jest.Mock) => fn.mock.invocationCallOrder[0];

const sItem = (o: Partial<ScheduleItem> = {}): ScheduleItem => ({
  scheduleId: 1,
  serviceId: 100,
  prog: 10,
  real: null,
  isMaterial: false,
  status: 'EXECUTADO' as ServiceExecutionStatus,
  ...o,
});

const wItem = (o: Partial<WorkItem> = {}): WorkItem => ({
  serviceId: 100,
  isMaterial: false,
  enabledQuantity: 100,
  additionalQuantity: 0,
  realQuantity: null,
  ...o,
});

// Obra com 100 planeados e 40 executados → 40%
const WORK_ITEMS = [wItem()];
const SCHEDULE_ITEMS = [
  sItem({ scheduleId: 1, serviceId: 100, prog: 50, real: 40 }),
  sItem({ scheduleId: 2, serviceId: 101, prog: 30, real: null }),
];

describe('ProgressRecalculationService', () => {
  let service: ProgressRecalculationService;

  const mockTx = { __tx: true } as unknown as Prisma.TransactionClient;

  const mockRepository = {
    findScheduleItemsByServiceIds: jest.fn(),
    updateServiceTotals: jest.fn(),
    findWorkItems: jest.fn(),
    findScheduleItemsByWork: jest.fn(),
    findWorkStatus: jest.fn(),
    updateSchedulesProgress: jest.fn(),
    updateWorkProgress: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressRecalculationService,
        { provide: WORK_SERVICES_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get(ProgressRecalculationService);

    // valores por omissão (repostos em cada teste)
    mockRepository.findScheduleItemsByServiceIds.mockResolvedValue(
      SCHEDULE_ITEMS,
    );
    mockRepository.updateServiceTotals.mockResolvedValue(undefined);
    mockRepository.findWorkItems.mockResolvedValue(WORK_ITEMS);
    mockRepository.findScheduleItemsByWork.mockResolvedValue(SCHEDULE_ITEMS);
    mockRepository.findWorkStatus.mockResolvedValue(WorkStatus.CONFIRMADA);
    mockRepository.updateSchedulesProgress.mockResolvedValue(undefined);
    mockRepository.updateWorkProgress.mockResolvedValue(undefined);
  });

  afterEach(jest.clearAllMocks);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ════════════════════════════════════════════════════════════════════
  // recomputeServiceTotals
  // ════════════════════════════════════════════════════════════════════
  describe('recomputeServiceTotals', () => {
    it('should do nothing when the list is empty', async () => {
      await expect(
        service.recomputeServiceTotals([], mockTx),
      ).resolves.toBeUndefined();

      expect(
        mockRepository.findScheduleItemsByServiceIds,
      ).not.toHaveBeenCalled();
      expect(mockRepository.updateServiceTotals).not.toHaveBeenCalled();
    });

    it('should load the schedule items of the deduplicated ids', async () => {
      await service.recomputeServiceTotals([100, 101, 100, 101], mockTx);

      expect(
        mockRepository.findScheduleItemsByServiceIds,
      ).toHaveBeenCalledTimes(1);
      expect(mockRepository.findScheduleItemsByServiceIds).toHaveBeenCalledWith(
        [100, 101],
        mockTx,
      );
    });

    it('should write the totals computed by calculateServiceTotals', async () => {
      await service.recomputeServiceTotals([100, 101], mockTx);

      expect(mockRepository.updateServiceTotals).toHaveBeenCalledWith(
        calculateServiceTotals([100, 101], SCHEDULE_ITEMS),
        mockTx,
      );
    });

    it('should write real ?? prog as planned and keep real null without execution', async () => {
      await service.recomputeServiceTotals([100, 101], mockTx);

      expect(mockRepository.updateServiceTotals).toHaveBeenCalledWith(
        [
          { serviceId: 100, plannedQuantity: 40, realQuantity: 40 },
          { serviceId: 101, plannedQuantity: 0, realQuantity: null },
        ],
        mockTx,
      );
    });

    it('should reset the totals of a service that no longer has schedule items', async () => {
      mockRepository.findScheduleItemsByServiceIds.mockResolvedValueOnce([]);

      await service.recomputeServiceTotals([100], mockTx);

      expect(mockRepository.updateServiceTotals).toHaveBeenCalledWith(
        [{ serviceId: 100, plannedQuantity: 0, realQuantity: null }],
        mockTx,
      );
    });

    it('should read before writing', async () => {
      await service.recomputeServiceTotals([100], mockTx);

      expect(order(mockRepository.findScheduleItemsByServiceIds)).toBeLessThan(
        order(mockRepository.updateServiceTotals),
      );
    });

    it('should not write when the read fails', async () => {
      mockRepository.findScheduleItemsByServiceIds.mockRejectedValueOnce(
        new Error('db down'),
      );

      await expect(
        service.recomputeServiceTotals([100], mockTx),
      ).rejects.toThrow('db down');
      expect(mockRepository.updateServiceTotals).not.toHaveBeenCalled();
    });

    it('should propagate errors from updateServiceTotals', async () => {
      mockRepository.updateServiceTotals.mockRejectedValueOnce(
        new Error('update failed'),
      );

      await expect(
        service.recomputeServiceTotals([100], mockTx),
      ).rejects.toThrow('update failed');
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // recomputeWorkProgress
  // ════════════════════════════════════════════════════════════════════
  describe('recomputeWorkProgress', () => {
    const expectedFor = (status: number | null) =>
      calculateWorkProgress(WORK_ITEMS, SCHEDULE_ITEMS, status);

    it('should load work items, schedule items and work status with the tx', async () => {
      await service.recomputeWorkProgress(WORK_ID, mockTx);

      expect(mockRepository.findWorkItems).toHaveBeenCalledWith(
        WORK_ID,
        mockTx,
      );
      expect(mockRepository.findScheduleItemsByWork).toHaveBeenCalledWith(
        WORK_ID,
        mockTx,
      );
      expect(mockRepository.findWorkStatus).toHaveBeenCalledWith(
        WORK_ID,
        mockTx,
      );
    });

    it('should write the schedules progress computed by calculateWorkProgress', async () => {
      await service.recomputeWorkProgress(WORK_ID, mockTx);

      expect(mockRepository.updateSchedulesProgress).toHaveBeenCalledWith(
        expectedFor(WorkStatus.CONFIRMADA).schedulesProgress,
        mockTx,
      );
    });

    it('should write the work progress without demoting when the work is not concluded', async () => {
      await service.recomputeWorkProgress(WORK_ID, mockTx);

      const expected = expectedFor(WorkStatus.CONFIRMADA);
      expect(expected.demoteConclusion).toBe(false); // sanity
      expect(mockRepository.updateWorkProgress).toHaveBeenCalledWith(
        WORK_ID,
        expected.workProgress,
        false,
        mockTx,
      );
    });

    it('should demote a CONCLUIDA work that dropped below 100%', async () => {
      mockRepository.findWorkStatus.mockResolvedValueOnce(WorkStatus.CONCLUIDA);

      await service.recomputeWorkProgress(WORK_ID, mockTx);

      const expected = expectedFor(WorkStatus.CONCLUIDA);
      expect(expected.demoteConclusion).toBe(true); // sanity: 40% < 100%
      expect(mockRepository.updateWorkProgress).toHaveBeenCalledWith(
        WORK_ID,
        expected.workProgress,
        true,
        mockTx,
      );
    });

    it('should not demote a CONCLUIDA work that is still at 100%', async () => {
      mockRepository.findWorkStatus.mockResolvedValueOnce(WorkStatus.CONCLUIDA);
      mockRepository.findScheduleItemsByWork.mockResolvedValueOnce([
        sItem({ prog: 100, real: 100 }),
      ]);

      await service.recomputeWorkProgress(WORK_ID, mockTx);

      expect(mockRepository.updateWorkProgress).toHaveBeenCalledWith(
        WORK_ID,
        100,
        false,
        mockTx,
      );
    });

    it('should return the progress without demoteConclusion', async () => {
      const result = await service.recomputeWorkProgress(WORK_ID, mockTx);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { demoteConclusion, ...expected } = expectedFor(
        WorkStatus.CONFIRMADA,
      );
      expect(result).toEqual(expected);
      expect(result).not.toHaveProperty('demoteConclusion');
    });

    it('should handle a work without items (totalPlanned = 0, no schedules)', async () => {
      mockRepository.findWorkItems.mockResolvedValueOnce([]);
      mockRepository.findScheduleItemsByWork.mockResolvedValueOnce([]);

      const result = await service.recomputeWorkProgress(WORK_ID, mockTx);

      expect(result.totalPlanned).toBe(0);
      expect(result.schedulesProgress).toEqual([]);
      expect(mockRepository.updateSchedulesProgress).toHaveBeenCalledWith(
        [],
        mockTx,
      );
      expect(mockRepository.updateWorkProgress).toHaveBeenCalledWith(
        WORK_ID,
        result.workProgress,
        false,
        mockTx,
      );
    });

    it('should write schedules progress before work progress', async () => {
      await service.recomputeWorkProgress(WORK_ID, mockTx);

      expect(order(mockRepository.updateSchedulesProgress)).toBeLessThan(
        order(mockRepository.updateWorkProgress),
      );
    });

    it.each([
      ['findWorkItems'],
      ['findScheduleItemsByWork'],
      ['findWorkStatus'],
    ] as const)('should not write anything when %s fails', async (method) => {
      mockRepository[method].mockRejectedValueOnce(new Error('read failed'));

      await expect(
        service.recomputeWorkProgress(WORK_ID, mockTx),
      ).rejects.toThrow('read failed');
      expect(mockRepository.updateSchedulesProgress).not.toHaveBeenCalled();
      expect(mockRepository.updateWorkProgress).not.toHaveBeenCalled();
    });

    it('should not update the work when updateSchedulesProgress fails', async () => {
      mockRepository.updateSchedulesProgress.mockRejectedValueOnce(
        new Error('raw failed'),
      );

      await expect(
        service.recomputeWorkProgress(WORK_ID, mockTx),
      ).rejects.toThrow('raw failed');
      expect(mockRepository.updateWorkProgress).not.toHaveBeenCalled();
    });

    it('should propagate errors from updateWorkProgress', async () => {
      mockRepository.updateWorkProgress.mockRejectedValueOnce(
        new Error('work failed'),
      );

      await expect(
        service.recomputeWorkProgress(WORK_ID, mockTx),
      ).rejects.toThrow('work failed');
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // recomputeAll
  // ════════════════════════════════════════════════════════════════════
  describe('recomputeAll', () => {
    it('should recompute service totals and then the work progress, with the same tx', async () => {
      const totalsSpy = jest.spyOn(service, 'recomputeServiceTotals');
      const workSpy = jest.spyOn(service, 'recomputeWorkProgress');

      await service.recomputeAll([100, 101], WORK_ID, mockTx);

      expect(totalsSpy).toHaveBeenCalledWith([100, 101], mockTx);
      expect(workSpy).toHaveBeenCalledWith(WORK_ID, mockTx);
      expect(order(totalsSpy as unknown as jest.Mock)).toBeLessThan(
        order(workSpy as unknown as jest.Mock),
      );

      totalsSpy.mockRestore();
      workSpy.mockRestore();
    });

    it('should write service totals before reading the work items (totalPlanned depends on qtde_real)', async () => {
      await service.recomputeAll([100], WORK_ID, mockTx);

      expect(order(mockRepository.updateServiceTotals)).toBeLessThan(
        order(mockRepository.findWorkItems),
      );
    });

    it('should return the work progress result', async () => {
      const result = await service.recomputeAll([100, 101], WORK_ID, mockTx);

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { demoteConclusion, ...expected } = calculateWorkProgress(
        WORK_ITEMS,
        SCHEDULE_ITEMS,
        WorkStatus.CONFIRMADA,
      );
      expect(result).toEqual(expected);
    });

    it('should still recompute the work progress when no service ids are given', async () => {
      await service.recomputeAll([], WORK_ID, mockTx);

      expect(mockRepository.updateServiceTotals).not.toHaveBeenCalled();
      expect(mockRepository.updateWorkProgress).toHaveBeenCalled();
    });

    it('should not recompute the work progress when service totals fail', async () => {
      mockRepository.updateServiceTotals.mockRejectedValueOnce(
        new Error('totals failed'),
      );

      await expect(
        service.recomputeAll([100], WORK_ID, mockTx),
      ).rejects.toThrow('totals failed');
      expect(mockRepository.findWorkItems).not.toHaveBeenCalled();
      expect(mockRepository.updateWorkProgress).not.toHaveBeenCalled();
    });
  });
});
