import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ScheduleExecutionValidatorService } from 'src/application/usecases/works/schedule/scheduleExecutionValidator.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { PROGRESS_EPSILON } from 'src/utils/pointByPoint/progress.utils';
import {
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';

// ─── Tipos (a interface do serviço não é exportada) ──────────────────
type ValidatorData = Parameters<
  ScheduleExecutionValidatorService['validatePointByPointExecution']
>[0];
type ValidatorTotals = Parameters<
  ScheduleExecutionValidatorService['validatePointByPointExecution']
>[1];

// ─── Constantes ──────────────────────────────────────────────────────
const SCHEDULE_ID = 3;
const WORK_ID = 10;
const DATA_PROG = new Date('2026-10-01T00:00:00.000Z');
const EPS = PROGRESS_EPSILON;

// Literais usados no fluxo tradicional
const LEGACY_SCHEDULE = { EXECUTED: 4, NOT_EXECUTED: 5, PARTIAL: 6 };
const LEGACY_WORK = { CONCLUDED: 2, ALL_SCHEDULED: 35, PENDING: 36 };

describe('ScheduleExecutionValidatorService', () => {
  let service: ScheduleExecutionValidatorService;

  const mockTx = { __tx: true } as unknown as Prisma.TransactionClient;

  const mockStatusFlowRepository = {
    updateScheduleStatus: jest.fn(),
    updateStatusWorks: jest.fn(),
  };

  // ─── Helpers ───────────────────────────────────────────────────────
  const buildData = (
    overrides: Partial<ValidatorData> = {},
  ): ValidatorData => ({
    id: SCHEDULE_ID,
    idWork: WORK_ID,
    dataProg: DATA_PROG,
    prog: 20,
    exec: 20,
    ...overrides,
  });

  const totals = (prog: number, exec?: number) =>
    ({ prog, exec }) as ValidatorTotals;

  const scheduleCall = (status: number) => [status, SCHEDULE_ID, mockTx];

  const workCall = (status: number, options?: Record<string, unknown>) =>
    options === undefined
      ? [status, WORK_ID, mockTx]
      : [status, WORK_ID, mockTx, options];

  /** Verifica a lista COMPLETA de chamadas (garante exclusividade dos caminhos) */
  const expectCalls = (schedule: unknown[][], works: unknown[][]) => {
    expect(mockStatusFlowRepository.updateScheduleStatus.mock.calls).toEqual(
      schedule,
    );
    expect(mockStatusFlowRepository.updateStatusWorks.mock.calls).toEqual(
      works,
    );
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScheduleExecutionValidatorService,
        { provide: STATUS_FLOW_REPOSITORY, useValue: mockStatusFlowRepository },
      ],
    }).compile();

    service = module.get(ScheduleExecutionValidatorService);
  });

  afterEach(jest.clearAllMocks);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ════════════════════════════════════════════════════════════════════
  // Fluxo tradicional
  // ════════════════════════════════════════════════════════════════════
  describe('validateExecutionAndUpdateStatus', () => {
    const run = (data: Partial<ValidatorData>, t: ValidatorTotals) =>
      service.validateExecutionAndUpdateStatus(buildData(data), t, mockTx);

    describe('when exec >= prog (executed)', () => {
      it('should set work 35 when programmed + executed is exactly 100', async () => {
        await run({ prog: 20, exec: 20 }, totals(50, 30)); // new = 50; 50 + 50 = 100

        expectCalls(
          [scheduleCall(LEGACY_SCHEDULE.EXECUTED)],
          [workCall(LEGACY_WORK.ALL_SCHEDULED, { totalExecuted: 50 })],
        );
      });

      it('should also treat exec > prog as executed', async () => {
        await run({ prog: 20, exec: 25 }, totals(45, 30)); // new = 55; 45 + 55 = 100

        expectCalls(
          [scheduleCall(LEGACY_SCHEDULE.EXECUTED)],
          [workCall(LEGACY_WORK.ALL_SCHEDULED, { totalExecuted: 55 })],
        );
      });

      it('should set work 36 when programmed + executed is not 100', async () => {
        await run({ prog: 20, exec: 20 }, totals(10, 30)); // new = 50; 10 + 50 = 60

        expectCalls(
          [scheduleCall(LEGACY_SCHEDULE.EXECUTED)],
          [workCall(LEGACY_WORK.PENDING, { totalExecuted: 50 })],
        );
      });

      it('should conclude the work when executed exceeds 100, capping at 100', async () => {
        await run({ prog: 20, exec: 20 }, totals(0, 90)); // 110 → 100

        expectCalls(
          [scheduleCall(LEGACY_SCHEDULE.EXECUTED)],
          [
            workCall(LEGACY_WORK.CONCLUDED, {
              data_conclusao: DATA_PROG,
              totalExecuted: 100,
            }),
          ],
        );
      });

      it('should conclude the work when executed is exactly 100', async () => {
        await run({ prog: 20, exec: 20 }, totals(0, 80));

        expectCalls(
          [scheduleCall(LEGACY_SCHEDULE.EXECUTED)],
          [
            workCall(LEGACY_WORK.CONCLUDED, {
              data_conclusao: DATA_PROG,
              totalExecuted: 100,
            }),
          ],
        );
      });

      it('should treat totals.exec undefined as 0', async () => {
        await run({ prog: 20, exec: 20 }, totals(80)); // new = 20; 80 + 20 = 100

        expectCalls(
          [scheduleCall(LEGACY_SCHEDULE.EXECUTED)],
          [workCall(LEGACY_WORK.ALL_SCHEDULED, { totalExecuted: 20 })],
        );
      });
    });

    describe('when exec = 0 and prog > 0 (not executed)', () => {
      it('should set schedule 5 and work 36 without options', async () => {
        await run({ prog: 20, exec: 0 }, totals(50, 30));

        expectCalls(
          [scheduleCall(LEGACY_SCHEDULE.NOT_EXECUTED)],
          [workCall(LEGACY_WORK.PENDING)],
        );
        // não envia totalExecuted (o executado da obra não é atualizado)
        expect(
          mockStatusFlowRepository.updateStatusWorks.mock.calls[0],
        ).toHaveLength(3);
      });
    });

    describe('when 0 < exec < prog (partial)', () => {
      it('should set schedule 6 and work 36 with the executed total', async () => {
        await run({ prog: 20, exec: 10 }, totals(0, 30)); // new = 40

        expectCalls(
          [scheduleCall(LEGACY_SCHEDULE.PARTIAL)],
          [workCall(LEGACY_WORK.PENDING, { totalExecuted: 40 })],
        );
      });

      it('should cap at 100 and NOT conclude the work (current behaviour)', async () => {
        await run({ prog: 20, exec: 10 }, totals(0, 95)); // 105 → 100

        expectCalls(
          [scheduleCall(LEGACY_SCHEDULE.PARTIAL)],
          [workCall(LEGACY_WORK.PENDING, { totalExecuted: 100 })],
        );
      });
    });

    describe('edge cases (current behaviour)', () => {
      it('should treat prog = exec = 0 as executed when total < 100', async () => {
        await run({ prog: 0, exec: 0 }, totals(50, 30)); // new = 30; 50 + 30 = 80

        expectCalls(
          [scheduleCall(LEGACY_SCHEDULE.EXECUTED)],
          [workCall(LEGACY_WORK.PENDING, { totalExecuted: 30 })],
        );
      });

      it('should fall through and overwrite the conclusion when prog = exec = 0 and total = 100', async () => {
        await run({ prog: 0, exec: 0 }, totals(0, 100));

        expectCalls(
          [
            scheduleCall(LEGACY_SCHEDULE.EXECUTED),
            scheduleCall(LEGACY_SCHEDULE.NOT_EXECUTED),
          ],
          [
            workCall(LEGACY_WORK.CONCLUDED, {
              data_conclusao: DATA_PROG,
              totalExecuted: 100,
            }),
            workCall(LEGACY_WORK.PENDING),
          ],
        );
      });

      it('should not update any status when exec is negative', async () => {
        await run({ prog: 10, exec: -5 }, totals(0, 30));

        expectCalls([], []);
      });

      it('should not update any status when exec is undefined', async () => {
        await run({ prog: 10, exec: undefined }, totals(0, 30));

        expectCalls([], []);
      });
    });

    it('should update the schedule before the work', async () => {
      await run({ prog: 20, exec: 10 }, totals(0, 30));

      expect(
        mockStatusFlowRepository.updateScheduleStatus.mock
          .invocationCallOrder[0],
      ).toBeLessThan(
        mockStatusFlowRepository.updateStatusWorks.mock.invocationCallOrder[0],
      );
    });

    it('should not update the work when the schedule update fails', async () => {
      mockStatusFlowRepository.updateScheduleStatus.mockRejectedValueOnce(
        new Error('db down'),
      );

      await expect(run({ prog: 20, exec: 20 }, totals(50, 30))).rejects.toThrow(
        'db down',
      );
      expect(mockStatusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // Ponto a ponto
  // ════════════════════════════════════════════════════════════════════
  describe('validatePointByPointExecution', () => {
    const run = (data: Partial<ValidatorData>, t: ValidatorTotals) =>
      service.validatePointByPointExecution(buildData(data), t, mockTx);

    it('sanity: PROGRESS_EPSILON is positive and small', () => {
      expect(EPS).toBeGreaterThan(0);
      expect(EPS).toBeLessThan(0.01);
    });

    // ─── REAGENDADA ──────────────────────────────────────────────────
    describe('when exec = 0', () => {
      it('should set REAGENDADA and SERVICOS_REAGENDADOS with the executed total', async () => {
        await run({ prog: 20, exec: 0 }, totals(50, 30));

        expectCalls(
          [scheduleCall(ScheduleStatus.REAGENDADA)],
          [workCall(WorkStatus.SERVICOS_REAGENDADOS, { totalExecuted: 30 })],
        );
      });

      it('should treat exec undefined as 0', async () => {
        await run({ prog: 20, exec: undefined }, totals(50, 30));

        expectCalls(
          [scheduleCall(ScheduleStatus.REAGENDADA)],
          [workCall(WorkStatus.SERVICOS_REAGENDADOS, { totalExecuted: 30 })],
        );
      });

      it('should treat prog = exec = 0 only as REAGENDADA (exclusive paths)', async () => {
        await run({ prog: 0, exec: 0 }, totals(50, 30));

        expectCalls(
          [scheduleCall(ScheduleStatus.REAGENDADA)],
          [workCall(WorkStatus.SERVICOS_REAGENDADOS, { totalExecuted: 30 })],
        );
      });

      it('should not conclude the work even if it is already at 100% (current behaviour)', async () => {
        await run({ prog: 20, exec: 0 }, totals(0, 100));

        expectCalls(
          [scheduleCall(ScheduleStatus.REAGENDADA)],
          [workCall(WorkStatus.SERVICOS_REAGENDADOS, { totalExecuted: 100 })],
        );
      });
    });

    // ─── PARCIAL ─────────────────────────────────────────────────────
    describe('when 0 < exec < prog', () => {
      it('should set PARCIAL and SERVICOS_REAGENDADOS with the executed total', async () => {
        await run({ prog: 20, exec: 10 }, totals(0, 30));

        expectCalls(
          [scheduleCall(ScheduleStatus.PARCIAL)],
          [workCall(WorkStatus.SERVICOS_REAGENDADOS, { totalExecuted: 40 })],
        );
      });

      it('should be PARCIAL when exec is below prog beyond the tolerance', async () => {
        const exec = 20 - EPS * 2;

        await run({ prog: 20, exec }, totals(0, 30));

        expectCalls(
          [scheduleCall(ScheduleStatus.PARCIAL)],
          [
            workCall(WorkStatus.SERVICOS_REAGENDADOS, {
              totalExecuted: Math.min(30 + exec, 100),
            }),
          ],
        );
      });

      it('should treat a negative exec as PARCIAL and reduce the total (current behaviour)', async () => {
        await run({ prog: 10, exec: -5 }, totals(0, 30));

        expectCalls(
          [scheduleCall(ScheduleStatus.PARCIAL)],
          [workCall(WorkStatus.SERVICOS_REAGENDADOS, { totalExecuted: 25 })],
        );
      });
    });

    // ─── EXECUTADA ───────────────────────────────────────────────────
    describe('when exec >= prog', () => {
      it('should be EXECUTADA when exec is below prog within the tolerance', async () => {
        const exec = 20 - EPS / 2;

        await run({ prog: 20, exec }, totals(50, 30)); // 50 + ~50 ≈ 100 → CONFIRMADA

        expectCalls(
          [scheduleCall(ScheduleStatus.EXECUTADA)],
          [
            workCall(WorkStatus.CONFIRMADA, {
              totalExecuted: Math.min(30 + exec, 100),
            }),
          ],
        );
      });

      it('should be EXECUTADA when exec > prog', async () => {
        await run({ prog: 20, exec: 25 }, totals(10, 30)); // new = 55; 10 + 55 = 65

        expectCalls(
          [scheduleCall(ScheduleStatus.EXECUTADA)],
          [workCall(WorkStatus.SERVICOS_REAGENDADOS, { totalExecuted: 55 })],
        );
      });

      describe('work CONCLUIDA', () => {
        it('should conclude when executed exceeds 100, capping at 100', async () => {
          await run({ prog: 20, exec: 20 }, totals(0, 90));

          expectCalls(
            [scheduleCall(ScheduleStatus.EXECUTADA)],
            [
              workCall(WorkStatus.CONCLUIDA, {
                data_conclusao: DATA_PROG,
                totalExecuted: 100,
              }),
            ],
          );
        });

        it('should conclude when executed is exactly 100', async () => {
          await run({ prog: 20, exec: 20 }, totals(0, 80));

          expectCalls(
            [scheduleCall(ScheduleStatus.EXECUTADA)],
            [
              workCall(WorkStatus.CONCLUIDA, {
                data_conclusao: DATA_PROG,
                totalExecuted: 100,
              }),
            ],
          );
        });

        it('should conclude when executed is below 100 within the tolerance', async () => {
          const exec = 20 - EPS / 2;

          await run({ prog: exec, exec }, totals(0, 80));

          expectCalls(
            [scheduleCall(ScheduleStatus.EXECUTADA)],
            [
              workCall(WorkStatus.CONCLUIDA, {
                data_conclusao: DATA_PROG,
                totalExecuted: Math.min(80 + exec, 100),
              }),
            ],
          );
        });

        it('should NOT conclude when executed is below 100 beyond the tolerance', async () => {
          const exec = 20 - EPS * 2;

          await run({ prog: exec, exec }, totals(0, 80));

          expectCalls(
            [scheduleCall(ScheduleStatus.EXECUTADA)],
            [
              workCall(WorkStatus.SERVICOS_REAGENDADOS, {
                totalExecuted: Math.min(80 + exec, 100),
              }),
            ],
          );
        });
      });

      describe('work CONFIRMADA vs SERVICOS_REAGENDADOS', () => {
        it('should set CONFIRMADA when programmed + executed is exactly 100', async () => {
          await run({ prog: 20, exec: 20 }, totals(50, 30)); // new = 50

          expectCalls(
            [scheduleCall(ScheduleStatus.EXECUTADA)],
            [workCall(WorkStatus.CONFIRMADA, { totalExecuted: 50 })],
          );
        });

        it('should set CONFIRMADA when the sum is 100 within the tolerance', async () => {
          await run({ prog: 20, exec: 20 }, totals(50 + EPS / 2, 30));

          expectCalls(
            [scheduleCall(ScheduleStatus.EXECUTADA)],
            [workCall(WorkStatus.CONFIRMADA, { totalExecuted: 50 })],
          );
        });

        it('should set SERVICOS_REAGENDADOS when the sum is below 100', async () => {
          await run({ prog: 20, exec: 20 }, totals(10, 30)); // 10 + 50 = 60

          expectCalls(
            [scheduleCall(ScheduleStatus.EXECUTADA)],
            [workCall(WorkStatus.SERVICOS_REAGENDADOS, { totalExecuted: 50 })],
          );
        });

        it('should set SERVICOS_REAGENDADOS when the sum exceeds 100 (current behaviour, see NOTA)', async () => {
          await run({ prog: 20, exec: 20 }, totals(60, 30)); // 60 + 50 = 110

          expectCalls(
            [scheduleCall(ScheduleStatus.EXECUTADA)],
            [workCall(WorkStatus.SERVICOS_REAGENDADOS, { totalExecuted: 50 })],
          );
        });

        it('should treat totals.exec undefined as 0', async () => {
          await run({ prog: 20, exec: 20 }, totals(80)); // new = 20; 80 + 20 = 100

          expectCalls(
            [scheduleCall(ScheduleStatus.EXECUTADA)],
            [workCall(WorkStatus.CONFIRMADA, { totalExecuted: 20 })],
          );
        });
      });
    });

    // ─── Ordem e erros ───────────────────────────────────────────────
    it.each([
      ['REAGENDADA', { prog: 20, exec: 0 }],
      ['PARCIAL', { prog: 20, exec: 10 }],
      ['EXECUTADA', { prog: 20, exec: 20 }],
    ])('should update the schedule before the work (%s)', async (_, data) => {
      await run(data, totals(50, 30));

      expect(
        mockStatusFlowRepository.updateScheduleStatus.mock
          .invocationCallOrder[0],
      ).toBeLessThan(
        mockStatusFlowRepository.updateStatusWorks.mock.invocationCallOrder[0],
      );
    });

    it('should not update the work when the schedule update fails', async () => {
      mockStatusFlowRepository.updateScheduleStatus.mockRejectedValueOnce(
        new Error('db down'),
      );

      await expect(run({ prog: 20, exec: 20 }, totals(0, 90))).rejects.toThrow(
        'db down',
      );
      expect(mockStatusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
    });

    it('should propagate errors from updateStatusWorks', async () => {
      mockStatusFlowRepository.updateStatusWorks.mockRejectedValueOnce(
        new Error('status failed'),
      );

      await expect(run({ prog: 20, exec: 20 }, totals(0, 90))).rejects.toThrow(
        'status failed',
      );
    });
  });
});
