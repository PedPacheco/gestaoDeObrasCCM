import { PROGRESS_EPSILON } from 'src/utils/pointByPoint/progress.utils'; // ajuste ao ficheiro real
import {
  DEMOTED_WORK_STATUS,
  HistoryRow,
  ScheduleExecutionRow,
  ScheduleItem,
  SchedulingService,
  WorkItem,
  calculateAggregateProgress,
  calculateAllSchedulesProgress,
  calculateScheduleProgress,
  calculateServiceTotals,
  calculateWorkProgress,
  findSchedulingViolation,
  fromHistoryRow,
  hasLockedExecution,
  isDiscarded,
  planReschedule,
  statusAfterScheduling,
} from 'src/domain/services/pointByPointRules.service';
import {
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';

const EPS = PROGRESS_EPSILON;

// ─── Fábricas de fixtures ────────────────────────────────────────────
const sItem = (o: Partial<ScheduleItem> = {}): ScheduleItem => ({
  scheduleId: 1,
  serviceId: 100,
  prog: 10,
  real: null,
  isMaterial: false,
  ...o,
});

const wItem = (o: Partial<WorkItem> = {}): WorkItem => ({
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
  // isDiscarded
  // ════════════════════════════════════════════════════════════════════
  describe('isDiscarded', () => {
    it.each([
      [0, true],
      [null, false],
      [5, false],
      [0.5, false],
    ])('real = %p → %p', (real, expected) => {
      expect(isDiscarded({ real })).toBe(expected);
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

    it('should sum prog as planned and keep real null when nothing was executed', () => {
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

    it('should count a discarded item (real = 0) as 0 planned and 0 real (not null)', () => {
      const result = calculateServiceTotals(
        [100],
        [sItem({ prog: 10, real: 0 })],
      );

      expect(result).toEqual([
        { serviceId: 100, plannedQuantity: 0, realQuantity: 0 },
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

    it('should compute prog % and exec = null for schedules without execution', () => {
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

    it('should ignore discarded items (real = 0) in prog and in hasExecution', () => {
      const [result] = calculateAllSchedulesProgress(
        [sItem({ prog: 20 }), sItem({ serviceId: 101, prog: 50, real: 0 })],
        TOTAL,
      );

      expect(result.prog).toBeCloseTo(10);
      expect(result.exec).toBeNull();
    });

    it('should omit schedules that only have materials or discarded items (current behaviour)', () => {
      const result = calculateAllSchedulesProgress(
        [
          sItem({ scheduleId: 1, prog: 20 }),
          sItem({ scheduleId: 2, isMaterial: true }),
          sItem({ scheduleId: 3, real: 0 }),
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
  // calculateAggregateProgress
  // ════════════════════════════════════════════════════════════════════
  describe('calculateAggregateProgress', () => {
    const TOTAL = 200;

    it('should sum the other schedules, excluding the given one', () => {
      const result = calculateAggregateProgress(
        [
          sItem({ scheduleId: 1, prog: 100, real: 100 }), // excluída
          sItem({ scheduleId: 2, prog: 20, real: 10 }),
          sItem({ scheduleId: 3, prog: 40, real: null }),
        ],
        TOTAL,
        1,
      );

      expect(result.prog).toBeCloseTo(30);
      expect(result.exec).toBeCloseTo(5);
    });

    it('should ignore materials and discarded items', () => {
      const result = calculateAggregateProgress(
        [
          sItem({ scheduleId: 2, prog: 20, real: 20 }),
          sItem({
            scheduleId: 2,
            serviceId: 101,
            prog: 50,
            real: 50,
            isMaterial: true,
          }),
          sItem({ scheduleId: 3, prog: 60, real: 0 }),
        ],
        TOTAL,
        1,
      );

      expect(result.prog).toBeCloseTo(10);
      expect(result.exec).toBeCloseTo(10);
    });

    it('should cap prog and exec at 100', () => {
      const result = calculateAggregateProgress(
        [sItem({ scheduleId: 2, prog: 300, real: 250 })],
        TOTAL,
        1,
      );

      expect(result).toEqual({ prog: 100, exec: 100 });
    });

    it('should return zeros when there are no other schedules', () => {
      const result = calculateAggregateProgress(
        [sItem({ scheduleId: 1, prog: 20 })],
        TOTAL,
        1,
      );

      expect(result.prog).toBeCloseTo(0);
      expect(result.exec).toBeCloseTo(0);
    });

    it('should return an object with exec and prog (shape used as totals by the validator)', () => {
      expect(calculateAggregateProgress([], TOTAL, 1)).toEqual({
        exec: expect.any(Number),
        prog: expect.any(Number),
      });
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
    it('should be false for an open schedule without execution', () => {
      expect(
        hasLockedExecution(ScheduleStatus.CONFIRMADA, [
          { real: null },
          { real: null },
        ]),
      ).toBe(false);
    });

    it('should be false for a null status and no items', () => {
      expect(hasLockedExecution(null, [])).toBe(false);
    });

    it.each([[5], [0]])(
      'should be true when any item has real = %p (0 = discarded)',
      (real) => {
        expect(
          hasLockedExecution(ScheduleStatus.CONFIRMADA, [
            { real: null },
            { real },
          ]),
        ).toBe(true);
      },
    );

    it.each([[ScheduleStatus.EXECUTADA], [ScheduleStatus.PARCIAL]])(
      'should be true for status %p even without items',
      (status) => {
        expect(hasLockedExecution(status, [])).toBe(true);
      },
    );

    it('should be false for REAGENDADA without execution (current behaviour)', () => {
      expect(
        hasLockedExecution(ScheduleStatus.REAGENDADA, [{ real: null }]),
      ).toBe(false);
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

    const HISTORY = [{ id_servico: 100, prog: 4, real: 3 }];

    const run = (
      requests: { id: number; prog: number; additional?: number | null }[],
      services: SchedulingService[] = [service()],
      history: {
        id_servico: number;
        prog: number | null;
        real: number | null;
      }[] = HISTORY,
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
      ).toEqual({
        type: 'discarded',
        label: 'P1',
      });
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
        [{ id_servico: 100, prog: null, real: 15 }],
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
      ).toMatchObject({
        type: 'insufficient_balance',
        requested: 10,
      });
    });

    it('should use prog as consumption when real is null', () => {
      expect(
        run(
          [{ id: 100, prog: 9 }],
          [service()],
          [{ id_servico: 100, prog: 4, real: null }],
        ),
      ).toMatchObject({ type: 'insufficient_balance', available: 8 });
    });

    it('should treat real = 0 as zero consumption', () => {
      expect(
        run(
          [{ id: 100, prog: 12 }],
          [service()],
          [{ id_servico: 100, prog: 4, real: 0 }],
        ),
      ).toBeNull();
    });

    it('should ignore history of other services', () => {
      expect(
        run(
          [{ id: 100, prog: 12 }],
          [service()],
          [{ id_servico: 555, prog: 50, real: 50 }],
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
      ...o,
    });

    it('should classify pending, partial, done and discarded rows', () => {
      const plan = planReschedule([
        row({ id: 1, id_servico: 100, real: null }), // pendente
        row({ id: 2, id_servico: 101, real: 4 }), // parcial
        row({ id: 3, id_servico: 102, real: 10 }), // executado
        row({ id: 4, id_servico: 103, real: 12 }), // executado acima do programado
        row({ id: 5, id_servico: 104, real: 0 }), // descartado
      ]);

      expect(plan).toEqual({
        releasedRowIds: [1],
        affectedServiceIds: [100, 101],
        hasPendingItems: true,
        emptiesSchedule: false,
        hasExecution: true,
      });
    });

    it('should empty the schedule when every row is pending', () => {
      const plan = planReschedule([
        row({ id: 1 }),
        row({ id: 2, id_servico: 101 }),
      ]);

      expect(plan).toEqual({
        releasedRowIds: [1, 2],
        affectedServiceIds: [100, 101],
        hasPendingItems: true,
        emptiesSchedule: true,
        hasExecution: false,
      });
    });

    it('should have pending items with only partial rows, without releasing any', () => {
      const plan = planReschedule([row({ real: 5 })]);

      expect(plan).toMatchObject({
        releasedRowIds: [],
        affectedServiceIds: [100],
        hasPendingItems: true,
        emptiesSchedule: false,
        hasExecution: true,
      });
    });

    it('should have nothing pending when every row is done', () => {
      const plan = planReschedule([row({ real: 10 })]);

      expect(plan).toMatchObject({
        hasPendingItems: false,
        releasedRowIds: [],
        affectedServiceIds: [],
      });
    });

    it('should keep discarded rows and not count them as execution', () => {
      const plan = planReschedule([row({ real: 0 })]);

      expect(plan).toEqual({
        releasedRowIds: [],
        affectedServiceIds: [],
        hasPendingItems: false,
        emptiesSchedule: false,
        hasExecution: false,
      });
    });

    it('should not treat a row as partial when prog is null', () => {
      const plan = planReschedule([row({ prog: null, real: 5 })]);

      expect(plan.affectedServiceIds).toEqual([]);
      expect(plan.hasPendingItems).toBe(false);
      expect(plan.hasExecution).toBe(true);
    });

    it('should list pending services before partial ones and keep duplicates (current behaviour)', () => {
      const plan = planReschedule([
        row({ id: 1, id_servico: 100, real: 3 }), // parcial
        row({ id: 2, id_servico: 100, real: null }), // pendente (outra equipa)
      ]);

      expect(plan.affectedServiceIds).toEqual([100, 100]);
    });

    it('should report emptiesSchedule = true for no rows (current behaviour)', () => {
      expect(planReschedule([])).toEqual({
        releasedRowIds: [],
        affectedServiceIds: [],
        hasPendingItems: false,
        emptiesSchedule: true,
        hasExecution: false,
      });
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
      });
    });

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
