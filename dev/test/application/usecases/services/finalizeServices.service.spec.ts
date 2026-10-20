import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionReportService } from 'src/application/usecases/executionReport.service';
import { FinalizeServicesService } from 'src/application/usecases/services/finalizeServices.service';
import { ProgressRecalculationService } from 'src/application/usecases/services/progressRecalculation.service';
import { ScheduleExecutionValidatorService } from 'src/application/usecases/works/schedule/scheduleExecutionValidator.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { WORK_SERVICES_EXECUTION_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesExecutionRepository';
import { WORK_SERVICES_QUERY_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import {
  calculateAggregateProgress,
  calculateScheduleProgress,
  fromHistoryRow,
  planReschedule,
} from 'src/domain/services/pointByPointRules.service';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  FINALIZED_SCHEDULE_STATUSES,
  isMaterial,
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';

jest.mock('src/domain/services/pointByPointRules.service', () => ({
  ...jest.requireActual('src/domain/services/pointByPointRules.service'),
  planReschedule: jest.fn(),
  calculateScheduleProgress: jest.fn(),
  calculateAggregateProgress: jest.fn(),
  fromHistoryRow: jest.fn(),
}));

jest.mock('src/utils/pointByPoint/serviceType.utils', () => ({
  ...jest.requireActual('src/utils/pointByPoint/serviceType.utils'),
  isMaterial: jest.fn(),
}));

const mockPlanReschedule = planReschedule as jest.Mock;
const mockCalculateScheduleProgress = calculateScheduleProgress as jest.Mock;
const mockCalculateAggregateProgress = calculateAggregateProgress as jest.Mock;
const mockFromHistoryRow = fromHistoryRow as jest.Mock;
const mockIsMaterial = isMaterial as jest.Mock;

// ─── Constantes e helpers ────────────────────────────────────────────
const FINALIZE_TX_OPTIONS = { maxWait: 10000, timeout: 30000 };
const EXECUTION_BATCH_SIZE = 50;

const OPEN_STATUS = ScheduleStatus.CONFIRMADA; // status NÃO finalizado
const FINALIZED_STATUS = FINALIZED_SCHEDULE_STATUSES[0];

const order = (fn: jest.Mock) => fn.mock.invocationCallOrder[0];

/** Garante que a promise rejeita com a classe e a mensagem esperadas */
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
    findScheduleWork: jest.fn(),
    findScheduleItems: jest.fn(),
    deleteScheduleItemsByIds: jest.fn(),
    zeroScheduleProgress: jest.fn(),
    findExecutionTargets: jest.fn(),
    updateItemsReal: jest.fn(),
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
  const targetFor = (id: number, status = OPEN_STATUS) => [
    { id: id * 10, programacoes: { id_status_programacao: status } },
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
    const item = (id: number, idSchedule = 3, qtdeRealizada = 5) => ({
      id,
      idSchedule,
      qtdeRealizada,
    });

    it('should do nothing when data is empty', async () => {
      await service.performServices([]);

      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    // ─── validatePerformPayload ──────────────────────────────────────
    describe('payload validation', () => {
      it('should reject a non-array payload', async () => {
        await expectError(
          service.performServices({ length: 1 } as any),
          BadRequestException,
          'Lista de serviços realizados inválida.',
        );
        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      });

      it.each([
        ['id is missing', { idSchedule: 3, qtdeRealizada: 1 }],
        ['idSchedule is missing', { id: 1, qtdeRealizada: 1 }],
        ['id is a string', { id: '1', idSchedule: 3, qtdeRealizada: 1 }],
        ['id is NaN', { id: NaN, idSchedule: 3, qtdeRealizada: 1 }],
        [
          'idSchedule is Infinity',
          { id: 1, idSchedule: Infinity, qtdeRealizada: 1 },
        ],
        ['item is null', null],
      ])('should reject when %s', async (_, payload) => {
        await expectError(
          service.performServices([payload as any]),
          BadRequestException,
          'Serviço e programação devem ser informados.',
        );
        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      });

      it.each([[-1], [-0.01], [NaN], [Infinity], [undefined], ['5']])(
        'should reject qtdeRealizada = %p',
        async (qtdeRealizada) => {
          await expectError(
            service.performServices([
              { id: 1, idSchedule: 3, qtdeRealizada } as any,
            ]),
            BadRequestException,
            'A quantidade realizada deve ser um número maior ou igual a zero.',
          );
          expect(mockPrisma.$transaction).not.toHaveBeenCalled();
        },
      );

      it('should accept qtdeRealizada = 0 (discarded item)', async () => {
        await service.performServices([item(1, 3, 0)]);

        expect(mockExecutionRepository.updateItemsReal).toHaveBeenCalledWith(
          [{ rowId: 10, serviceId: 1, real: 0 }],
          mockTx,
        );
      });

      it('should reject the same item sent twice for the same schedule', async () => {
        await expectError(
          service.performServices([item(1, 3, 1), item(1, 3, 2)]),
          BadRequestException,
          'O item 1 foi enviado mais de uma vez na programação 3.',
        );
        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
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
      it('should run inside a transaction with FINALIZE_TX_OPTIONS', async () => {
        await service.performServices([item(1)]);

        expect(mockPrisma.$transaction).toHaveBeenCalledWith(
          expect.any(Function),
          FINALIZE_TX_OPTIONS,
        );
      });

      it('should resolve rows, update real and recompute service totals', async () => {
        await service.performServices([item(1, 3, 5), item(2, 3, 7.5)]);

        expect(
          mockExecutionRepository.findExecutionTargets,
        ).toHaveBeenCalledWith(1, 3, mockTx);
        expect(
          mockExecutionRepository.findExecutionTargets,
        ).toHaveBeenCalledWith(2, 3, mockTx);
        expect(mockExecutionRepository.updateItemsReal).toHaveBeenCalledWith(
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
        expect(order(mockExecutionRepository.updateItemsReal)).toBeLessThan(
          order(mockProgress.recomputeServiceTotals),
        );
      });

      it('should throw when the item is not scheduled in the schedule', async () => {
        mockExecutionRepository.findExecutionTargets.mockResolvedValueOnce([]);

        await expectError(
          service.performServices([item(1, 3)]),
          BadRequestException,
          'O item 1 não está programado na programação 3.',
        );
        expect(mockExecutionRepository.updateItemsReal).not.toHaveBeenCalled();
        expect(mockProgress.recomputeServiceTotals).not.toHaveBeenCalled();
      });

      it('should throw when the item is scheduled for more than one team', async () => {
        mockExecutionRepository.findExecutionTargets.mockResolvedValueOnce([
          ...targetFor(1),
          { id: 11, programacoes: { id_status_programacao: OPEN_STATUS } },
        ]);

        await expectError(
          service.performServices([item(1, 3)]),
          BadRequestException,
          'O item 1 está programado para mais de uma equipe na programação 3: informe a equipe (idTeam).',
        );
        expect(mockExecutionRepository.updateItemsReal).not.toHaveBeenCalled();
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
        expect(mockExecutionRepository.updateItemsReal).not.toHaveBeenCalled();
      });

      it(`should process items in batches of ${EXECUTION_BATCH_SIZE}`, async () => {
        const data = Array.from({ length: 120 }, (_, i) => item(i + 1));

        await service.performServices(data);

        expect(
          mockExecutionRepository.findExecutionTargets,
        ).toHaveBeenCalledTimes(120);
        expect(mockExecutionRepository.updateItemsReal).toHaveBeenCalledTimes(
          3,
        );
        expect(mockProgress.recomputeServiceTotals).toHaveBeenCalledTimes(3);

        const batchSizes =
          mockExecutionRepository.updateItemsReal.mock.calls.map(
            ([rows]) => rows.length,
          );
        expect(batchSizes).toEqual([50, 50, 20]);

        expect(mockProgress.recomputeServiceTotals.mock.calls[2][0]).toEqual(
          Array.from({ length: 20 }, (_, i) => 101 + i),
        );
      });

      it('should stop at the failing batch (previous batches were already written)', async () => {
        const data = Array.from({ length: 120 }, (_, i) => item(i + 1));
        mockExecutionRepository.findExecutionTargets.mockImplementation(
          async (id: number) => (id === 60 ? [] : targetFor(id)),
        );

        await expectError(
          service.performServices(data),
          BadRequestException,
          'O item 60 não está programado na programação 3.',
        );

        // só o 1.º lote chegou a ser escrito; a transação faz rollback dele
        expect(mockExecutionRepository.updateItemsReal).toHaveBeenCalledTimes(
          1,
        );
        expect(mockProgress.recomputeServiceTotals).toHaveBeenCalledTimes(1);
      });

      it('should propagate errors from updateItemsReal', async () => {
        mockExecutionRepository.updateItemsReal.mockRejectedValueOnce(
          new Error('db down'),
        );

        await expect(service.performServices([item(1)])).rejects.toThrow(
          'db down',
        );
        expect(mockProgress.recomputeServiceTotals).not.toHaveBeenCalled();
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
      { id: 1, id_servico: 100, prog: 10, real: 5 },
      { id: 2, id_servico: 101, prog: 8, real: null },
    ];

    const buildPlan = (overrides = {}) => ({
      hasPendingItems: true,
      hasExecution: false,
      emptiesSchedule: false,
      releasedRowIds: [2],
      affectedServiceIds: [100, 101],
      ...overrides,
    });

    beforeEach(() => {
      mockExecutionRepository.findScheduleWork.mockResolvedValue({
        id_obra: WORK_ID,
      });
      mockExecutionRepository.findScheduleItems.mockResolvedValue(ROWS);
      mockPlanReschedule.mockReturnValue(buildPlan());
    });

    // ─── Transação ───────────────────────────────────────────────────
    it('should run inside a transaction with FINALIZE_TX_OPTIONS', async () => {
      await service.reascheduleServices(WORK_ID, SCHEDULE_ID);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        FINALIZE_TX_OPTIONS,
      );
    });

    // ─── Validações ──────────────────────────────────────────────────
    it('should throw NotFoundException when schedule does not exist', async () => {
      mockExecutionRepository.findScheduleWork.mockResolvedValueOnce(null);

      await expect(
        service.reascheduleServices(WORK_ID, SCHEDULE_ID),
      ).rejects.toThrow(
        new NotFoundException(`Programação ${SCHEDULE_ID} não encontrada.`),
      );

      expect(mockExecutionRepository.findScheduleItems).not.toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should throw BadRequestException when schedule belongs to another work', async () => {
      mockExecutionRepository.findScheduleWork.mockResolvedValueOnce({
        id_obra: 999,
      });

      await expect(
        service.reascheduleServices(WORK_ID, SCHEDULE_ID),
      ).rejects.toThrow(
        new BadRequestException(
          'A programação informada não pertence a esta obra.',
        ),
      );

      expect(mockExecutionRepository.findScheduleItems).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when there are no pending items', async () => {
      mockPlanReschedule.mockReturnValueOnce(
        buildPlan({ hasPendingItems: false }),
      );

      await expect(
        service.reascheduleServices(WORK_ID, SCHEDULE_ID),
      ).rejects.toThrow(
        new BadRequestException(
          'Não há itens pendentes para reagendar nesta programação.',
        ),
      );

      expect(
        mockExecutionRepository.deleteScheduleItemsByIds,
      ).not.toHaveBeenCalled();
      expect(mockProgress.recomputeAll).not.toHaveBeenCalled();
      expect(
        mockStatusFlowRepository.updateScheduleStatus,
      ).not.toHaveBeenCalled();
    });

    // ─── Fluxo ───────────────────────────────────────────────────────
    it('should build the plan from the schedule items', async () => {
      await service.reascheduleServices(WORK_ID, SCHEDULE_ID);

      expect(mockExecutionRepository.findScheduleWork).toHaveBeenCalledWith(
        SCHEDULE_ID,
        mockTx,
      );
      expect(mockExecutionRepository.findScheduleItems).toHaveBeenCalledWith(
        SCHEDULE_ID,
        mockTx,
      );
      expect(mockPlanReschedule).toHaveBeenCalledWith(ROWS);
    });

    it('should delete released rows when there are any', async () => {
      await service.reascheduleServices(WORK_ID, SCHEDULE_ID);

      expect(
        mockExecutionRepository.deleteScheduleItemsByIds,
      ).toHaveBeenCalledWith([2], mockTx);
    });

    it('should not delete rows when nothing is released', async () => {
      mockPlanReschedule.mockReturnValueOnce(buildPlan({ releasedRowIds: [] }));

      await service.reascheduleServices(WORK_ID, SCHEDULE_ID);

      expect(
        mockExecutionRepository.deleteScheduleItemsByIds,
      ).not.toHaveBeenCalled();
    });

    it('should zero schedule progress when the schedule becomes empty', async () => {
      mockPlanReschedule.mockReturnValueOnce(
        buildPlan({ emptiesSchedule: true, releasedRowIds: [1, 2] }),
      );

      await service.reascheduleServices(WORK_ID, SCHEDULE_ID);

      expect(mockExecutionRepository.zeroScheduleProgress).toHaveBeenCalledWith(
        SCHEDULE_ID,
        mockTx,
      );
    });

    it('should not zero schedule progress when rows remain', async () => {
      await service.reascheduleServices(WORK_ID, SCHEDULE_ID);

      expect(
        mockExecutionRepository.zeroScheduleProgress,
      ).not.toHaveBeenCalled();
    });

    it('should recompute progress for affected services after deleting rows', async () => {
      await service.reascheduleServices(WORK_ID, SCHEDULE_ID);

      expect(mockProgress.recomputeAll).toHaveBeenCalledWith(
        [100, 101],
        WORK_ID,
        mockTx,
      );
      expect(
        mockExecutionRepository.deleteScheduleItemsByIds.mock
          .invocationCallOrder[0],
      ).toBeLessThan(mockProgress.recomputeAll.mock.invocationCallOrder[0]);
    });

    it('should set schedule to REAGENDADA when there is no execution', async () => {
      await service.reascheduleServices(WORK_ID, SCHEDULE_ID);

      expect(
        mockStatusFlowRepository.updateScheduleStatus,
      ).toHaveBeenCalledWith(ScheduleStatus.REAGENDADA, SCHEDULE_ID, mockTx);
    });

    it('should set schedule to PARCIAL when there is execution', async () => {
      mockPlanReschedule.mockReturnValueOnce(buildPlan({ hasExecution: true }));

      await service.reascheduleServices(WORK_ID, SCHEDULE_ID);

      expect(
        mockStatusFlowRepository.updateScheduleStatus,
      ).toHaveBeenCalledWith(ScheduleStatus.PARCIAL, SCHEDULE_ID, mockTx);
    });

    it('should set work status to SERVICOS_REAGENDADOS after recomputing', async () => {
      await service.reascheduleServices(WORK_ID, SCHEDULE_ID);

      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        WorkStatus.SERVICOS_REAGENDADOS,
        WORK_ID,
        mockTx,
      );
      expect(
        mockProgress.recomputeAll.mock.invocationCallOrder[0],
      ).toBeLessThan(
        mockStatusFlowRepository.updateStatusWorks.mock.invocationCallOrder[0],
      );
    });

    // ─── Erros ───────────────────────────────────────────────────────
    it('should log and rethrow errors, without updating statuses', async () => {
      const error = new Error('recompute failed');
      mockProgress.recomputeAll.mockRejectedValueOnce(error);

      await expect(
        service.reascheduleServices(WORK_ID, SCHEDULE_ID),
      ).rejects.toBe(error);

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

    // totalPlanned esperado = 12 + 8 + 3 = 23
    const SERVICES = [
      {
        id: 1,
        id_material: null,
        viabilizado: 10,
        qtde_adicional: 2,
        qtde_real: 5,
      }, // 12
      {
        id: 2,
        id_material: null,
        viabilizado: 8,
        qtde_adicional: null,
        qtde_real: null,
      }, // 8  (real null ≠ 0)
      {
        id: 3,
        id_material: null,
        viabilizado: null,
        qtde_adicional: 3,
        qtde_real: 1,
      }, // 3  (viabilizado ?? 0)
      {
        id: 4,
        id_material: null,
        viabilizado: 100,
        qtde_adicional: 5,
        qtde_real: 0,
      }, // descartado
      {
        id: 5,
        id_material: 9,
        viabilizado: 50,
        qtde_adicional: 0,
        qtde_real: 2,
      }, // material
    ];
    const TOTAL_PLANNED = 23;

    const HISTORY = [
      { id_programacao: SCHEDULE_ID, programacoes: { data_prog: DATA_PROG } },
      {
        id_programacao: 4,
        programacoes: { data_prog: new Date('2026-09-01T00:00:00.000Z') },
      },
    ];
    const SCHEDULE_ITEMS = [{ scheduleId: SCHEDULE_ID }, { scheduleId: 4 }];

    const SCHEDULE_TOTALS = { prog: 40, exec: 25 };
    const AGGREGATE_EXECUTED = 60;

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
        id_status_programacao: OPEN_STATUS,
      });
      mockQueryRepository.getAllServicesOfWork.mockResolvedValue(SERVICES);
      mockQueryRepository.getServiceScheduleHistory.mockResolvedValue(HISTORY);
      mockFromHistoryRow.mockImplementation((row) => ({
        scheduleId: row.id_programacao,
      }));
      mockCalculateScheduleProgress.mockReturnValue(SCHEDULE_TOTALS);
      mockCalculateAggregateProgress.mockReturnValue(AGGREGATE_EXECUTED);
      mockExecutionReportService.create.mockResolvedValue(undefined);
      mockExecutionValidator.validatePointByPointExecution.mockResolvedValue(
        undefined,
      );
      mockExecutionRepository.finalizeServices.mockResolvedValue(true);
      mockProgress.recomputeWorkProgress.mockResolvedValue(undefined);
    });

    // ─── Transação ───────────────────────────────────────────────────
    it('should run inside a transaction with FINALIZE_TX_OPTIONS', async () => {
      await service.finalizeServices(WORK_ID, buildPayload(), FILES);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        FINALIZE_TX_OPTIONS,
      );
    });

    // ─── Execuções embutidas ─────────────────────────────────────────
    it('should register executions before validating the schedule', async () => {
      await service.finalizeServices(
        WORK_ID,
        buildPayload({
          executions: [{ id: 1, idSchedule: SCHEDULE_ID, qtdeRealizada: 5 }],
        }),
      );

      expect(mockExecutionRepository.updateItemsReal).toHaveBeenCalledWith(
        [{ rowId: 10, serviceId: 1, real: 5 }],
        mockTx,
      );
      expect(mockProgress.recomputeServiceTotals).toHaveBeenCalledWith(
        [1],
        mockTx,
      );
      expect(order(mockExecutionRepository.updateItemsReal)).toBeLessThan(
        order(mockFindScheduleByIdRepository.findById),
      );
    });

    it.each([[undefined], [[]]])(
      'should skip execution registration when executions = %p',
      async (executions) => {
        await service.finalizeServices(WORK_ID, buildPayload({ executions }));

        expect(
          mockExecutionRepository.findExecutionTargets,
        ).not.toHaveBeenCalled();
        expect(mockExecutionRepository.updateItemsReal).not.toHaveBeenCalled();
      },
    );

    it('should abort finalization if an execution is invalid', async () => {
      mockExecutionRepository.findExecutionTargets.mockResolvedValueOnce([]);

      await expectError(
        service.finalizeServices(
          WORK_ID,
          buildPayload({
            executions: [{ id: 1, idSchedule: SCHEDULE_ID, qtdeRealizada: 5 }],
          }),
        ),
        BadRequestException,
      );
      expect(mockFindScheduleByIdRepository.findById).not.toHaveBeenCalled();
      expect(mockExecutionRepository.finalizeServices).not.toHaveBeenCalled();
    });

    // ─── assertScheduleCanBeFinalized ────────────────────────────────
    it('should throw NotFoundException when schedule does not exist', async () => {
      mockFindScheduleByIdRepository.findById.mockResolvedValueOnce(null);

      await expectError(
        service.finalizeServices(WORK_ID, buildPayload()),
        NotFoundException,
        `Programação ${SCHEDULE_ID} não encontrada.`,
      );
      expect(mockFindScheduleByIdRepository.findById).toHaveBeenCalledWith(
        SCHEDULE_ID,
        mockTx,
      );
      expect(mockQueryRepository.getAllServicesOfWork).not.toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalled();
    });

    it('should throw ConflictException when schedule is already finalized', async () => {
      mockFindScheduleByIdRepository.findById.mockResolvedValueOnce({
        id: SCHEDULE_ID,
        id_status_programacao: FINALIZED_STATUS,
      });

      await expectError(
        service.finalizeServices(WORK_ID, buildPayload()),
        ConflictException,
        'Programação já finalizada. Desfaça a finalização para finalizar novamente.',
      );
      expect(mockExecutionRepository.finalizeServices).not.toHaveBeenCalled();
    });

    // ─── Leituras e cálculos ─────────────────────────────────────────
    it('should load services and history of the work', async () => {
      await service.finalizeServices(WORK_ID, buildPayload());

      expect(mockQueryRepository.getAllServicesOfWork).toHaveBeenCalledWith(
        WORK_ID,
        mockTx,
      );
      expect(
        mockQueryRepository.getServiceScheduleHistory,
      ).toHaveBeenCalledWith(WORK_ID, mockTx);
      expect(mockFromHistoryRow).toHaveBeenCalledTimes(HISTORY.length);
    });

    it('should compute totalPlanned ignoring discarded items (qtde_real = 0) and materials', async () => {
      await service.finalizeServices(WORK_ID, buildPayload());

      expect(mockCalculateScheduleProgress).toHaveBeenCalledWith(
        SCHEDULE_ITEMS,
        TOTAL_PLANNED,
        SCHEDULE_ID,
      );
      expect(mockCalculateAggregateProgress).toHaveBeenCalledWith(
        SCHEDULE_ITEMS,
        TOTAL_PLANNED,
        SCHEDULE_ID,
      );
    });

    it('should use totalPlanned = 0 when the work has no services', async () => {
      mockQueryRepository.getAllServicesOfWork.mockResolvedValueOnce([]);

      await service.finalizeServices(WORK_ID, buildPayload());

      expect(mockCalculateScheduleProgress).toHaveBeenCalledWith(
        SCHEDULE_ITEMS,
        0,
        SCHEDULE_ID,
      );
    });

    it('should throw NotFoundException when history has no entry for the schedule', async () => {
      mockQueryRepository.getServiceScheduleHistory.mockResolvedValueOnce([
        HISTORY[1],
      ]);

      await expectError(
        service.finalizeServices(WORK_ID, buildPayload()),
        NotFoundException,
        `Nenhum histórico encontrado para a programação ${SCHEDULE_ID} nesta obra.`,
      );
      expect(mockExecutionReportService.create).not.toHaveBeenCalled();
      expect(mockExecutionRepository.finalizeServices).not.toHaveBeenCalled();
    });

    // ─── executeFinalization ─────────────────────────────────────────
    it('should create the execution report with schedule, work, date, files and tx', async () => {
      await service.finalizeServices(WORK_ID, buildPayload(), FILES);

      expect(mockExecutionReportService.create).toHaveBeenCalledWith(
        { idSchedule: SCHEDULE_ID, idWork: WORK_ID, ...REPORT_DATA },
        DATA_PROG,
        FILES,
        mockTx,
      );
    });

    it('should pass files as undefined when none are sent', async () => {
      await service.finalizeServices(WORK_ID, buildPayload());

      expect(mockExecutionReportService.create).toHaveBeenCalledWith(
        expect.any(Object),
        DATA_PROG,
        undefined,
        mockTx,
      );
    });

    it.each([[undefined], [null], [{}]])(
      'should not create the report when executionReportData = %p',
      async (executionReportData) => {
        await service.finalizeServices(
          WORK_ID,
          buildPayload({ executionReportData }),
        );

        expect(mockExecutionReportService.create).not.toHaveBeenCalled();
        expect(mockExecutionRepository.finalizeServices).toHaveBeenCalled();
      },
    );

    it('should validate point-by-point execution with aggregate executed', async () => {
      await service.finalizeServices(WORK_ID, buildPayload());

      expect(
        mockExecutionValidator.validatePointByPointExecution,
      ).toHaveBeenCalledWith(EXPECTED_FINALIZATION, AGGREGATE_EXECUTED, mockTx);
    });

    it('should finalize the schedule with the built finalization data', async () => {
      await service.finalizeServices(WORK_ID, buildPayload());

      expect(mockExecutionRepository.finalizeServices).toHaveBeenCalledWith(
        EXPECTED_FINALIZATION, // igualdade exata: executions e executionReportData não entram
        mockTx,
      );
    });

    it('should recompute work progress after finalizing', async () => {
      await service.finalizeServices(WORK_ID, buildPayload());

      expect(mockProgress.recomputeWorkProgress).toHaveBeenCalledWith(
        WORK_ID,
        mockTx,
      );
    });

    it('should run the finalization steps in order', async () => {
      await service.finalizeServices(WORK_ID, buildPayload(), FILES);

      const steps = [
        order(mockFindScheduleByIdRepository.findById),
        order(mockExecutionReportService.create),
        order(mockExecutionValidator.validatePointByPointExecution),
        order(mockExecutionRepository.finalizeServices),
        order(mockProgress.recomputeWorkProgress),
      ];
      expect(steps).toEqual([...steps].sort((a, b) => a - b));
    });

    it('should not finalize when point-by-point validation fails', async () => {
      const error = new BadRequestException('Execução inválida');
      mockExecutionValidator.validatePointByPointExecution.mockRejectedValueOnce(
        error,
      );

      await expect(
        service.finalizeServices(WORK_ID, buildPayload()),
      ).rejects.toBe(error);

      expect(mockExecutionRepository.finalizeServices).not.toHaveBeenCalled();
      expect(mockProgress.recomputeWorkProgress).not.toHaveBeenCalled();
      expect(loggerErrorSpy).toHaveBeenCalledWith(error);
    });

    it('should not continue when report creation fails', async () => {
      mockExecutionReportService.create.mockRejectedValueOnce(
        new Error('upload failed'),
      );

      await expect(
        service.finalizeServices(WORK_ID, buildPayload()),
      ).rejects.toThrow('upload failed');
      expect(
        mockExecutionValidator.validatePointByPointExecution,
      ).not.toHaveBeenCalled();
      expect(mockExecutionRepository.finalizeServices).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when the repository does not update the schedule', async () => {
      mockExecutionRepository.finalizeServices.mockResolvedValueOnce(false);

      await expectError(
        service.finalizeServices(WORK_ID, buildPayload()),
        NotFoundException,
        `Agendamento com ID ${SCHEDULE_ID} não encontrado`,
      );
      expect(mockProgress.recomputeWorkProgress).not.toHaveBeenCalled();
    });

    it('should log and rethrow errors from recomputeWorkProgress', async () => {
      const error = new Error('recompute failed');
      mockProgress.recomputeWorkProgress.mockRejectedValueOnce(error);

      await expect(
        service.finalizeServices(WORK_ID, buildPayload()),
      ).rejects.toBe(error);
      expect(loggerErrorSpy).toHaveBeenCalledWith(error);
    });
  });
});
