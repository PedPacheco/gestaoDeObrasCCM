import {
  DEMOTED_WORK_STATUS,
  HistoryRow,
  ReschedulePlan,
  ScheduleExecutionRow,
  ScheduleItem,
  SchedulingHistoryRow,
  SchedulingService,
  ServiceExecutionStatus,
  WorkItem,
  calculateAllSchedulesProgress,
  calculateScheduleProgress,
  calculateServiceTotals,
  calculateTotalPlanned,
  calculateWorkExecutionTotals,
  calculateWorkProgress,
  consumedQuantity,
  deriveExecutionStatus,
  executedQuantity,
  findSchedulingViolation,
  fromHistoryRow,
  hasLockedExecution,
  hasRealExecution,
  isDiscarded,
  isExecuted,
  isNotYetReported,
  isPartial,
  isRescheduled,
  planReschedule,
  resolveScheduleOutcome,
  statusAfterScheduling,
} from 'src/domain/services/pointByPointRules.service';
import { PROGRESS_EPSILON } from 'src/utils/pointByPoint/progress.utils';
import {
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';

const EPS = PROGRESS_EPSILON;

// ─── Fábricas de fixtures ────────────────────────────────────────────
const { EXECUTADO, REPROGRAMADO, NAO_EXECUTADO } = ServiceExecutionStatus;

/**
 * O `status` é a fonte da verdade. Por conveniência, quando o teste só indica
 * `real`, o status é derivado assim:
 * - null/undefined → null (programado, ainda SEM apontamento)
 * - 0              → NAO_EXECUTADO
 * - > 0            → EXECUTADO
 * Atenção: no apontamento, real = null grava REPROGRAMADO (deriveExecutionStatus).
 * Para esse caso, passe `status: REPROGRAMADO` explicitamente.
 */
const statusFromReal = (
  real: number | null | undefined,
): ServiceExecutionStatus | null =>
  real === null || real === undefined ? null : deriveExecutionStatus(real);

const sItem = (o: Partial<ScheduleItem> = {}): ScheduleItem => ({
  scheduleId: 1,
  serviceId: 100,
  prog: 10,
  real: null,
  isMaterial: false,
  status: statusFromReal(o.real),
  ...o,
});

const hRow = (o: Partial<SchedulingHistoryRow> = {}): SchedulingHistoryRow => ({
  id_servico: 100,
  prog: null,
  real: null,
  status: statusFromReal(o.real),
  ...o,
});

const wItem = (o: Partial<WorkItem> = {}): WorkItem => ({
  serviceId: 100,
  isMaterial: false,
  enabledQuantity: 10,
  additionalQuantity: 0,
  realQuantity: null,
  ...o,
});

describe('pointByPointRules', () => {
  it('sanity: PROGRESS_EPSILON is positive and small', () => {
    expect(EPS).toBeGreaterThan(0);
    expect(EPS).toBeLessThan(0.01);
  });

  // ════════════════════════════════════════════════════════════════════
  // Estado da linha (status)
  // ════════════════════════════════════════════════════════════════════
  describe('isDiscarded', () => {
    it.each([
      [NAO_EXECUTADO, true],
      [EXECUTADO, false],
      [REPROGRAMADO, false],
      [null, false],
    ])('status = %p → %p', (status, expected) => {
      expect(isDiscarded({ status })).toBe(expected);
    });
  });

  describe('deriveExecutionStatus', () => {
    it.each([
      [null, REPROGRAMADO],
      [undefined, REPROGRAMADO],
      [0, NAO_EXECUTADO],
      [0.5, EXECUTADO],
      [5, EXECUTADO],
    ])('deriveExecutionStatus(%p) → %p', (real, expected) => {
      expect(deriveExecutionStatus(real)).toBe(expected);
    });

    it('should never return NAO_EXECUTADO for real = null', () => {
      expect(deriveExecutionStatus(null)).not.toBe(NAO_EXECUTADO);
    });
  });

  describe('status helpers', () => {
    it('isExecuted / isRescheduled should look only at the status', () => {
      expect(isExecuted({ status: EXECUTADO })).toBe(true);
      expect(isExecuted({ status: NAO_EXECUTADO })).toBe(false);
      expect(isRescheduled({ status: REPROGRAMADO })).toBe(true);
      expect(isRescheduled({ status: null })).toBe(false);
    });

    it('isNotYetReported should require status null and real null', () => {
      expect(isNotYetReported({ status: null, prog: 1, real: null })).toBe(
        true,
      );
      expect(isNotYetReported({ status: null, prog: 1, real: 2 })).toBe(false);
      expect(isNotYetReported({ status: EXECUTADO, prog: 1, real: null })).toBe(
        false,
      );
      expect(
        isNotYetReported({ status: REPROGRAMADO, prog: 1, real: null }),
      ).toBe(false);
    });

    it.each([
      ['real below prog', 10, 4, true],
      ['real below prog beyond the tolerance', 10, 10 - EPS * 2, true],
      ['real below prog within the tolerance', 10, 10 - EPS / 2, false],
      ['real equal to prog', 10, 10, false],
      ['real above prog', 10, 12, false],
      ['real = 0 (discarded)', 10, 0, false],
      ['real = null', 10, null, false],
      ['prog = null', null, 5, false],
    ])('isPartial: %s', (_, prog, real, expected) => {
      expect(isPartial({ status: EXECUTADO, prog, real })).toBe(expected);
    });

    it.each([
      [5, true],
      [0, false],
      [null, false],
    ])('hasRealExecution(real = %p) → %p', (real, expected) => {
      expect(hasRealExecution({ status: null, prog: 10, real })).toBe(expected);
    });

    it.each([
      ['no report → prog', null, 10, null, 10],
      ['no report, prog null → 0', null, null, null, 0],
      ['EXECUTADO partial → real', EXECUTADO, 10, 4, 4],
      ['EXECUTADO above prog → real', EXECUTADO, 10, 12, 12],
      ['NAO_EXECUTADO → 0', NAO_EXECUTADO, 10, 0, 0],
      ['REPROGRAMADO without real → 0', REPROGRAMADO, 10, null, 0],
      ['REPROGRAMADO partial → real (rest goes back)', REPROGRAMADO, 10, 4, 4],
    ])('consumedQuantity: %s', (_, status, prog, real, expected) => {
      expect(consumedQuantity({ status, prog, real })).toBe(expected);
    });

    it.each([
      ['no report → 0', null, 10, null, 0],
      ['EXECUTADO → real', EXECUTADO, 10, 4, 4],
      ['REPROGRAMADO partial → real', REPROGRAMADO, 10, 4, 4],
      ['REPROGRAMADO without real → 0', REPROGRAMADO, 10, null, 0],
      ['NAO_EXECUTADO → 0', NAO_EXECUTADO, 10, 0, 0],
    ])('executedQuantity: %s', (_, status, prog, real, expected) => {
      expect(executedQuantity({ status, prog, real })).toBe(expected);
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // calculateServiceTotals
  // ════════════════════════════════════════════════════════════════════
  describe('calculateServiceTotals', () => {
    it('should return an entry for every requested service, even without items', () => {
      expect(calculateServiceTotals([100, 101], [])).toEqual([
        { serviceId: 100, plannedQuantity: 0, realQuantity: null },
        { serviceId: 101, plannedQuantity: 0, realQuantity: null },
      ]);
    });

    it('should return an empty list when no ids are given', () => {
      expect(calculateServiceTotals([], [sItem()])).toEqual([]);
    });

    it('should sum prog as planned and keep real null when nothing was reported', () => {
      const result = calculateServiceTotals(
        [100],
        [sItem({ scheduleId: 1, prog: 10 }), sItem({ scheduleId: 2, prog: 5 })],
      );

      expect(result).toEqual([
        { serviceId: 100, plannedQuantity: 15, realQuantity: null },
      ]);
    });

    it('should use real instead of prog as planned for executed items', () => {
      const result = calculateServiceTotals(
        [100],
        [
          sItem({ scheduleId: 1, prog: 10, real: null }),
          sItem({ scheduleId: 2, prog: 5, real: 3 }),
        ],
      );

      expect(result).toEqual([
        { serviceId: 100, plannedQuantity: 13, realQuantity: 3 },
      ]);
    });

    it('should count a discarded item (NAO_EXECUTADO) as 0 planned and 0 real (not null)', () => {
      const result = calculateServiceTotals(
        [100],
        [sItem({ prog: 10, real: 0, status: NAO_EXECUTADO })],
      );

      expect(result).toEqual([
        { serviceId: 100, plannedQuantity: 0, realQuantity: 0 },
      ]);
    });

    it('should release the whole balance of REPROGRAMADO rows without real', () => {
      const result = calculateServiceTotals(
        [100],
        [
          sItem({ scheduleId: 1, prog: 10, status: REPROGRAMADO }),
          sItem({ scheduleId: 2, prog: 4 }),
        ],
      );

      expect(result).toEqual([
        { serviceId: 100, plannedQuantity: 4, realQuantity: null },
      ]);
    });

    it('should keep the executed part of a partial REPROGRAMADO row and release the rest', () => {
      const result = calculateServiceTotals(
        [100],
        [
          sItem({ scheduleId: 1, prog: 10, real: 6, status: REPROGRAMADO }),
          sItem({ scheduleId: 2, prog: 4 }), // o que faltou, reprogramado
        ],
      );

      expect(result).toEqual([
        { serviceId: 100, plannedQuantity: 10, realQuantity: 6 },
      ]);
    });

    it('should treat prog = null and real = null as 0 planned', () => {
      const result = calculateServiceTotals(
        [100],
        [sItem({ prog: null, real: null })],
      );

      expect(result[0].plannedQuantity).toBe(0);
    });

    it('should include materials (no material filter in item totals)', () => {
      const result = calculateServiceTotals(
        [100],
        [sItem({ isMaterial: true, prog: 7 })],
      );

      expect(result[0].plannedQuantity).toBe(7);
    });

    it('should ignore items of services that were not requested', () => {
      const result = calculateServiceTotals(
        [100],
        [
          sItem({ serviceId: 100, prog: 10 }),
          sItem({ serviceId: 999, prog: 50, real: 50 }),
        ],
      );

      expect(result).toEqual([
        { serviceId: 100, plannedQuantity: 10, realQuantity: null },
      ]);
    });

    it('should deduplicate repeated service ids', () => {
      const result = calculateServiceTotals([100, 100], [sItem({ prog: 10 })]);

      expect(result).toEqual([
        { serviceId: 100, plannedQuantity: 10, realQuantity: null },
      ]);
    });

    it('should keep the order of the requested ids', () => {
      const result = calculateServiceTotals([101, 100], []);

      expect(result.map((t) => t.serviceId)).toEqual([101, 100]);
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // calculateAllSchedulesProgress
  // ════════════════════════════════════════════════════════════════════
  describe('calculateAllSchedulesProgress', () => {
    const TOTAL = 200;

    it('should return an empty list when there are no items', () => {
      expect(calculateAllSchedulesProgress([], TOTAL)).toEqual([]);
    });

    it('should compute prog % and exec = null for schedules without report', () => {
      const [result] = calculateAllSchedulesProgress(
        [
          sItem({ serviceId: 100, prog: 20 }),
          sItem({ serviceId: 101, prog: 30 }),
        ],
        TOTAL,
      );

      expect(result.idProgramacao).toBe(1);
      expect(result.prog).toBeCloseTo(25);
      expect(result.exec).toBeNull();
    });

    it('should compute exec % when at least one item has real', () => {
      const [result] = calculateAllSchedulesProgress(
        [
          sItem({ serviceId: 100, prog: 20, real: 10 }),
          sItem({ serviceId: 101, prog: 20, real: null }),
        ],
        TOTAL,
      );

      expect(result.prog).toBeCloseTo(20);
      expect(result.exec).toBeCloseTo(5); // o real nulo conta como 0
    });

    it('should group by schedule in order of first appearance', () => {
      const result = calculateAllSchedulesProgress(
        [
          sItem({ scheduleId: 2, prog: 40, real: 20 }),
          sItem({ scheduleId: 1, prog: 20 }),
          sItem({ scheduleId: 2, serviceId: 101, prog: 20 }),
        ],
        TOTAL,
      );

      expect(result.map((r) => r.idProgramacao)).toEqual([2, 1]);
      expect(result[0].prog).toBeCloseTo(30);
      expect(result[0].exec).toBeCloseTo(10);
      expect(result[1].prog).toBeCloseTo(10);
      expect(result[1].exec).toBeNull();
    });

    it('should ignore materials', () => {
      const [result] = calculateAllSchedulesProgress(
        [
          sItem({ prog: 20 }),
          sItem({ serviceId: 101, prog: 100, real: 100, isMaterial: true }),
        ],
        TOTAL,
      );

      expect(result.prog).toBeCloseTo(10);
      expect(result.exec).toBeNull();
    });

    it('should ignore discarded items (NAO_EXECUTADO) in prog and in hasExecution', () => {
      const [result] = calculateAllSchedulesProgress(
        [sItem({ prog: 20 }), sItem({ serviceId: 101, prog: 50, real: 0 })],
        TOTAL,
      );

      expect(result.prog).toBeCloseTo(10);
      expect(result.exec).toBeNull();
    });

    it('should keep the original prog of REPROGRAMADO rows and return exec = 0', () => {
      const [result] = calculateAllSchedulesProgress(
        [
          sItem({ prog: 20 }),
          sItem({ serviceId: 101, prog: 50, status: REPROGRAMADO }),
        ],
        TOTAL,
      );

      expect(result.prog).toBeCloseTo(35);
      expect(result.exec).toBe(0);
    });

    it('should keep a rescheduled schedule (only REPROGRAMADO rows) with its prog and exec = 0', () => {
      const [result] = calculateAllSchedulesProgress(
        [sItem({ prog: 20, status: REPROGRAMADO })],
        TOTAL,
      );

      expect(result.prog).toBeCloseTo(10);
      expect(result.exec).toBe(0);
    });

    it('should count the executed part of a partial REPROGRAMADO row', () => {
      const [result] = calculateAllSchedulesProgress(
        [sItem({ prog: 20, real: 8, status: REPROGRAMADO })],
        TOTAL,
      );

      expect(result.prog).toBeCloseTo(10);
      expect(result.exec).toBeCloseTo(4);
    });

    it('should exclude a discarded service from EVERY schedule (no prog above 100%)', () => {
      // Serviços 1 e 2 (10 cada); o 2 foi descartado → totalPlanned = 10
      const items: ScheduleItem[] = [
        sItem({ scheduleId: 1, serviceId: 1, prog: 10, status: REPROGRAMADO }),
        sItem({ scheduleId: 1, serviceId: 2, prog: 10, status: REPROGRAMADO }),
        sItem({ scheduleId: 2, serviceId: 1, prog: 10, real: 10 }),
        sItem({ scheduleId: 2, serviceId: 2, prog: 10, real: 0 }),
      ];

      const result = calculateAllSchedulesProgress(items, 10);

      expect(result).toEqual([
        { idProgramacao: 1, prog: 100, exec: 0 },
        { idProgramacao: 2, prog: 100, exec: 100 },
      ]);
    });

    it('should count only the executed part of a closed service in prog', () => {
      const result = calculateAllSchedulesProgress(
        [
          sItem({ scheduleId: 1, prog: 10, real: 3, status: REPROGRAMADO }),
          sItem({ scheduleId: 2, prog: 7, real: 0 }), // NAO_EXECUTADO → encerra o serviço
        ],
        TOTAL,
      );

      expect(result).toHaveLength(1);
      expect(result[0].idProgramacao).toBe(1);
      expect(result[0].prog).toBeCloseTo(1.5);
      expect(result[0].exec).toBeCloseTo(1.5);
    });

    it('should keep schedules at 100% when the remaining part is discarded (10 + 10 example)', () => {
      const items = [
        sItem({ scheduleId: 1, serviceId: 1, prog: 10, real: 10 }),
        sItem({ scheduleId: 2, serviceId: 1, prog: 10, real: 0 }),
      ];
      const total = calculateTotalPlanned(
        [wItem({ serviceId: 1, enabledQuantity: 20, realQuantity: 10 })],
        items,
      );

      expect(calculateAllSchedulesProgress(items, total)).toEqual([
        { idProgramacao: 1, prog: 100, exec: 100 },
      ]);
    });

    it('should omit schedules that only have materials or discarded items', () => {
      const result = calculateAllSchedulesProgress(
        [
          sItem({ scheduleId: 1, prog: 20 }),
          sItem({ scheduleId: 2, isMaterial: true }),
          sItem({ scheduleId: 3, serviceId: 101, real: 0 }),
        ],
        TOTAL,
      );

      expect(result.map((r) => r.idProgramacao)).toEqual([1]);
    });

    it('should treat prog = null as 0', () => {
      const [result] = calculateAllSchedulesProgress(
        [sItem({ prog: null, real: 20 })],
        TOTAL,
      );

      expect(result.prog).toBeCloseTo(0);
      expect(result.exec).toBeCloseTo(10);
    });

    it('should not produce NaN/Infinity when totalPlanned = 0', () => {
      const [result] = calculateAllSchedulesProgress(
        [sItem({ prog: 10, real: 5 })],
        0,
      );

      expect(Number.isFinite(result.prog)).toBe(true);
      expect(Number.isFinite(result.exec as number)).toBe(true);
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // calculateScheduleProgress
  // ════════════════════════════════════════════════════════════════════
  describe('calculateScheduleProgress', () => {
    const TOTAL = 200;
    const ITEMS = [
      sItem({ scheduleId: 1, prog: 20, real: 10 }),
      sItem({ scheduleId: 2, prog: 40 }),
    ];

    it('should return prog and exec of the requested schedule', () => {
      const result = calculateScheduleProgress(ITEMS, TOTAL, 1);

      expect(result.prog).toBeCloseTo(10);
      expect(result.exec).toBeCloseTo(5);
    });

    it('should return exec = 0 (not null) when the schedule has no execution', () => {
      const result = calculateScheduleProgress(ITEMS, TOTAL, 2);

      expect(result.prog).toBeCloseTo(20);
      expect(result.exec).toBe(0);
    });

    it('should return zeros when the schedule is not found', () => {
      expect(calculateScheduleProgress(ITEMS, TOTAL, 99)).toEqual({
        prog: 0,
        exec: 0,
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // calculateWorkExecutionTotals
  // ════════════════════════════════════════════════════════════════════
  describe('calculateWorkExecutionTotals', () => {
    const TOTAL = 200;

    it('should compute executed and coverage (executed + reserved)', () => {
      const result = calculateWorkExecutionTotals(
        [
          sItem({ scheduleId: 1, serviceId: 100, prog: 20, real: 20 }),
          sItem({ scheduleId: 2, serviceId: 101, prog: 40 }),
        ],
        TOTAL,
      );

      expect(result.executed).toBeCloseTo(10);
      expect(result.coverage).toBeCloseTo(30);
    });

    it('should not double count a partial REPROGRAMADO row plus its new schedule', () => {
      const result = calculateWorkExecutionTotals(
        [
          sItem({ scheduleId: 1, prog: 10, real: 6, status: REPROGRAMADO }),
          sItem({ scheduleId: 2, prog: 4 }),
        ],
        10,
      );

      expect(result.executed).toBeCloseTo(60);
      expect(result.coverage).toBeCloseTo(100);
    });

    it('should not cover anything with REPROGRAMADO rows without real', () => {
      const result = calculateWorkExecutionTotals(
        [sItem({ prog: 10, status: REPROGRAMADO })],
        10,
      );

      expect(result.executed).toBeCloseTo(0);
      expect(result.coverage).toBeCloseTo(0);
    });

    it('should ignore materials and discarded items', () => {
      const result = calculateWorkExecutionTotals(
        [
          sItem({ serviceId: 100, prog: 20, real: 20 }),
          sItem({ serviceId: 101, prog: 50, real: 50, isMaterial: true }),
          sItem({ serviceId: 102, prog: 60, real: 0 }),
        ],
        TOTAL,
      );

      expect(result.executed).toBeCloseTo(10);
      expect(result.coverage).toBeCloseTo(10);
    });

    it('should cap executed and coverage at 100', () => {
      const result = calculateWorkExecutionTotals(
        [sItem({ prog: 300, real: 250 })],
        TOTAL,
      );

      expect(result).toEqual({ executed: 100, coverage: 100 });
    });

    it('should return zeros when there are no items', () => {
      const result = calculateWorkExecutionTotals([], TOTAL);

      expect(result.executed).toBeCloseTo(0);
      expect(result.coverage).toBeCloseTo(0);
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // calculateWorkProgress
  // ════════════════════════════════════════════════════════════════════
  describe('calculateWorkProgress', () => {
    it('DEMOTED_WORK_STATUS should be SERVICOS_REAGENDADOS', () => {
      expect(DEMOTED_WORK_STATUS).toBe(WorkStatus.SERVICOS_REAGENDADOS);
    });

    it('should compute totalPlanned excluding discarded items and materials', () => {
      const { totalPlanned } = calculateWorkProgress(
        [
          wItem({ enabledQuantity: 100, additionalQuantity: 20 }), // 120
          wItem({
            enabledQuantity: 50,
            additionalQuantity: null,
            realQuantity: 10,
          }), // 50
          wItem({ enabledQuantity: null, additionalQuantity: 30 }), // 30
          wItem({ enabledQuantity: 999, realQuantity: 0 }), // descartado
          wItem({ enabledQuantity: 999, isMaterial: true }), // material
        ],
        [],
        null,
      );

      expect(totalPlanned).toBe(200);
    });

    it('should compute workProgress from the real of countable schedule items', () => {
      const { workProgress } = calculateWorkProgress(
        [wItem({ enabledQuantity: 200 })],
        [
          sItem({ real: 30 }),
          sItem({ serviceId: 101, real: 20 }),
          sItem({ serviceId: 102, real: null }),
          sItem({ serviceId: 103, real: 100, isMaterial: true }), // ignorado
        ],
        null,
      );

      expect(workProgress).toBeCloseTo(25);
    });

    it('should count the executed part of partial REPROGRAMADO rows', () => {
      const { workProgress } = calculateWorkProgress(
        [wItem({ enabledQuantity: 200 })],
        [sItem({ prog: 50, real: 30, status: REPROGRAMADO })],
        null,
      );

      expect(workProgress).toBeCloseTo(15);
    });

    it('should cap workProgress at 100', () => {
      const { workProgress } = calculateWorkProgress(
        [wItem({ enabledQuantity: 100 })],
        [sItem({ real: 150 })],
        null,
      );

      expect(workProgress).toBe(100);
    });

    it('should compute schedulesProgress with the same totalPlanned', () => {
      const scheduleItems = [
        sItem({ scheduleId: 1, prog: 50, real: 20 }),
        sItem({ scheduleId: 2, prog: 30 }),
      ];

      const result = calculateWorkProgress(
        [wItem({ enabledQuantity: 200 })],
        scheduleItems,
        null,
      );

      expect(result.schedulesProgress).toEqual(
        calculateAllSchedulesProgress(scheduleItems, 200),
      );
    });

    it('should reach 100% when the remaining part of a service is discarded', () => {
      const { totalPlanned, workProgress } = calculateWorkProgress(
        [wItem({ serviceId: 1, enabledQuantity: 20, realQuantity: 10 })],
        [
          sItem({ scheduleId: 1, serviceId: 1, prog: 10, real: 10 }),
          sItem({ scheduleId: 2, serviceId: 1, prog: 10, real: 0 }),
        ],
        null,
      );

      expect(totalPlanned).toBe(10);
      expect(workProgress).toBe(100);
    });

    describe('demoteConclusion', () => {
      const run = (executed: number, status: number | null) =>
        calculateWorkProgress(
          [wItem({ enabledQuantity: 100 })],
          [sItem({ real: executed })],
          status,
        ).demoteConclusion;

      it('should be true when the work is CONCLUIDA and below 100%', () => {
        expect(run(80, WorkStatus.CONCLUIDA)).toBe(true);
      });

      it('should be false when the work is CONCLUIDA and at 100%', () => {
        expect(run(100, WorkStatus.CONCLUIDA)).toBe(false);
      });

      it('should be false when the work is CONCLUIDA and above 100% (capped)', () => {
        expect(run(120, WorkStatus.CONCLUIDA)).toBe(false);
      });

      it.each([
        [WorkStatus.CONFIRMADA],
        [WorkStatus.SERVICOS_REAGENDADOS],
        [null],
      ])('should be false for status %p even below 100%', (status) => {
        expect(run(10, status)).toBe(false);
      });
    });
  });

  describe('calculateTotalPlanned', () => {
    it('should use viabilizado + adicional for open services', () => {
      expect(
        calculateTotalPlanned(
          [wItem({ serviceId: 1, enabledQuantity: 20, additionalQuantity: 5 })],
          [sItem({ serviceId: 1, prog: 10, real: 10 })],
        ),
      ).toBe(25);
    });

    it('should use only the executed part of a closed service (10 + 10, second discarded)', () => {
      expect(
        calculateTotalPlanned(
          [wItem({ serviceId: 1, enabledQuantity: 20, realQuantity: 10 })],
          [
            sItem({ scheduleId: 1, serviceId: 1, prog: 10, real: 10 }),
            sItem({ scheduleId: 2, serviceId: 1, prog: 10, real: 0 }),
          ],
        ),
      ).toBe(10);
    });

    it('should count 0 for a closed service without execution', () => {
      expect(
        calculateTotalPlanned(
          [wItem({ serviceId: 1, enabledQuantity: 20, realQuantity: 0 })],
          [sItem({ serviceId: 1, prog: 20, real: 0 })],
        ),
      ).toBe(0);
    });

    it('should keep reserved lines of a closed service in the total', () => {
      expect(
        calculateTotalPlanned(
          [wItem({ serviceId: 1, enabledQuantity: 20, realQuantity: 0 })],
          [
            sItem({ scheduleId: 1, serviceId: 1, prog: 10, real: 0 }),
            sItem({ scheduleId: 2, serviceId: 1, prog: 10 }), // sem apontamento
          ],
        ),
      ).toBe(10);
    });

    it('should keep excluding legacy discarded services (realQuantity = 0, no NAO_EXECUTADO line)', () => {
      expect(
        calculateTotalPlanned(
          [
            wItem({ serviceId: 1, enabledQuantity: 20, realQuantity: 0 }),
            wItem({ serviceId: 2, enabledQuantity: 30 }),
          ],
          [],
        ),
      ).toBe(30);
    });

    it('should ignore materials', () => {
      expect(
        calculateTotalPlanned(
          [
            wItem({ serviceId: 1, enabledQuantity: 20 }),
            wItem({ serviceId: 2, enabledQuantity: 99, isMaterial: true }),
          ],
          [],
        ),
      ).toBe(20);
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // statusAfterScheduling
  // ════════════════════════════════════════════════════════════════════
  describe('statusAfterScheduling', () => {
    it('should approve a schedule PENDENTE_REVISAO', () => {
      expect(statusAfterScheduling(ScheduleStatus.PENDENTE_REVISAO)).toBe(
        ScheduleStatus.APROVADA,
      );
    });

    it.each([
      [ScheduleStatus.APROVADA],
      [ScheduleStatus.CONFIRMADA],
      [ScheduleStatus.EXECUTADA],
      [ScheduleStatus.REAGENDADA],
    ])('should return undefined for status %p', (status) => {
      expect(statusAfterScheduling(status)).toBeUndefined();
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // hasLockedExecution
  // ════════════════════════════════════════════════════════════════════
  describe('hasLockedExecution', () => {
    const open = { real: null, status: null };

    it('should be false for an open schedule without execution', () => {
      expect(hasLockedExecution(ScheduleStatus.CONFIRMADA, [open, open])).toBe(
        false,
      );
    });

    it('should be false for a null status and no items', () => {
      expect(hasLockedExecution(null, [])).toBe(false);
    });

    it.each([
      ['EXECUTADO', { real: 5, status: EXECUTADO }],
      ['NAO_EXECUTADO', { real: 0, status: NAO_EXECUTADO }],
      ['partial REPROGRAMADO', { real: 3, status: REPROGRAMADO }],
      ['real filled without status (legacy)', { real: 3, status: null }],
    ])('should be true when any item is %s', (_, item) => {
      expect(hasLockedExecution(ScheduleStatus.CONFIRMADA, [open, item])).toBe(
        true,
      );
    });

    it('should not lock for REPROGRAMADO rows without real', () => {
      expect(
        hasLockedExecution(ScheduleStatus.CONFIRMADA, [
          { real: null, status: REPROGRAMADO },
        ]),
      ).toBe(false);
    });

    it.each([[ScheduleStatus.EXECUTADA], [ScheduleStatus.PARCIAL]])(
      'should be true for status %p even without items',
      (status) => {
        expect(hasLockedExecution(status, [])).toBe(true);
      },
    );

    it('should be false for REAGENDADA without execution (current behaviour)', () => {
      expect(hasLockedExecution(ScheduleStatus.REAGENDADA, [open])).toBe(false);
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // findSchedulingViolation
  // ════════════════════════════════════════════════════════════════════
  describe('findSchedulingViolation', () => {
    const WORK_ID = 10;

    // Serviço 100: total = 10 + 2 = 12; consumido = 3 → disponível 9
    const service = (
      o: Partial<SchedulingService> = {},
    ): SchedulingService => ({
      id: 100,
      id_obra: WORK_ID,
      operacao: 'OP-1',
      ponto: 'P1',
      qtde_real: null,
      viabilizado: 10,
      qtde_adicional: 2,
      ...o,
    });

    const HISTORY = [hRow({ prog: 4, real: 3 })];

    const run = (
      requests: { id: number; prog: number; additional?: number | null }[],
      services: SchedulingService[] = [service()],
      history: SchedulingHistoryRow[] = HISTORY,
    ) => findSchedulingViolation(WORK_ID, requests, services, history);

    it('should return null when everything is valid', () => {
      expect(run([{ id: 100, prog: 5 }])).toBeNull();
    });

    it('should return null for an empty request list', () => {
      expect(run([])).toBeNull();
    });

    it('should return not_owned when the service does not exist', () => {
      expect(run([{ id: 999, prog: 1 }])).toEqual({
        type: 'not_owned',
        serviceId: 999,
      });
    });

    it('should return not_owned when the service belongs to another work', () => {
      expect(run([{ id: 100, prog: 1 }], [service({ id_obra: 99 })])).toEqual({
        type: 'not_owned',
        serviceId: 100,
      });
    });

    it('should return discarded with operation + point as label', () => {
      expect(run([{ id: 100, prog: 1 }], [service({ qtde_real: 0 })])).toEqual({
        type: 'discarded',
        label: 'OP-1 P1',
      });
    });

    it('should fall back to the service id as label', () => {
      expect(
        run(
          [{ id: 100, prog: 1 }],
          [service({ qtde_real: 0, operacao: null, ponto: null })],
        ),
      ).toEqual({ type: 'discarded', label: '100' });
    });

    it('should use only the available part of the label', () => {
      expect(
        run(
          [{ id: 100, prog: 1 }],
          [service({ qtde_real: 0, operacao: null })],
        ),
      ).toEqual({ type: 'discarded', label: 'P1' });
    });

    it('should skip the balance check when viabilizado is null', () => {
      expect(
        run([{ id: 100, prog: 1000 }], [service({ viabilizado: null })]),
      ).toBeNull();
    });

    it('should accept a request equal to the available balance', () => {
      expect(run([{ id: 100, prog: 9 }])).toBeNull();
    });

    it('should accept a request above the balance within PROGRESS_EPSILON', () => {
      expect(run([{ id: 100, prog: 9 + EPS / 2 }])).toBeNull();
    });

    it('should return insufficient_balance above the available balance', () => {
      expect(run([{ id: 100, prog: 10 }])).toEqual({
        type: 'insufficient_balance',
        label: 'OP-1 P1',
        available: 9,
        requested: 10,
      });
    });

    it('should return a negative available without clamping (the caller formats it)', () => {
      const result = run(
        [{ id: 100, prog: 1 }],
        [service()],
        [hRow({ prog: null, real: 15 })],
      );

      expect(result).toEqual({
        type: 'insufficient_balance',
        label: 'OP-1 P1',
        available: -3,
        requested: 1,
      });
    });

    it('should sum requests of the same service (several teams)', () => {
      expect(
        run([
          { id: 100, prog: 5 },
          { id: 100, prog: 5 },
        ]),
      ).toMatchObject({ type: 'insufficient_balance', requested: 10 });
    });

    it('should use prog as consumption for rows without report', () => {
      expect(
        run(
          [{ id: 100, prog: 9 }],
          [service()],
          [hRow({ prog: 4, real: null })],
        ),
      ).toMatchObject({ type: 'insufficient_balance', available: 8 });
    });

    it('should not consume balance for REPROGRAMADO rows without real', () => {
      expect(
        run(
          [{ id: 100, prog: 12 }],
          [service()],
          [hRow({ prog: 4, real: null, status: REPROGRAMADO })],
        ),
      ).toBeNull();
    });

    it('should consume only the executed part of a partial REPROGRAMADO row', () => {
      const history = [hRow({ prog: 10, real: 6, status: REPROGRAMADO })];

      expect(run([{ id: 100, prog: 6 }], [service()], history)).toBeNull();
      expect(run([{ id: 100, prog: 7 }], [service()], history)).toMatchObject({
        type: 'insufficient_balance',
        available: 6,
        requested: 7,
      });
    });

    it('should return discarded when the history has a NAO_EXECUTADO row for the service', () => {
      expect(
        run(
          [{ id: 100, prog: 1 }],
          [service()],
          [hRow({ prog: 4, real: 0, status: NAO_EXECUTADO })],
        ),
      ).toEqual({ type: 'discarded', label: 'OP-1 P1' });
    });

    it('should not flag discarded for NAO_EXECUTADO rows of other services', () => {
      expect(
        run(
          [{ id: 100, prog: 1 }],
          [service()],
          [hRow({ id_servico: 555, prog: 4, real: 0, status: NAO_EXECUTADO })],
        ),
      ).toBeNull();
    });

    it('should ignore history of other services', () => {
      expect(
        run(
          [{ id: 100, prog: 12 }],
          [service()],
          [hRow({ id_servico: 555, prog: 50, real: 50 })],
        ),
      ).toBeNull();
    });

    it('should use the payload additional instead of qtde_adicional', () => {
      expect(run([{ id: 100, prog: 8, additional: 0 }])).toMatchObject({
        type: 'insufficient_balance',
        available: 7,
      });
      expect(run([{ id: 100, prog: 12, additional: 5 }])).toBeNull();
    });

    it('should ignore a null payload additional', () => {
      expect(run([{ id: 100, prog: 9, additional: null }])).toBeNull();
    });

    it('should use the last additional when the service is sent twice', () => {
      expect(
        run([
          { id: 100, prog: 1, additional: 0 },
          { id: 100, prog: 1, additional: 10 },
        ]),
      ).toBeNull();
    });

    it('should return the first violation in request order', () => {
      const result = run([
        { id: 100, prog: 50 }, // saldo insuficiente
        { id: 999, prog: 1 }, // não pertence à obra
      ]);

      expect(result).toMatchObject({ type: 'insufficient_balance' });
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // planReschedule
  // ════════════════════════════════════════════════════════════════════
  describe('planReschedule', () => {
    const row = (
      o: Partial<ScheduleExecutionRow> = {},
    ): ScheduleExecutionRow => ({
      id: 1,
      id_servico: 100,
      prog: 10,
      real: null,
      status: statusFromReal(o.real),
      ...o,
    });

    it('should classify not reported, partial, done, discarded and rescheduled rows', () => {
      const plan = planReschedule([
        row({ id: 1, id_servico: 100, real: null }), // sem apontamento → marcar
        row({ id: 2, id_servico: 101, real: 4 }), // parcial EXECUTADO → marcar
        row({ id: 3, id_servico: 102, real: 10 }), // executado
        row({ id: 4, id_servico: 103, real: 12 }), // executado acima do programado
        row({ id: 5, id_servico: 104, real: 0 }), // descartado
        row({ id: 6, id_servico: 105, status: REPROGRAMADO }), // já reprogramado no apontamento
      ]);

      expect(plan).toEqual({
        releasedRowIds: [1, 2],
        affectedServiceIds: [100, 101, 105],
        hasPendingItems: true,
        hasExecution: true,
      });
    });

    it('should no longer expose emptiesSchedule', () => {
      expect(planReschedule([row()])).not.toHaveProperty('emptiesSchedule');
    });

    it('should release every row when none was reported', () => {
      const plan = planReschedule([
        row({ id: 1 }),
        row({ id: 2, id_servico: 101 }),
      ]);

      expect(plan).toEqual({
        releasedRowIds: [1, 2],
        affectedServiceIds: [100, 101],
        hasPendingItems: true,
        hasExecution: false,
      });
    });

    it('should release partial EXECUTADO rows', () => {
      expect(planReschedule([row({ real: 5 })])).toEqual({
        releasedRowIds: [1],
        affectedServiceIds: [100],
        hasPendingItems: true,
        hasExecution: true,
      });
    });

    it('should not treat a row within the tolerance as partial', () => {
      const plan = planReschedule([row({ real: 10 - EPS / 2 })]);

      expect(plan.releasedRowIds).toEqual([]);
      expect(plan.hasPendingItems).toBe(false);
    });

    it('should have nothing pending when every row is done', () => {
      expect(planReschedule([row({ real: 10 })])).toEqual({
        releasedRowIds: [],
        affectedServiceIds: [],
        hasPendingItems: false,
        hasExecution: true,
      });
    });

    it('should count rows already REPROGRAMADO (reported as null) as pending, without releasing them again', () => {
      expect(planReschedule([row({ status: REPROGRAMADO })])).toEqual({
        releasedRowIds: [],
        affectedServiceIds: [100],
        hasPendingItems: true,
        hasExecution: false,
      });
    });

    it('should keep the execution of an already REPROGRAMADO partial row', () => {
      expect(planReschedule([row({ real: 4, status: REPROGRAMADO })])).toEqual({
        releasedRowIds: [],
        affectedServiceIds: [100],
        hasPendingItems: true,
        hasExecution: true,
      });
    });

    it('should not reschedule discarded rows nor count them as execution', () => {
      expect(planReschedule([row({ real: 0 })])).toEqual({
        releasedRowIds: [],
        affectedServiceIds: [],
        hasPendingItems: false,
        hasExecution: false,
      });
    });

    it('should not treat a row as partial when prog is null', () => {
      const plan = planReschedule([row({ prog: null, real: 5 })]);

      expect(plan.affectedServiceIds).toEqual([]);
      expect(plan.hasPendingItems).toBe(false);
      expect(plan.hasExecution).toBe(true);
    });

    it('should list affected services without duplicates', () => {
      const plan = planReschedule([
        row({ id: 1, id_servico: 100, real: 3 }), // parcial
        row({ id: 2, id_servico: 100, real: null }), // sem apontamento (outra equipa)
      ]);

      expect(plan.releasedRowIds).toEqual([1, 2]);
      expect(plan.affectedServiceIds).toEqual([100]);
    });

    it('should return an empty plan for no rows', () => {
      expect(planReschedule([])).toEqual({
        releasedRowIds: [],
        affectedServiceIds: [],
        hasPendingItems: false,
        hasExecution: false,
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // resolveScheduleOutcome
  // ════════════════════════════════════════════════════════════════════
  describe('resolveScheduleOutcome', () => {
    const plan = (o: Partial<ReschedulePlan> = {}): ReschedulePlan => ({
      releasedRowIds: [],
      affectedServiceIds: [],
      hasPendingItems: false,
      hasExecution: false,
      ...o,
    });

    it.each([
      ['no execution, pending items', false, true, ScheduleStatus.REAGENDADA],
      ['execution and pending items', true, true, ScheduleStatus.PARCIAL],
      ['everything executed', true, false, ScheduleStatus.EXECUTADA],
      [
        'nothing pending and no execution (all discarded)',
        false,
        false,
        ScheduleStatus.EXECUTADA,
      ],
    ])('%s', (_, hasExecution, hasPendingItems, expected) => {
      expect(
        resolveScheduleOutcome(plan({ hasExecution, hasPendingItems })),
      ).toBe(expected);
    });

    it('should resolve EXECUTADA when every row of the schedule was discarded', () => {
      const outcome = resolveScheduleOutcome(
        planReschedule([
          { id: 1, id_servico: 100, prog: 10, real: 0, status: NAO_EXECUTADO },
        ]),
      );

      expect(outcome).toBe(ScheduleStatus.EXECUTADA);
    });

    it('should resolve PARCIAL from real rows (partial + done)', () => {
      const outcome = resolveScheduleOutcome(
        planReschedule([
          { id: 1, id_servico: 100, prog: 10, real: 4, status: EXECUTADO },
          { id: 2, id_servico: 101, prog: 10, real: 10, status: EXECUTADO },
        ]),
      );

      expect(outcome).toBe(ScheduleStatus.PARCIAL);
    });

    it('should resolve REAGENDADA when every row was reported as null', () => {
      const outcome = resolveScheduleOutcome(
        planReschedule([
          {
            id: 1,
            id_servico: 100,
            prog: 10,
            real: null,
            status: REPROGRAMADO,
          },
        ]),
      );

      expect(outcome).toBe(ScheduleStatus.REAGENDADA);
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // fromHistoryRow
  // ════════════════════════════════════════════════════════════════════
  describe('fromHistoryRow', () => {
    const base: HistoryRow = {
      id_programacao: 3,
      id_servico: 100,
      prog: 10,
      real: 4,
      status: EXECUTADO,
    };

    it('should map the fields to a ScheduleItem', () => {
      expect(
        fromHistoryRow({ ...base, servicos: { id_material: null } }),
      ).toEqual({
        scheduleId: 3,
        serviceId: 100,
        prog: 10,
        real: 4,
        isMaterial: false,
        status: EXECUTADO,
      });
    });

    it.each([[null], [REPROGRAMADO], [NAO_EXECUTADO]])(
      'should carry the status %p through',
      (status) => {
        expect(
          fromHistoryRow({ ...base, status, servicos: { id_material: null } })
            .status,
        ).toBe(status);
      },
    );

    it.each([
      ['id_material = 7', { id_material: 7 }, true],
      ['id_material = 0', { id_material: 0 }, true],
      ['id_material = null', { id_material: null }, false],
      ['materiais = object', { materiais: { id: 1 } }, true],
      ['materiais = null', { materiais: null }, false],
      [
        'id_material wins over materiais',
        { id_material: null, materiais: { id: 1 } },
        false,
      ],
    ])('should derive isMaterial when %s', (_, servicos, expected) => {
      expect(fromHistoryRow({ ...base, servicos }).isMaterial).toBe(expected);
    });

    it.each([
      ['servicos is undefined', undefined],
      ['servicos is null', null],
      ['servicos is empty', {}],
    ])(
      'should treat the row as material when %s (current behaviour)',
      (_, servicos) => {
        expect(fromHistoryRow({ ...base, servicos }).isMaterial).toBe(true);
      },
    );
  });
});
