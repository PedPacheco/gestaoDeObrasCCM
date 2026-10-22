import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ExecutionReportService } from 'src/application/usecases/executionReport.service';
import { FinalizeServicesService } from 'src/application/usecases/services/finalizeServices.service';
import { ProgressRecalculationService } from 'src/application/usecases/services/progressRecalculation.service';
import { ScheduleExecutionValidatorService } from 'src/application/usecases/works/schedule/scheduleExecutionValidator.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { WORK_SERVICES_EXECUTION_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesExecutionRepository';
import { WORK_SERVICES_QUERY_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import {
  calculateScheduleProgress,
  calculateTotalPlanned,
  calculateWorkExecutionTotals,
  fromHistoryRow,
  planReschedule,
  ServiceExecutionStatus,
} from 'src/domain/services/pointByPointRules.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  FINALIZED_SCHEDULE_STATUSES,
  isMaterial,
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';

// resolveScheduleOutcome fica REAL: é pura e traduz o plano no estado gravado.
jest.mock('src/domain/services/pointByPointRules.service', () => ({
  ...jest.requireActual('src/domain/services/pointByPointRules.service'),
  planReschedule: jest.fn(),
  calculateScheduleProgress: jest.fn(),
  calculateTotalPlanned: jest.fn(),
  calculateWorkExecutionTotals: jest.fn(),
  fromHistoryRow: jest.fn(),
}));

jest.mock('src/utils/pointByPoint/serviceType.utils', () => ({
  ...jest.requireActual('src/utils/pointByPoint/serviceType.utils'),
  isMaterial: jest.fn(),
}));

const mockPlanReschedule = planReschedule as jest.Mock;
const mockCalculateScheduleProgress = calculateScheduleProgress as jest.Mock;
const mockCalculateTotalPlanned = calculateTotalPlanned as jest.Mock;
const mockCalculateWorkExecutionTotals =
  calculateWorkExecutionTotals as jest.Mock;
const mockFromHistoryRow = fromHistoryRow as jest.Mock;
const mockIsMaterial = isMaterial as jest.Mock;

// ─── Constantes e helpers ────────────────────────────────────────────
const FINALIZE_TX_OPTIONS = { maxWait: 10000, timeout: 30000 };
const EXECUTION_BATCH_SIZE = 50;

const OPEN_STATUS = ScheduleStatus.CONFIRMADA; // status NÃO finalizado
const FINALIZED_STATUS = FINALIZED_SCHEDULE_STATUSES[0];

const MSG = {
  INVALID_REAL:
    'A quantidade realizada deve ser vazia (para reprogramar) ou um número maior ou igual a zero.',
  NOT_SCHEDULED: (id: number, schedule: number) =>
    `O item ${id} não está programado na programação ${schedule}.`,
  CONCURRENT_CHANGE:
    'Alguns itens foram alterados entretanto. Atualize a programação e tente novamente.',
};

const order = (fn: jest.Mock) => fn.mock.invocationCallOrder[0];

/** Confirma que a promise rejeita com a classe e a mensagem esperadas */
const expectError = async (
  promise: Promise<unknown>,
  ErrorClass: new (...args: any[]) => Error,
  message?: string,
) => {
  const error = await promise.then(
    () => {
      throw new Error('Expected promise to reject');
    },
    (e) => e,
  );
  expect(error).toBeInstanceOf(ErrorClass);
  if (message) expect(error.message).toBe(message);
};

/** Plano de reagendamento por omissão: 1 linha a marcar, sem execução. */
const buildPlan = (overrides: Record<string, unknown> = {}) => ({
  releasedRowIds: [2],
  affectedServiceIds: [100, 101],
  hasPendingItems: true,
  hasExecution: false,
  ...overrides,
});

describe('FinalizeServicesService', () => {
  let service: FinalizeServicesService;

  const mockTx = { __tx: true } as unknown as Prisma.TransactionClient;

  const mockPrisma = {
    $transaction: jest.fn((cb: (tx: Prisma.TransactionClient) => unknown) =>
      cb(mockTx),
    ),
  };

  const mockProgress = {
    recomputeAll: jest.fn(),
    recomputeServiceTotals: jest.fn(),
    recomputeWorkProgress: jest.fn(),
  };

  const mockExecutionRepository = {
    finalizeServices: jest.fn(),
    findScheduleItems: jest.fn(),
    markScheduleItemsAsRescheduled: jest.fn(),
    findExecutionTargets: jest.fn(),
    updateItemsExecution: jest.fn(),
  };

  const mockQueryRepository = {
    getAllServicesOfWork: jest.fn(),
    getServiceScheduleHistory: jest.fn(),
  };

  const mockStatusFlowRepository = {
    updateScheduleStatus: jest.fn(),
    updateStatusWorks: jest.fn(),
  };

  const mockFindScheduleByIdRepository = { findById: jest.fn() };
  const mockExecutionReportService = { create: jest.fn() };
  const mockExecutionValidator = { validatePointByPointExecution: jest.fn() };

  let loggerErrorSpy: jest.SpyInstance;

  /** Por omissão: cada item tem exatamente 1 linha numa programação aberta */
  const targetFor = (
    id: number,
    scheduleStatus = OPEN_STATUS,
    status: string | null = null,
  ) => [
    {
      id: id * 10,
      status,
      programacoes: { id_status_programacao: scheduleStatus },
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinalizeServicesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProgressRecalculationService, useValue: mockProgress },
        {
          provide: WORK_SERVICES_EXECUTION_REPOSITORY,
          useValue: mockExecutionRepository,
        },
        {
          provide: WORK_SERVICES_QUERY_REPOSITORY,
          useValue: mockQueryRepository,
        },
        { provide: STATUS_FLOW_REPOSITORY, useValue: mockStatusFlowRepository },
        {
          provide: FIND_SCHEDULE_BY_ID_REPOSITORY,
          useValue: mockFindScheduleByIdRepository,
        },
        {
          provide: ExecutionReportService,
          useValue: mockExecutionReportService,
        },
        {
          provide: ScheduleExecutionValidatorService,
          useValue: mockExecutionValidator,
        },
      ],
    }).compile();

    service = module.get(FinalizeServicesService);

    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();

    mockExecutionRepository.findExecutionTargets.mockImplementation(
      async (id: number) => targetFor(id),
    );
    // devolve o n.º de linhas atualizadas (o serviço compara com releasedRowIds)
    mockExecutionRepository.markScheduleItemsAsRescheduled.mockImplementation(
      async (ids: number[]) => ids.length,
    );
    mockIsMaterial.mockImplementation(
      (s: { id_material: number | null }) => s.id_material !== null,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerErrorSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sanity: OPEN_STATUS must not be a finalized status', () => {
    expect(FINALIZED_SCHEDULE_STATUSES).not.toContain(OPEN_STATUS);
  });

  // ════════════════════════════════════════════════════════════════════
  // performServices
  // ════════════════════════════════════════════════════════════════════
  describe('performServices', () => {
    const item = (
      id: number,
      idSchedule = 3,
      qtdeRealizada: number | null = 5,
    ) => ({ id, idSchedule, qtdeRealizada });

    it('should do nothing when data is empty', async () => {
      await service.performServices([]);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    // ─── validatePerformPayload ──────────────────────────────────────
    describe('payload validation', () => {
      it.each([
        [
          'a non-array payload',
          { length: 1 },
          'Lista de serviços realizados inválida.',
        ],
        [
          'id is missing',
          [{ idSchedule: 3, qtdeRealizada: 1 }],
          'Serviço e programação devem ser informados.',
        ],
        [
          'id is a string',
          [{ id: '1', idSchedule: 3, qtdeRealizada: 1 }],
          'Serviço e programação devem ser informados.',
        ],
        [
          'idSchedule is Infinity',
          [{ id: 1, idSchedule: Infinity, qtdeRealizada: 1 }],
          'Serviço e programação devem ser informados.',
        ],
        ['item is null', [null], 'Serviço e programação devem ser informados.'],
        [
          'qtdeRealizada = -1',
          [{ id: 1, idSchedule: 3, qtdeRealizada: -1 }],
          MSG.INVALID_REAL,
        ],
        [
          'qtdeRealizada = NaN',
          [{ id: 1, idSchedule: 3, qtdeRealizada: NaN }],
          MSG.INVALID_REAL,
        ],
        [
          'qtdeRealizada = Infinity',
          [{ id: 1, idSchedule: 3, qtdeRealizada: Infinity }],
          MSG.INVALID_REAL,
        ],
        [
          'qtdeRealizada = undefined',
          [{ id: 1, idSchedule: 3 }],
          MSG.INVALID_REAL,
        ],
        [
          'qtdeRealizada = "5"',
          [{ id: 1, idSchedule: 3, qtdeRealizada: '5' }],
          MSG.INVALID_REAL,
        ],
        [
          'the same item is sent twice for the same schedule',
          [
            { id: 1, idSchedule: 3, qtdeRealizada: 1 },
            { id: 1, idSchedule: 3, qtdeRealizada: 2 },
          ],
          'O item 1 foi enviado mais de uma vez na programação 3.',
        ],
      ])(
        'should reject when %s, before opening a transaction',
        async (_, payload, message) => {
          await expectError(
            service.performServices(payload as any),
            BadRequestException,
            message,
          );
          expect(mockPrisma.$transaction).not.toHaveBeenCalled();
        },
      );

      it.each([
        ['0 → NAO_EXECUTADO (discarded)', 0],
        ['null → REPROGRAMADO (to be rescheduled)', null],
      ])('should accept qtdeRealizada = %s', async (_, qtdeRealizada) => {
        await service.performServices([item(1, 3, qtdeRealizada)]);

        expect(
          mockExecutionRepository.updateItemsExecution,
        ).toHaveBeenCalledWith(
          [{ rowId: 10, serviceId: 1, real: qtdeRealizada }],
          mockTx,
        );
      });

      it('should accept the same item in different schedules', async () => {
        await service.performServices([item(1, 3), item(1, 4)]);

        expect(
          mockExecutionRepository.findExecutionTargets,
        ).toHaveBeenCalledWith(1, 3, mockTx);
        expect(
          mockExecutionRepository.findExecutionTargets,
        ).toHaveBeenCalledWith(1, 4, mockTx);
      });
    });

    // ─── registerExecutions ──────────────────────────────────────────
    describe('execution registration', () => {
      it('should resolve rows, write real and recompute service totals in a transaction', async () => {
        await service.performServices([item(1, 3, 5), item(2, 3, 7.5)]);

        expect(mockPrisma.$transaction).toHaveBeenCalledWith(
          expect.any(Function),
          FINALIZE_TX_OPTIONS,
        );
        expect(
          mockExecutionRepository.updateItemsExecution,
        ).toHaveBeenCalledWith(
          [
            { rowId: 10, serviceId: 1, real: 5 },
            { rowId: 20, serviceId: 2, real: 7.5 },
          ],
          mockTx,
        );
        expect(mockProgress.recomputeServiceTotals).toHaveBeenCalledWith(
          [1, 2],
          mockTx,
        );
        expect(
          order(mockExecutionRepository.updateItemsExecution),
        ).toBeLessThan(order(mockProgress.recomputeServiceTotals));
      });

      it('should recompute each service only once per batch', async () => {
        await service.performServices([item(1, 3), item(1, 4), item(2, 3)]);

        expect(mockProgress.recomputeServiceTotals).toHaveBeenCalledWith(
          [1, 2],
          mockTx,
        );
      });

      it('should allow correcting a REPROGRAMADO row while the schedule is open', async () => {
        mockExecutionRepository.findExecutionTargets.mockResolvedValueOnce(
          targetFor(1, OPEN_STATUS, ServiceExecutionStatus.REPROGRAMADO),
        );

        await service.performServices([item(1, 3, 5)]);

        expect(
          mockExecutionRepository.updateItemsExecution,
        ).toHaveBeenCalledWith([{ rowId: 10, serviceId: 1, real: 5 }], mockTx);
      });

      it('should throw when the item is not scheduled in the schedule', async () => {
        mockExecutionRepository.findExecutionTargets.mockResolvedValueOnce([]);

        await expectError(
          service.performServices([item(1, 3)]),
          BadRequestException,
          MSG.NOT_SCHEDULED(1, 3),
        );
        expect(
          mockExecutionRepository.updateItemsExecution,
        ).not.toHaveBeenCalled();
      });

      it('should throw when the item is scheduled for more than one team', async () => {
        mockExecutionRepository.findExecutionTargets.mockResolvedValueOnce([
          ...targetFor(1),
          ...targetFor(2),
        ]);

        await expectError(
          service.performServices([item(1, 3)]),
          BadRequestException,
          'O item 1 está programado para mais de uma equipe na programação 3: informe a equipe (idTeam).',
        );
        expect(
          mockExecutionRepository.updateItemsExecution,
        ).not.toHaveBeenCalled();
      });

      it('should throw ConflictException when the schedule is already finalized', async () => {
        mockExecutionRepository.findExecutionTargets.mockResolvedValueOnce(
          targetFor(1, FINALIZED_STATUS),
        );

        await expectError(
          service.performServices([item(1, 3)]),
          ConflictException,
          'A programação 3 já foi finalizada. Desfaça a finalização para alterar o executado.',
        );
        expect(
          mockExecutionRepository.updateItemsExecution,
        ).not.toHaveBeenCalled();
      });

      it(`should process items in batches of ${EXECUTION_BATCH_SIZE}`, async () => {
        const data = Array.from({ length: 120 }, (_, i) => item(i + 1));

        await service.performServices(data);

        const batchSizes =
          mockExecutionRepository.updateItemsExecution.mock.calls.map(
            ([rows]) => rows.length,
          );
        expect(batchSizes).toEqual([50, 50, 20]);
        expect(mockProgress.recomputeServiceTotals).toHaveBeenCalledTimes(3);
        expect(mockProgress.recomputeServiceTotals.mock.calls[2][0]).toEqual(
          Array.from({ length: 20 }, (_, i) => 101 + i),
        );
      });

      it('should stop at the failing batch (the transaction rolls back the previous ones)', async () => {
        const data = Array.from({ length: 120 }, (_, i) => item(i + 1));
        mockExecutionRepository.findExecutionTargets.mockImplementation(
          async (id: number) => (id === 60 ? [] : targetFor(id)),
        );

        await expectError(
          service.performServices(data),
          BadRequestException,
          MSG.NOT_SCHEDULED(60, 3),
        );
        expect(
          mockExecutionRepository.updateItemsExecution,
        ).toHaveBeenCalledTimes(1);
        expect(mockProgress.recomputeServiceTotals).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // reascheduleServices
  // ════════════════════════════════════════════════════════════════════
  describe('reascheduleServices', () => {
    const WORK_ID = 10;
    const SCHEDULE_ID = 3;
    const ROWS = [
      { id: 1, id_servico: 100, prog: 10, real: 5, status: 'EXECUTADO' },
      { id: 2, id_servico: 101, prog: 8, real: null, status: null },
    ];

    const run = () => service.reascheduleServices(WORK_ID, SCHEDULE_ID);

    beforeEach(() => {
      mockFindScheduleByIdRepository.findById.mockResolvedValue({
        id: SCHEDULE_ID,
        id_obra: WORK_ID,
        id_status_programacao: OPEN_STATUS,
      });
      mockExecutionRepository.findScheduleItems.mockResolvedValue(ROWS);
      mockPlanReschedule.mockReturnValue(buildPlan());
    });

    // ─── Validações ──────────────────────────────────────────────────
    it('should throw NotFoundException when the schedule does not exist', async () => {
      mockFindScheduleByIdRepository.findById.mockResolvedValueOnce(null);

      await expectError(
        run(),
        NotFoundException,
        `Programação ${SCHEDULE_ID} não encontrada.`,
      );
      expect(mockExecutionRepository.findScheduleItems).not.toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should throw BadRequestException when the schedule belongs to another work', async () => {
      mockFindScheduleByIdRepository.findById.mockResolvedValueOnce({
        id: SCHEDULE_ID,
        id_obra: 999,
        id_status_programacao: OPEN_STATUS,
      });

      await expectError(
        run(),
        BadRequestException,
        'A programação informada não pertence a esta obra.',
      );
      expect(mockExecutionRepository.findScheduleItems).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the schedule is already closed', async () => {
      mockFindScheduleByIdRepository.findById.mockResolvedValueOnce({
        id: SCHEDULE_ID,
        id_obra: WORK_ID,
        id_status_programacao: FINALIZED_STATUS,
      });

      await expectError(
        run(),
        ConflictException,
        'Esta programação já foi encerrada.',
      );
      expect(mockExecutionRepository.findScheduleItems).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when there is nothing to reschedule', async () => {
      mockPlanReschedule.mockReturnValueOnce(
        buildPlan({ hasPendingItems: false }),
      );

      await expectError(
        run(),
        BadRequestException,
        'Não há itens pendentes para reagendar nesta programação.',
      );
      expect(
        mockExecutionRepository.markScheduleItemsAsRescheduled,
      ).not.toHaveBeenCalled();
      expect(mockProgress.recomputeAll).not.toHaveBeenCalled();
      expect(
        mockStatusFlowRepository.updateScheduleStatus,
      ).not.toHaveBeenCalled();
    });

    // ─── Fluxo ───────────────────────────────────────────────────────
    it('should mark rows, recompute and update statuses in order, inside one transaction', async () => {
      await run();

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        FINALIZE_TX_OPTIONS,
      );
      expect(mockFindScheduleByIdRepository.findById).toHaveBeenCalledWith(
        SCHEDULE_ID,
        mockTx,
      );
      expect(mockExecutionRepository.findScheduleItems).toHaveBeenCalledWith(
        SCHEDULE_ID,
        mockTx,
      );
      expect(mockPlanReschedule).toHaveBeenCalledWith(ROWS);
      expect(
        mockExecutionRepository.markScheduleItemsAsRescheduled,
      ).toHaveBeenCalledWith([2], mockTx);
      expect(mockProgress.recomputeAll).toHaveBeenCalledWith(
        [100, 101],
        WORK_ID,
        mockTx,
      );
      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        WorkStatus.SERVICOS_REAGENDADOS,
        WORK_ID,
        mockTx,
      );

      const steps = [
        order(mockExecutionRepository.markScheduleItemsAsRescheduled),
        order(mockProgress.recomputeAll),
        order(mockStatusFlowRepository.updateScheduleStatus),
        order(mockStatusFlowRepository.updateStatusWorks),
      ];
      expect(steps).toEqual([...steps].sort((a, b) => a - b));
    });

    it('should not mark rows when the plan releases none (rows already REPROGRAMADO)', async () => {
      mockPlanReschedule.mockReturnValueOnce(buildPlan({ releasedRowIds: [] }));

      await run();

      expect(
        mockExecutionRepository.markScheduleItemsAsRescheduled,
      ).not.toHaveBeenCalled();
      expect(mockProgress.recomputeAll).toHaveBeenCalled();
    });

    it.each([
      ['REAGENDADA without execution', false, ScheduleStatus.REAGENDADA],
      ['PARCIAL with execution', true, ScheduleStatus.PARCIAL],
    ])('should set the schedule to %s', async (_, hasExecution, expected) => {
      mockPlanReschedule.mockReturnValueOnce(buildPlan({ hasExecution }));

      await run();

      expect(
        mockStatusFlowRepository.updateScheduleStatus,
      ).toHaveBeenCalledWith(expected, SCHEDULE_ID, mockTx);
    });

    // ─── Erros ───────────────────────────────────────────────────────
    it('should throw ConflictException when fewer rows were marked than planned', async () => {
      mockExecutionRepository.markScheduleItemsAsRescheduled.mockResolvedValueOnce(
        0,
      );

      await expectError(run(), ConflictException, MSG.CONCURRENT_CHANGE);
      expect(mockProgress.recomputeAll).not.toHaveBeenCalled();
      expect(
        mockStatusFlowRepository.updateScheduleStatus,
      ).not.toHaveBeenCalled();
    });

    it('should log and rethrow errors, without updating statuses', async () => {
      const error = new Error('recompute failed');
      mockProgress.recomputeAll.mockRejectedValueOnce(error);

      await expect(run()).rejects.toBe(error);
      expect(loggerErrorSpy).toHaveBeenCalledWith(error);
      expect(
        mockStatusFlowRepository.updateScheduleStatus,
      ).not.toHaveBeenCalled();
      expect(mockStatusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // finalizeServices
  // ════════════════════════════════════════════════════════════════════
  describe('finalizeServices', () => {
    const WORK_ID = 10;
    const SCHEDULE_ID = 3;
    const DATA_PROG = new Date('2026-10-01T00:00:00.000Z');
    const FILES = [{ originalname: 'asbuild.pdf' }] as Express.Multer.File[];

    const ROWS = [
      { id: 1, id_servico: 100, prog: 10, real: 10, status: 'EXECUTADO' },
      { id: 2, id_servico: 101, prog: 8, real: 3, status: 'EXECUTADO' },
    ];

    const SERVICES = [
      {
        id: 1,
        id_material: null,
        viabilizado: 10,
        qtde_adicional: 2,
        qtde_real: 5,
      },
      {
        id: 2,
        id_material: null,
        viabilizado: null,
        qtde_adicional: undefined,
        qtde_real: null,
      },
      {
        id: 3,
        id_material: 9,
        viabilizado: 50,
        qtde_adicional: 0,
        qtde_real: 2,
      },
    ];

    const HISTORY = [
      { id_programacao: SCHEDULE_ID, programacoes: { data_prog: DATA_PROG } },
      {
        id_programacao: 4,
        programacoes: { data_prog: new Date('2026-09-01T00:00:00.000Z') },
      },
    ];
    const SCHEDULE_ITEMS = [{ scheduleId: SCHEDULE_ID }, { scheduleId: 4 }];

    const TOTAL_PLANNED = 23;
    const SCHEDULE_TOTALS = { prog: 40, exec: 25 };
    const WORK_TOTALS = { executed: 60, coverage: 90 };
    const REPORT_DATA = { observacao: 'Execução concluída', km: 1.2 };

    const buildPayload = (overrides: Record<string, unknown> = {}) => ({
      idSchedule: SCHEDULE_ID,
      idExecutionRestriction: 7,
      responsibility: 'João Silva',
      executionObservation: 'Executado conforme programado',
      userId: 15,
      executionReportData: REPORT_DATA,
      executions: [],
      ...overrides,
    });

    const run = (
      overrides: Record<string, unknown> = {},
      files?: Express.Multer.File[],
    ) => service.finalizeServices(WORK_ID, buildPayload(overrides), files);

    const EXPECTED_FINALIZATION = {
      id: SCHEDULE_ID,
      idWork: WORK_ID,
      dataProg: DATA_PROG,
      prog: SCHEDULE_TOTALS.prog,
      exec: SCHEDULE_TOTALS.exec,
      idExecutionRestriction: 7,
      responsibility: 'João Silva',
      executionObservation: 'Executado conforme programado',
      userId: 15,
    };

    beforeEach(() => {
      mockFindScheduleByIdRepository.findById.mockResolvedValue({
        id: SCHEDULE_ID,
        id_obra: WORK_ID,
        id_status_programacao: OPEN_STATUS,
      });
      mockExecutionRepository.findScheduleItems.mockResolvedValue(ROWS);
      // 1 linha parcial a marcar, com execução → PARCIAL
      mockPlanReschedule.mockReturnValue(
        buildPlan({ affectedServiceIds: [101], hasExecution: true }),
      );
      mockQueryRepository.getAllServicesOfWork.mockResolvedValue(SERVICES);
      mockQueryRepository.getServiceScheduleHistory.mockResolvedValue(HISTORY);
      mockFromHistoryRow.mockImplementation((row) => ({
        scheduleId: row.id_programacao,
      }));
      mockCalculateTotalPlanned.mockReturnValue(TOTAL_PLANNED);
      mockCalculateScheduleProgress.mockReturnValue(SCHEDULE_TOTALS);
      mockCalculateWorkExecutionTotals.mockReturnValue(WORK_TOTALS);
      mockExecutionRepository.finalizeServices.mockResolvedValue(true);
    });

    // ─── Execuções embutidas ─────────────────────────────────────────
    it('should register executions before validating the schedule', async () => {
      await run({
        executions: [{ id: 1, idSchedule: SCHEDULE_ID, qtdeRealizada: 5 }],
      });

      expect(mockExecutionRepository.updateItemsExecution).toHaveBeenCalledWith(
        [{ rowId: 10, serviceId: 1, real: 5 }],
        mockTx,
      );
      expect(order(mockExecutionRepository.updateItemsExecution)).toBeLessThan(
        order(mockFindScheduleByIdRepository.findById),
      );
    });

    it.each([[undefined], [[]]])(
      'should skip execution registration when executions = %p',
      async (executions) => {
        await run({ executions });

        expect(
          mockExecutionRepository.findExecutionTargets,
        ).not.toHaveBeenCalled();
        expect(
          mockExecutionRepository.updateItemsExecution,
        ).not.toHaveBeenCalled();
      },
    );

    it('should validate the embedded executions payload', async () => {
      await expectError(
        run({
          executions: [{ id: 1, idSchedule: SCHEDULE_ID, qtdeRealizada: -1 }],
        }),
        BadRequestException,
        MSG.INVALID_REAL,
      );
      expect(
        mockExecutionRepository.findExecutionTargets,
      ).not.toHaveBeenCalled();
      expect(mockExecutionRepository.finalizeServices).not.toHaveBeenCalled();
    });

    it('should abort finalization if an execution cannot be registered', async () => {
      mockExecutionRepository.findExecutionTargets.mockResolvedValueOnce([]);

      await expectError(
        run({
          executions: [{ id: 1, idSchedule: SCHEDULE_ID, qtdeRealizada: 5 }],
        }),
        BadRequestException,
        MSG.NOT_SCHEDULED(1, SCHEDULE_ID),
      );
      expect(mockFindScheduleByIdRepository.findById).not.toHaveBeenCalled();
      expect(mockExecutionRepository.finalizeServices).not.toHaveBeenCalled();
    });

    // ─── assertScheduleCanBeFinalized ────────────────────────────────
    it('should throw NotFoundException when the schedule does not exist', async () => {
      mockFindScheduleByIdRepository.findById.mockResolvedValueOnce(null);

      await expectError(
        run(),
        NotFoundException,
        `Programação ${SCHEDULE_ID} não encontrada.`,
      );
      expect(mockExecutionRepository.findScheduleItems).not.toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should throw ConflictException when the schedule is already finalized', async () => {
      mockFindScheduleByIdRepository.findById.mockResolvedValueOnce({
        id: SCHEDULE_ID,
        id_obra: WORK_ID,
        id_status_programacao: FINALIZED_STATUS,
      });

      await expectError(
        run(),
        ConflictException,
        'Programação já finalizada. Desfaça a finalização para finalizar novamente.',
      );
      expect(mockExecutionRepository.findScheduleItems).not.toHaveBeenCalled();
    });

    // ─── Encerramento das linhas ─────────────────────────────────────
    it('should mark pending/partial rows as REPROGRAMADO before reading the history', async () => {
      await run();

      expect(mockExecutionRepository.findScheduleItems).toHaveBeenCalledWith(
        SCHEDULE_ID,
        mockTx,
      );
      expect(mockPlanReschedule).toHaveBeenCalledWith(ROWS);
      expect(
        mockExecutionRepository.markScheduleItemsAsRescheduled,
      ).toHaveBeenCalledWith([2], mockTx);
      expect(
        order(mockExecutionRepository.markScheduleItemsAsRescheduled),
      ).toBeLessThan(order(mockQueryRepository.getServiceScheduleHistory));
    });

    it('should abort with ConflictException when rows changed concurrently', async () => {
      mockExecutionRepository.markScheduleItemsAsRescheduled.mockResolvedValueOnce(
        0,
      );

      await expectError(run(), ConflictException, MSG.CONCURRENT_CHANGE);
      expect(
        mockQueryRepository.getServiceScheduleHistory,
      ).not.toHaveBeenCalled();
      expect(mockExecutionRepository.finalizeServices).not.toHaveBeenCalled();
    });

    // ─── Leituras e cálculos ─────────────────────────────────────────
    it('should compute totalPlanned in the domain from the mapped work items', async () => {
      await run();

      expect(mockQueryRepository.getAllServicesOfWork).toHaveBeenCalledWith(
        WORK_ID,
        mockTx,
      );
      expect(
        mockQueryRepository.getServiceScheduleHistory,
      ).toHaveBeenCalledWith(WORK_ID, mockTx);
      expect(mockCalculateTotalPlanned).toHaveBeenCalledWith(
        [
          {
            serviceId: 1,
            isMaterial: false,
            enabledQuantity: 10,
            additionalQuantity: 2,
            realQuantity: 5,
          },
          {
            serviceId: 2,
            isMaterial: false,
            enabledQuantity: null,
            additionalQuantity: null,
            realQuantity: null,
          },
          {
            serviceId: 3,
            isMaterial: true,
            enabledQuantity: 50,
            additionalQuantity: 0,
            realQuantity: 2,
          },
        ],
        SCHEDULE_ITEMS,
      );
    });

    it('should use the same totalPlanned for schedule and work totals', async () => {
      await run();

      expect(mockCalculateScheduleProgress).toHaveBeenCalledWith(
        SCHEDULE_ITEMS,
        TOTAL_PLANNED,
        SCHEDULE_ID,
      );
      expect(mockCalculateWorkExecutionTotals).toHaveBeenCalledWith(
        SCHEDULE_ITEMS,
        TOTAL_PLANNED,
      );
    });

    it('should throw NotFoundException when the history has no entry for the schedule', async () => {
      mockQueryRepository.getServiceScheduleHistory.mockResolvedValueOnce([
        HISTORY[1],
      ]);

      await expectError(
        run(),
        NotFoundException,
        `Nenhum histórico encontrado para a programação ${SCHEDULE_ID} nesta obra.`,
      );
      expect(mockExecutionReportService.create).not.toHaveBeenCalled();
      expect(mockExecutionRepository.finalizeServices).not.toHaveBeenCalled();
    });

    // ─── executeFinalization ─────────────────────────────────────────
    it('should run every finalization step in order, inside one transaction', async () => {
      await run({}, FILES);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        FINALIZE_TX_OPTIONS,
      );
      expect(mockExecutionReportService.create).toHaveBeenCalledWith(
        { idSchedule: SCHEDULE_ID, idWork: WORK_ID, ...REPORT_DATA },
        DATA_PROG,
        FILES,
        mockTx,
      );
      expect(
        mockExecutionValidator.validatePointByPointExecution,
      ).toHaveBeenCalledWith(
        EXPECTED_FINALIZATION,
        ScheduleStatus.PARCIAL,
        WORK_TOTALS,
        mockTx,
      );
      expect(mockExecutionRepository.finalizeServices).toHaveBeenCalledWith(
        EXPECTED_FINALIZATION, // igualdade exata: executions e executionReportData não entram
        mockTx,
      );
      expect(mockProgress.recomputeAll).toHaveBeenCalledWith(
        [101],
        WORK_ID,
        mockTx,
      );
      expect(mockProgress.recomputeWorkProgress).not.toHaveBeenCalled();

      const steps = [
        order(mockFindScheduleByIdRepository.findById),
        order(mockExecutionRepository.markScheduleItemsAsRescheduled),
        order(mockQueryRepository.getServiceScheduleHistory),
        order(mockExecutionReportService.create),
        order(mockExecutionValidator.validatePointByPointExecution),
        order(mockExecutionRepository.finalizeServices),
        order(mockProgress.recomputeAll),
      ];
      expect(steps).toEqual([...steps].sort((a, b) => a - b));
    });

    it.each([
      [
        'REAGENDADA',
        buildPlan({ hasExecution: false }),
        ScheduleStatus.REAGENDADA,
      ],
      ['PARCIAL', buildPlan({ hasExecution: true }), ScheduleStatus.PARCIAL],
      [
        'EXECUTADA',
        buildPlan({
          releasedRowIds: [],
          hasPendingItems: false,
          hasExecution: true,
        }),
        ScheduleStatus.EXECUTADA,
      ],
    ])(
      'should pass the %s outcome (from the rows) to the validator',
      async (_, plan, expected) => {
        mockPlanReschedule.mockReturnValueOnce(plan);

        await run();

        expect(
          mockExecutionValidator.validatePointByPointExecution,
        ).toHaveBeenCalledWith(
          expect.any(Object),
          expected,
          WORK_TOTALS,
          mockTx,
        );
      },
    );

    it.each([[undefined], [null], [{}]])(
      'should not create the report when executionReportData = %p',
      async (executionReportData) => {
        await run({ executionReportData });

        expect(mockExecutionReportService.create).not.toHaveBeenCalled();
        expect(mockExecutionRepository.finalizeServices).toHaveBeenCalled();
      },
    );

    // ─── Erros ───────────────────────────────────────────────────────
    it('should not continue when report creation fails', async () => {
      mockExecutionReportService.create.mockRejectedValueOnce(
        new Error('upload failed'),
      );

      await expect(run()).rejects.toThrow('upload failed');
      expect(
        mockExecutionValidator.validatePointByPointExecution,
      ).not.toHaveBeenCalled();
      expect(mockExecutionRepository.finalizeServices).not.toHaveBeenCalled();
    });

    it('should not finalize when the point-by-point validation fails', async () => {
      const error = new BadRequestException('Execução inválida');
      mockExecutionValidator.validatePointByPointExecution.mockRejectedValueOnce(
        error,
      );

      await expect(run()).rejects.toBe(error);
      expect(mockExecutionRepository.finalizeServices).not.toHaveBeenCalled();
      expect(mockProgress.recomputeAll).not.toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalledWith(error);
    });

    it('should throw NotFoundException when the repository does not update the schedule', async () => {
      mockExecutionRepository.finalizeServices.mockResolvedValueOnce(false);

      await expectError(
        run(),
        NotFoundException,
        `Agendamento com ID ${SCHEDULE_ID} não encontrado`,
      );
      expect(mockProgress.recomputeAll).not.toHaveBeenCalled();
    });

    it('should log and rethrow errors from the final recompute', async () => {
      const error = new Error('recompute failed');
      mockProgress.recomputeAll.mockRejectedValueOnce(error);

      await expect(run()).rejects.toBe(error);
      expect(loggerErrorSpy).toHaveBeenCalledWith(error);
    });
  });
});
