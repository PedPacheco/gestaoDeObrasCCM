import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { WorksServicesService } from 'src/application/usecases/services/worksServices.service'; // ajuste
import { ProgressRecalculationService } from 'src/application/usecases/services/progressRecalculation.service'; // ajuste

import {
  FINALIZED_SCHEDULE_STATUSES,
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';
import { PROGRESS_EPSILON } from 'src/utils/pointByPoint/progress.utils';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { WORK_SERVICES_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesRepository';
import { WORK_SERVICES_QUERY_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import {
  AddServicesDTO,
  ApplyAdditonalDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';
import { hasLockedExecution } from 'src/domain/services/pointByPointRules.service';

jest.mock('src/domain/services/pointByPointRules.service', () => ({
  ...jest.requireActual('src/domain/services/pointByPointRules.service'),
  hasLockedExecution: jest.fn(),
}));

const mockHasLockedExecution = hasLockedExecution as jest.Mock;

// ─── Constantes e helpers ────────────────────────────────────────────
const TX_OPTIONS = { maxWait: 10000, timeout: 30000 };

const order = (fn: jest.Mock) => fn.mock.invocationCallOrder[0];

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

describe('WorksServicesService', () => {
  let service: WorksServicesService;

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

  const mockWorkServicesRepository = {
    updateScheduleStatus: jest.fn(),
    createScheduleItems: jest.fn(),
    updateServicesAdditional: jest.fn(),
    findScheduleStatus: jest.fn(),
    findScheduleItemsExecution: jest.fn(),
    deleteScheduleItems: jest.fn(),
    resetScheduleProgress: jest.fn(),
    applyAdditional: jest.fn(),
    addItem: jest.fn(),
    delete: jest.fn(),
    deleteAll: jest.fn(),
    bulkImportItems: jest.fn(),
  };

  const mockQueryRepository = {
    getAllServicesOfWork: jest.fn(),
    getServiceScheduleHistory: jest.fn(),
    findServicesForScheduling: jest.fn(),
  };

  const mockSchedulesRepository = { findById: jest.fn() };

  const mockStatusFlowRepository = {
    updateScheduleStatus: jest.fn(),
    updateStatusWorks: jest.fn(),
  };

  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WorksServicesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ProgressRecalculationService, useValue: mockProgress },
        {
          provide: WORK_SERVICES_REPOSITORY,
          useValue: mockWorkServicesRepository,
        },
        {
          provide: WORK_SERVICES_QUERY_REPOSITORY,
          useValue: mockQueryRepository,
        },
        {
          provide: FIND_SCHEDULE_BY_ID_REPOSITORY,
          useValue: mockSchedulesRepository,
        },
        { provide: STATUS_FLOW_REPOSITORY, useValue: mockStatusFlowRepository },
      ],
    }).compile();

    service = module.get(WorksServicesService);

    loggerErrorSpy = jest.spyOn(Logger.prototype, 'error').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
    loggerErrorSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ════════════════════════════════════════════════════════════════════
  // scheduleServices
  // ════════════════════════════════════════════════════════════════════
  describe('scheduleServices', () => {
    const WORK_ID = 10;
    const SCHEDULE_ID = 3;
    const OPEN_STATUS = ScheduleStatus.CONFIRMADA; // nem finalizada, nem PENDENTE_REVISAO
    const FINALIZED_STATUS = FINALIZED_SCHEDULE_STATUSES[0];

    const buildSchedule = (overrides = {}) => ({
      id: SCHEDULE_ID,
      id_obra: WORK_ID,
      id_status_programacao: OPEN_STATUS,
      ...overrides,
    });

    // Serviço 100: total = 10 + 2 = 12; consumido no histórico = 3 → disponível 9
    // Serviço 101: total = 5 + 0 = 5;  sem histórico            → disponível 5
    const buildService = (overrides = {}) => ({
      id: 100,
      id_obra: WORK_ID,
      operacao: 'OP-1',
      ponto: 'P1',
      qtde_real: null,
      viabilizado: 10,
      qtde_adicional: 2,
      ...overrides,
    });

    const SERVICES = [
      buildService(),
      buildService({
        id: 101,
        operacao: 'OP-2',
        ponto: 'P2',
        viabilizado: 5,
        qtde_adicional: 0,
      }),
    ];

    const historyRow = (overrides = {}) => ({
      id_programacao: 2,
      id_servico: 100,
      id_equipe: 1,
      prog: 4,
      real: 3,
      ...overrides,
    });

    const item = (overrides: Partial<ScheduleServicesDTO> = {}) =>
      ({
        id: 100,
        idSchedule: SCHEDULE_ID,
        idTeam: 1,
        prog: 5,
        ...overrides,
      }) as ScheduleServicesDTO;

    const buildData = () => [
      item(),
      item({ id: 101, idTeam: 2, prog: 3, additional: 1 }),
    ];

    const run = (
      data: ScheduleServicesDTO[] = buildData(),
      tx?: Prisma.TransactionClient,
    ) => service.scheduleServices(WORK_ID, data, tx);

    const expectNoWrites = () => {
      expect(
        mockWorkServicesRepository.updateScheduleStatus,
      ).not.toHaveBeenCalled();
      expect(
        mockWorkServicesRepository.createScheduleItems,
      ).not.toHaveBeenCalled();
      expect(
        mockWorkServicesRepository.updateServicesAdditional,
      ).not.toHaveBeenCalled();
      expect(mockProgress.recomputeAll).not.toHaveBeenCalled();
      expect(mockStatusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
    };

    beforeEach(() => {
      mockSchedulesRepository.findById.mockResolvedValue(buildSchedule());
      mockQueryRepository.getServiceScheduleHistory.mockResolvedValue([
        historyRow(),
      ]);
      mockQueryRepository.findServicesForScheduling.mockResolvedValue(SERVICES);
    });

    it('sanity: OPEN_STATUS is neither finalized nor PENDENTE_REVISAO', () => {
      expect(FINALIZED_SCHEDULE_STATUSES).not.toContain(OPEN_STATUS);
      expect(OPEN_STATUS).not.toBe(ScheduleStatus.PENDENTE_REVISAO);
    });

    // ─── Entrada e transação ─────────────────────────────────────────
    describe('entry and transaction', () => {
      it.each([[undefined], [null], [[]]])(
        'should throw BadRequestException when data = %p',
        async (data) => {
          await expectError(
            service.scheduleServices(WORK_ID, data as any),
            BadRequestException,
            'Programação não enviada.',
          );
          expect(mockPrisma.$transaction).not.toHaveBeenCalled();
          expect(mockSchedulesRepository.findById).not.toHaveBeenCalled();
        },
      );

      it('should open a transaction with TX_OPTIONS when no tx is given', async () => {
        await run();

        expect(mockPrisma.$transaction).toHaveBeenCalledWith(
          expect.any(Function),
          TX_OPTIONS,
        );
        expect(mockSchedulesRepository.findById).toHaveBeenCalledWith(
          SCHEDULE_ID,
          mockTx,
        );
      });

      it('should reuse the given tx in every call and not open a new transaction', async () => {
        const externalTx = {
          __external: true,
        } as unknown as Prisma.TransactionClient;

        await run(buildData(), externalTx);

        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
        expect(mockSchedulesRepository.findById).toHaveBeenCalledWith(
          SCHEDULE_ID,
          externalTx,
        );
        expect(
          mockQueryRepository.getServiceScheduleHistory,
        ).toHaveBeenCalledWith(WORK_ID, externalTx);
        expect(
          mockWorkServicesRepository.createScheduleItems,
        ).toHaveBeenCalledWith(SCHEDULE_ID, expect.any(Array), externalTx);
        expect(mockProgress.recomputeAll).toHaveBeenCalledWith(
          expect.any(Array),
          WORK_ID,
          externalTx,
        );
      });
    });

    // ─── validatePayload ─────────────────────────────────────────────
    describe('payload validation', () => {
      it('should reject items from different schedules', async () => {
        await expectError(
          run([item(), item({ id: 101, idSchedule: 4 })]),
          BadRequestException,
          'Todos os serviços devem pertencer à mesma programação.',
        );
        expect(mockSchedulesRepository.findById).not.toHaveBeenCalled();
      });

      it('should reject items without idSchedule', async () => {
        await expectError(
          run([item({ idSchedule: undefined })]),
          BadRequestException,
          'Todos os serviços devem pertencer à mesma programação.',
        );
      });

      it.each([
        ['id is missing', { id: undefined }],
        ['id is NaN', { id: NaN }],
        ['id is a string', { id: '100' }],
        ['idTeam is missing', { idTeam: undefined }],
        ['idTeam is Infinity', { idTeam: Infinity }],
      ])('should reject when %s', async (_, overrides) => {
        await expectError(
          run([item(overrides as any)]),
          BadRequestException,
          'Serviço e equipe devem ser informados para cada item.',
        );
        expect(mockSchedulesRepository.findById).not.toHaveBeenCalled();
      });

      it.each([[-1], [-0.01], [NaN], [Infinity], [undefined], ['5']])(
        'should reject prog = %p',
        async (prog) => {
          await expectError(
            run([item({ prog } as any)]),
            BadRequestException,
            'A quantidade programada deve ser um número maior ou igual a zero.',
          );
          expect(mockSchedulesRepository.findById).not.toHaveBeenCalled();
        },
      );

      it('should accept prog = 0', async () => {
        await run([item({ prog: 0 })]);

        expect(
          mockWorkServicesRepository.createScheduleItems,
        ).toHaveBeenCalled();
      });
    });

    // ─── Programação ─────────────────────────────────────────────────
    describe('schedule checks', () => {
      it('should throw NotFoundException when schedule does not exist', async () => {
        mockSchedulesRepository.findById.mockResolvedValueOnce(null);

        await expectError(
          run(),
          NotFoundException,
          `Programação com ID ${SCHEDULE_ID} não encontrada.`,
        );
        expect(
          mockQueryRepository.getServiceScheduleHistory,
        ).not.toHaveBeenCalled();
        expectNoWrites();
      });

      it('should throw BadRequestException when schedule belongs to another work', async () => {
        mockSchedulesRepository.findById.mockResolvedValueOnce(
          buildSchedule({ id_obra: 99 }),
        );

        await expectError(
          run(),
          BadRequestException,
          'A programação informada não pertence a esta obra.',
        );
        expectNoWrites();
      });

      it('should throw ConflictException when schedule is finalized', async () => {
        mockSchedulesRepository.findById.mockResolvedValueOnce(
          buildSchedule({ id_status_programacao: FINALIZED_STATUS }),
        );

        await expectError(
          run(),
          ConflictException,
          'Programação já finalizada: não é possível programar novos serviços.',
        );
        expect(
          mockQueryRepository.getServiceScheduleHistory,
        ).not.toHaveBeenCalled();
        expectNoWrites();
      });
    });

    // ─── validateOwnershipAndBalance ─────────────────────────────────
    describe('ownership and balance', () => {
      it('should load history and services (with unique ids) using the schedule work', async () => {
        await run([
          item({ idTeam: 1, prog: 1 }),
          item({ idTeam: 2, prog: 1 }),
          item({ id: 101, idTeam: 2, prog: 1 }),
        ]);

        expect(
          mockQueryRepository.getServiceScheduleHistory,
        ).toHaveBeenCalledWith(WORK_ID, mockTx);
        expect(
          mockQueryRepository.findServicesForScheduling,
        ).toHaveBeenCalledWith([100, 101], mockTx);
      });

      it('should reject a service that does not exist', async () => {
        await expectError(
          run([item({ id: 999 })]),
          BadRequestException,
          'O item 999 não pertence a esta obra.',
        );
        expectNoWrites();
      });

      it('should reject a service from another work', async () => {
        mockQueryRepository.findServicesForScheduling.mockResolvedValueOnce([
          buildService({ id_obra: 99 }),
        ]);

        await expectError(
          run([item()]),
          BadRequestException,
          'O item 100 não pertence a esta obra.',
        );
      });

      it('should reject a discarded service (qtde_real = 0) using operation + point as label', async () => {
        mockQueryRepository.findServicesForScheduling.mockResolvedValueOnce([
          buildService({ qtde_real: 0 }),
        ]);

        await expectError(
          run([item()]),
          BadRequestException,
          'O item OP-1 P1 foi descartado e não pode ser programado.',
        );
        expectNoWrites();
      });

      it('should fall back to the service id when there is no label', async () => {
        mockQueryRepository.findServicesForScheduling.mockResolvedValueOnce([
          buildService({ qtde_real: 0, operacao: null, ponto: null }),
        ]);

        await expectError(
          run([item()]),
          BadRequestException,
          'O item 100 foi descartado e não pode ser programado.',
        );
      });

      it('should skip the balance check when viabilizado is null', async () => {
        mockQueryRepository.findServicesForScheduling.mockResolvedValueOnce([
          buildService({ viabilizado: null }),
        ]);

        await run([item({ prog: 1000 })]);

        expect(
          mockWorkServicesRepository.createScheduleItems,
        ).toHaveBeenCalled();
      });

      it('should accept a request equal to the available balance', async () => {
        await run([item({ prog: 9 })]); // 10 + 2 - 3

        expect(
          mockWorkServicesRepository.createScheduleItems,
        ).toHaveBeenCalled();
      });

      it('should accept a request above the balance within PROGRESS_EPSILON', async () => {
        await run([item({ prog: 9 + PROGRESS_EPSILON / 2 })]);

        expect(
          mockWorkServicesRepository.createScheduleItems,
        ).toHaveBeenCalled();
      });

      it('should reject a request above the available balance', async () => {
        await expectError(
          run([item({ prog: 10 })]),
          BadRequestException,
          'Saldo insuficiente para o item OP-1 P1: disponível 9, solicitado 10.',
        );
        expectNoWrites();
      });

      it('should sum the requested quantity across teams of the same service', async () => {
        await expectError(
          run([item({ idTeam: 1, prog: 5 }), item({ idTeam: 2, prog: 5 })]),
          BadRequestException,
          'Saldo insuficiente para o item OP-1 P1: disponível 9, solicitado 10.',
        );
      });

      it('should use prog as consumption when real is null', async () => {
        mockQueryRepository.getServiceScheduleHistory.mockResolvedValueOnce([
          historyRow({ real: null, prog: 4 }),
        ]);

        await expectError(
          run([item({ prog: 9 })]),
          BadRequestException,
          'Saldo insuficiente para o item OP-1 P1: disponível 8, solicitado 9.',
        );
      });

      it('should treat real = 0 as zero consumption (uses ?? and not ||)', async () => {
        mockQueryRepository.getServiceScheduleHistory.mockResolvedValueOnce([
          historyRow({ real: 0, prog: 4 }),
        ]);

        await run([item({ prog: 12 })]); // 10 + 2 - 0

        expect(
          mockWorkServicesRepository.createScheduleItems,
        ).toHaveBeenCalled();
      });

      it('should use the additional from the payload instead of qtde_adicional', async () => {
        await expectError(
          run([item({ prog: 8, additional: 0 })]), // 10 + 0 - 3 = 7
          BadRequestException,
          'Saldo insuficiente para o item OP-1 P1: disponível 7, solicitado 8.',
        );
      });

      it('should accept a request covered by a larger additional from the payload', async () => {
        await run([item({ prog: 12, additional: 5 })]); // 10 + 5 - 3 = 12

        expect(
          mockWorkServicesRepository.createScheduleItems,
        ).toHaveBeenCalled();
      });

      it('should show available = 0 when consumption exceeds the total', async () => {
        mockQueryRepository.getServiceScheduleHistory.mockResolvedValueOnce([
          historyRow({ real: 15 }),
        ]);

        await expectError(
          run([item({ prog: 1 })]),
          BadRequestException,
          'Saldo insuficiente para o item OP-1 P1: disponível 0, solicitado 1.',
        );
      });
    });

    // ─── validateNotDuplicated ───────────────────────────────────────
    describe('duplicate check', () => {
      const DUPLICATE_MESSAGE =
        'Esse serviço já foi programado, nessa programação atual!!';

      it('should reject a service + team already scheduled in this schedule', async () => {
        mockQueryRepository.getServiceScheduleHistory.mockResolvedValueOnce([
          historyRow({ id_programacao: SCHEDULE_ID, prog: 2, real: null }),
        ]);

        await expectError(
          run([item()]),
          BadRequestException,
          DUPLICATE_MESSAGE,
        );
        expectNoWrites();
      });

      it('should allow the same service with another team in this schedule', async () => {
        mockQueryRepository.getServiceScheduleHistory.mockResolvedValueOnce([
          historyRow({ id_programacao: SCHEDULE_ID, prog: 2, real: null }),
        ]);

        await run([item({ idTeam: 2 })]);

        expect(
          mockWorkServicesRepository.createScheduleItems,
        ).toHaveBeenCalled();
      });

      it('should allow the same service + team scheduled in another schedule', async () => {
        // histórico por omissão: programação 2, serviço 100, equipa 1
        await run([item()]);

        expect(
          mockWorkServicesRepository.createScheduleItems,
        ).toHaveBeenCalled();
      });

      it('should reject the same service + team sent twice in the payload', async () => {
        await expectError(
          run([item({ prog: 1 }), item({ prog: 1 })]),
          BadRequestException,
          DUPLICATE_MESSAGE,
        );
        expectNoWrites();
      });
    });

    // ─── Escritas ────────────────────────────────────────────────────
    describe('writes', () => {
      it('should create schedule items with the payload', async () => {
        const data = buildData();

        await run(data);

        expect(
          mockWorkServicesRepository.createScheduleItems,
        ).toHaveBeenCalledWith(SCHEDULE_ID, data, mockTx);
      });

      it('should update additional only for items that sent it (0 included)', async () => {
        await run([
          item({ additional: 0 }),
          item({ id: 101, idTeam: 2, prog: 1, additional: null }),
        ]);

        expect(
          mockWorkServicesRepository.updateServicesAdditional,
        ).toHaveBeenCalledWith([{ id: 100, additional: 0 }], mockTx);
      });

      it('should call updateServicesAdditional with an empty list when no additional is sent', async () => {
        await run([item()]);

        expect(
          mockWorkServicesRepository.updateServicesAdditional,
        ).toHaveBeenCalledWith([], mockTx);
      });

      it('should recompute progress with the payload service ids and the schedule work', async () => {
        await run();

        expect(mockProgress.recomputeAll).toHaveBeenCalledWith(
          [100, 101],
          WORK_ID,
          mockTx,
        );
      });

      it('should pass repeated ids to recomputeAll when a service has several teams (current behaviour)', async () => {
        await run([item({ idTeam: 1, prog: 1 }), item({ idTeam: 2, prog: 1 })]);

        expect(mockProgress.recomputeAll).toHaveBeenCalledWith(
          [100, 100],
          WORK_ID,
          mockTx,
        );
      });

      it('should not change statuses when schedule is not PENDENTE_REVISAO', async () => {
        await run();

        expect(
          mockWorkServicesRepository.updateScheduleStatus,
        ).not.toHaveBeenCalled();
        expect(
          mockStatusFlowRepository.updateStatusWorks,
        ).not.toHaveBeenCalled();
      });

      describe('when schedule is PENDENTE_REVISAO', () => {
        beforeEach(() => {
          mockSchedulesRepository.findById.mockResolvedValue(
            buildSchedule({
              id_status_programacao: ScheduleStatus.PENDENTE_REVISAO,
            }),
          );
        });

        it('should approve the schedule and set the work as PROGRAMADA', async () => {
          await run();

          expect(
            mockWorkServicesRepository.updateScheduleStatus,
          ).toHaveBeenCalledWith(SCHEDULE_ID, ScheduleStatus.APROVADA, mockTx);
          expect(
            mockStatusFlowRepository.updateStatusWorks,
          ).toHaveBeenCalledWith(WorkStatus.PROGRAMADA, WORK_ID, mockTx);
        });

        it('should run the writes in order', async () => {
          await run();

          const steps = [
            order(mockWorkServicesRepository.updateScheduleStatus),
            order(mockWorkServicesRepository.createScheduleItems),
            order(mockWorkServicesRepository.updateServicesAdditional),
            order(mockProgress.recomputeAll),
            order(mockStatusFlowRepository.updateStatusWorks),
          ];
          expect(steps).toEqual([...steps].sort((a, b) => a - b));
        });

        it('should not update the work status if recompute fails', async () => {
          mockProgress.recomputeAll.mockRejectedValueOnce(
            new Error('recompute failed'),
          );

          await expect(run()).rejects.toThrow('recompute failed');
          expect(
            mockStatusFlowRepository.updateStatusWorks,
          ).not.toHaveBeenCalled();
        });
      });

      it('should stop when createScheduleItems fails', async () => {
        mockWorkServicesRepository.createScheduleItems.mockRejectedValueOnce(
          new Error('insert failed'),
        );

        await expect(run()).rejects.toThrow('insert failed');
        expect(
          mockWorkServicesRepository.updateServicesAdditional,
        ).not.toHaveBeenCalled();
        expect(mockProgress.recomputeAll).not.toHaveBeenCalled();
      });
    });
  });

  describe('cancelServices', () => {
    const SCHEDULE_ID = 3;
    const WORK_ID = 10;
    const SCHEDULE = { id_obra: WORK_ID, id_status_programacao: 2 };
    const ROWS = [
      { id_servico: 100, real: null },
      { id_servico: 101, real: null },
    ];

    beforeEach(() => {
      mockWorkServicesRepository.findScheduleStatus.mockResolvedValue(SCHEDULE);
      mockWorkServicesRepository.findScheduleItemsExecution.mockResolvedValue(
        ROWS,
      );
      mockHasLockedExecution.mockReturnValue(false);
    });

    it('should run inside a transaction with TX_OPTIONS', async () => {
      await service.cancelServices(SCHEDULE_ID);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        TX_OPTIONS,
      );
    });

    it('should throw NotFoundException when schedule does not exist', async () => {
      mockWorkServicesRepository.findScheduleStatus.mockResolvedValueOnce(null);

      await expectError(
        service.cancelServices(SCHEDULE_ID),
        NotFoundException,
        `Programação com ID ${SCHEDULE_ID} não encontrada`,
      );
      expect(
        mockWorkServicesRepository.findScheduleItemsExecution,
      ).not.toHaveBeenCalled();
      expect(
        mockWorkServicesRepository.deleteScheduleItems,
      ).not.toHaveBeenCalled();
    });

    it('should check locked execution with schedule status and rows', async () => {
      await service.cancelServices(SCHEDULE_ID);

      expect(
        mockWorkServicesRepository.findScheduleStatus,
      ).toHaveBeenCalledWith(SCHEDULE_ID, mockTx);
      expect(
        mockWorkServicesRepository.findScheduleItemsExecution,
      ).toHaveBeenCalledWith(SCHEDULE_ID, mockTx);
      expect(mockHasLockedExecution).toHaveBeenCalledWith(
        SCHEDULE.id_status_programacao,
        ROWS,
      );
    });

    it('should throw ConflictException when execution is locked', async () => {
      mockHasLockedExecution.mockReturnValueOnce(true);

      await expectError(
        service.cancelServices(SCHEDULE_ID),
        ConflictException,
        'Programação com execução lançada ou finalizada não pode ter os serviços cancelados. Desfaça a finalização antes.',
      );
      expect(
        mockWorkServicesRepository.deleteScheduleItems,
      ).not.toHaveBeenCalled();
      expect(
        mockWorkServicesRepository.resetScheduleProgress,
      ).not.toHaveBeenCalled();
      expect(mockProgress.recomputeAll).not.toHaveBeenCalled();
    });

    it('should delete items, reset progress and recompute affected services', async () => {
      await service.cancelServices(SCHEDULE_ID);

      expect(
        mockWorkServicesRepository.deleteScheduleItems,
      ).toHaveBeenCalledWith(SCHEDULE_ID, mockTx);
      expect(
        mockWorkServicesRepository.resetScheduleProgress,
      ).toHaveBeenCalledWith(SCHEDULE_ID, mockTx);
      expect(mockProgress.recomputeAll).toHaveBeenCalledWith(
        [100, 101],
        WORK_ID,
        mockTx,
      );
    });

    it('should run the steps in order: delete → reset → recompute', async () => {
      await service.cancelServices(SCHEDULE_ID);

      const steps = [
        order(mockWorkServicesRepository.deleteScheduleItems),
        order(mockWorkServicesRepository.resetScheduleProgress),
        order(mockProgress.recomputeAll),
      ];
      expect(steps).toEqual([...steps].sort((a, b) => a - b));
    });

    it('should recompute with an empty list when the schedule has no items', async () => {
      mockWorkServicesRepository.findScheduleItemsExecution.mockResolvedValueOnce(
        [],
      );

      await service.cancelServices(SCHEDULE_ID);

      expect(mockProgress.recomputeAll).toHaveBeenCalledWith(
        [],
        WORK_ID,
        mockTx,
      );
    });

    it('should propagate errors and not recompute', async () => {
      mockWorkServicesRepository.resetScheduleProgress.mockRejectedValueOnce(
        new Error('db down'),
      );

      await expect(service.cancelServices(SCHEDULE_ID)).rejects.toThrow(
        'db down',
      );
      expect(mockProgress.recomputeAll).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // applyAdditional
  // ════════════════════════════════════════════════════════════════════
  describe('applyAdditional', () => {
    const WORK_ID = 10;
    const DATA = [
      { id: 1, additional: 4 },
      { id: 2, additional: 0 },
    ] as ApplyAdditonalDTO[];

    it('should apply additional and recompute work progress in a transaction', async () => {
      await service.applyAdditional(WORK_ID, DATA);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        TX_OPTIONS,
      );
      expect(mockWorkServicesRepository.applyAdditional).toHaveBeenCalledWith(
        DATA,
        mockTx,
      );
      expect(mockProgress.recomputeWorkProgress).toHaveBeenCalledWith(
        WORK_ID,
        mockTx,
      );
      expect(order(mockWorkServicesRepository.applyAdditional)).toBeLessThan(
        order(mockProgress.recomputeWorkProgress),
      );
    });

    it('should log and rethrow errors without recomputing', async () => {
      const error = new Error('update failed');
      mockWorkServicesRepository.applyAdditional.mockRejectedValueOnce(error);

      await expect(service.applyAdditional(WORK_ID, DATA)).rejects.toBe(error);
      expect(loggerErrorSpy).toHaveBeenCalledWith(error);
      expect(mockProgress.recomputeWorkProgress).not.toHaveBeenCalled();
    });

    it('should log and rethrow errors from recomputeWorkProgress', async () => {
      const error = new Error('recompute failed');
      mockProgress.recomputeWorkProgress.mockRejectedValueOnce(error);

      await expect(service.applyAdditional(WORK_ID, DATA)).rejects.toBe(error);
      expect(loggerErrorSpy).toHaveBeenCalledWith(error);
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // addItem
  // ════════════════════════════════════════════════════════════════════
  describe('addItem', () => {
    const WORK_ID = 10;

    const EXISTING_ITEMS = [
      {
        id: 1,
        id_contrato_servico: 50,
        id_material: null,
        ponto: 'P1',
        descricao_operacao: 'Instalação',
      },
      {
        id: 2,
        id_contrato_servico: null,
        id_material: 60,
        ponto: 'P1',
        descricao_operacao: 'Cabo',
      },
    ];

    const buildDto = (overrides: Partial<AddServicesDTO> = {}) =>
      ({
        idService: 70,
        idWork: WORK_ID,
        operation: 'OP-1',
        point: 'P1',
        operationDescription: 'Instalação',
        quantity: 8,
        ...overrides,
      }) as AddServicesDTO;

    beforeEach(() => {
      mockQueryRepository.getAllServicesOfWork.mockResolvedValue(
        EXISTING_ITEMS,
      );
    });

    it('should load the work items outside the transaction (without tx)', async () => {
      await service.addItem(buildDto(), 'service');

      expect(mockQueryRepository.getAllServicesOfWork).toHaveBeenCalledWith(
        WORK_ID,
      );
      expect(order(mockQueryRepository.getAllServicesOfWork)).toBeLessThan(
        order(mockPrisma.$transaction),
      );
    });

    it('should throw when the service already exists in the same point and operation', async () => {
      await expectError(
        service.addItem(buildDto({ idService: 50 }), 'service'),
        BadRequestException,
        'Esse serviço já existe nesse ponto.',
      );
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockWorkServicesRepository.addItem).not.toHaveBeenCalled();
    });

    it('should throw when the material already exists in the same point and operation', async () => {
      await expectError(
        service.addItem(
          buildDto({ idService: 60, operationDescription: 'Cabo' }),
          'material',
        ),
        BadRequestException,
        'Esse material já existe nesse ponto.',
      );
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it.each([
      ['another point', { idService: 50, point: 'P2' }],
      [
        'another operation description',
        { idService: 50, operationDescription: 'Retirada' },
      ],
    ])('should allow the same service in %s', async (_, overrides) => {
      await service.addItem(buildDto(overrides), 'service');

      expect(mockWorkServicesRepository.addItem).toHaveBeenCalled();
    });

    it('should compare only ids of the same type (service id equal to a material id is allowed)', async () => {
      // 60 existe como id_material, mas aqui é adicionado como serviço
      await service.addItem(
        buildDto({ idService: 60, operationDescription: 'Cabo' }),
        'service',
      );

      expect(mockWorkServicesRepository.addItem).toHaveBeenCalled();
    });

    it('should add the item when the work has no items', async () => {
      mockQueryRepository.getAllServicesOfWork.mockResolvedValueOnce([]);

      await service.addItem(buildDto(), 'material');

      expect(mockWorkServicesRepository.addItem).toHaveBeenCalled();
    });

    it.each([['service' as const], ['material' as const]])(
      'should add the %s and recompute work progress in a transaction',
      async (type) => {
        const dto = buildDto();

        await service.addItem(dto, type);

        expect(mockPrisma.$transaction).toHaveBeenCalledWith(
          expect.any(Function),
          TX_OPTIONS,
        );
        expect(mockWorkServicesRepository.addItem).toHaveBeenCalledWith(
          dto,
          type,
          mockTx,
        );
        expect(mockProgress.recomputeWorkProgress).toHaveBeenCalledWith(
          WORK_ID,
          mockTx,
        );
        expect(order(mockWorkServicesRepository.addItem)).toBeLessThan(
          order(mockProgress.recomputeWorkProgress),
        );
      },
    );

    it('should log and rethrow errors without recomputing', async () => {
      const error = new Error('insert failed');
      mockWorkServicesRepository.addItem.mockRejectedValueOnce(error);

      await expect(service.addItem(buildDto(), 'service')).rejects.toBe(error);
      expect(loggerErrorSpy).toHaveBeenCalledWith(error);
      expect(mockProgress.recomputeWorkProgress).not.toHaveBeenCalled();
    });

    it('should propagate errors from getAllServicesOfWork without opening a transaction', async () => {
      mockQueryRepository.getAllServicesOfWork.mockRejectedValueOnce(
        new Error('query failed'),
      );

      await expect(service.addItem(buildDto(), 'service')).rejects.toThrow(
        'query failed',
      );
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // delete
  // ════════════════════════════════════════════════════════════════════
  describe('delete', () => {
    const WORK_ID = 10;

    it.each([[0], [null], [undefined]])(
      'should throw BadRequestException when id = %p',
      async (id) => {
        await expectError(
          service.delete(id as any, WORK_ID),
          BadRequestException,
          'Nenhum serviço/material fornecida para exclusão.',
        );
        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      },
    );

    it('should delete the item and recompute work progress in a transaction', async () => {
      await service.delete(5, WORK_ID);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        TX_OPTIONS,
      );
      expect(mockWorkServicesRepository.delete).toHaveBeenCalledWith(5, mockTx);
      expect(mockProgress.recomputeWorkProgress).toHaveBeenCalledWith(
        WORK_ID,
        mockTx,
      );
      expect(order(mockWorkServicesRepository.delete)).toBeLessThan(
        order(mockProgress.recomputeWorkProgress),
      );
    });

    it('should log and rethrow errors (e.g. P2025) without recomputing', async () => {
      const error = Object.assign(new Error('not found'), { code: 'P2025' });
      mockWorkServicesRepository.delete.mockRejectedValueOnce(error);

      await expect(service.delete(5, WORK_ID)).rejects.toBe(error);
      expect(loggerErrorSpy).toHaveBeenCalledWith(error);
      expect(mockProgress.recomputeWorkProgress).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // deleteAll
  // ════════════════════════════════════════════════════════════════════
  describe('deleteAll', () => {
    const WORK_ID = 10;

    it('should delete all items and recompute work progress in a transaction', async () => {
      await service.deleteAll(WORK_ID);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
        TX_OPTIONS,
      );
      expect(mockWorkServicesRepository.deleteAll).toHaveBeenCalledWith(
        WORK_ID,
        mockTx,
      );
      expect(mockProgress.recomputeWorkProgress).toHaveBeenCalledWith(
        WORK_ID,
        mockTx,
      );
      expect(order(mockWorkServicesRepository.deleteAll)).toBeLessThan(
        order(mockProgress.recomputeWorkProgress),
      );
    });

    it('should log and rethrow errors without recomputing', async () => {
      const error = new Error('FK violation');
      mockWorkServicesRepository.deleteAll.mockRejectedValueOnce(error);

      await expect(service.deleteAll(WORK_ID)).rejects.toBe(error);
      expect(loggerErrorSpy).toHaveBeenCalledWith(error);
      expect(mockProgress.recomputeWorkProgress).not.toHaveBeenCalled();
    });
  });
});
