import { WorkScheduleMapper } from 'src/application/mappers/scheduleMapper';
import { ValidateConfirmAndRejectSchedulesService } from 'src/application/usecases/works/schedule/validateAndConfirmSchedules.service';
import { WorkSchedule } from 'src/domain/entities/schedules/workSchedule.entity';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { VALIDATE_CONFIRM_AND_REJECT_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IValidateSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  FINALIZED_SCHEDULE_STATUSES,
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';

import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'src/generated/prisma/client';

// ─── Constantes e helpers ────────────────────────────────────────────
const OPEN_STATUS = ScheduleStatus.CONFIRMADA; // qualquer status NÃO finalizado
const FINALIZED_STATUS = FINALIZED_SCHEDULE_STATUSES[0];

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

type ScheduleRow = {
  id: number;
  id_obra: number;
  id_status_programacao: number;
};

const buildSchedule = (
  id: number,
  id_obra: number,
  id_status_programacao = OPEN_STATUS,
): ScheduleRow => ({
  id,
  id_obra,
  id_status_programacao,
});

describe('ValidateConfirmAndRejectSchedulesService', () => {
  let service: ValidateConfirmAndRejectSchedulesService;

  const mockTx = { __tx: true } as unknown as Prisma.TransactionClient;

  const mockPrisma = {
    $transaction: jest.fn((cb: (tx: Prisma.TransactionClient) => unknown) =>
      cb(mockTx),
    ),
    obras: { findMany: jest.fn() },
    programacoes_servicos: { findMany: jest.fn() },
  };

  const mockRepository = {
    validate: jest.fn(),
    confirm: jest.fn(),
    reject: jest.fn(),
  };

  const mockStatusFlowRepository = {
    updateScheduleStatus: jest.fn(),
    updateStatusWorks: jest.fn(),
  };

  const mockFindScheduleByIdRepository = { findById: jest.fn() };

  // ─── "Base de dados" em memória (reposta em cada teste) ────────────
  // Programações 1 e 2 → obra 10; programação 3 → obra 20
  let schedulesDb: Record<number, ScheduleRow>;
  let pointByPointWorkIds: Set<number>;
  let schedulesWithServices: Set<number>;

  // ─── Mapper de domínio ─────────────────────────────────────────────
  let toDomainSpy: jest.SpyInstance;
  let requireDpNumber: jest.Mock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateConfirmAndRejectSchedulesService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: VALIDATE_CONFIRM_AND_REJECT_SCHEDULES_REPOSITORY,
          useValue: mockRepository,
        },
        { provide: STATUS_FLOW_REPOSITORY, useValue: mockStatusFlowRepository },
        {
          provide: FIND_SCHEDULE_BY_ID_REPOSITORY,
          useValue: mockFindScheduleByIdRepository,
        },
      ],
    }).compile();

    service = module.get(ValidateConfirmAndRejectSchedulesService);

    schedulesDb = {
      1: buildSchedule(1, 10),
      2: buildSchedule(2, 10),
      3: buildSchedule(3, 20),
    };
    pointByPointWorkIds = new Set(); // por omissão: tudo tradicional
    schedulesWithServices = new Set([1, 2, 3]);

    mockFindScheduleByIdRepository.findById.mockImplementation(
      async (id: number) => schedulesDb[id] ?? null,
    );

    mockPrisma.obras.findMany.mockImplementation(async ({ where }: any) =>
      where.id.in.map((id: number) => ({
        id,
        programacao_ponto_a_ponto: pointByPointWorkIds.has(id),
      })),
    );

    mockPrisma.programacoes_servicos.findMany.mockImplementation(
      async ({ where }: any) =>
        where.id_programacao.in
          .filter((id: number) => schedulesWithServices.has(id))
          .map((id: number) => ({ id_programacao: id })),
    );

    requireDpNumber = jest.fn();
    toDomainSpy = jest
      .spyOn(WorkScheduleMapper, 'toDomain')
      .mockImplementation(
        (row: any) =>
          ({ id: row.id, requireDpNumber }) as unknown as WorkSchedule,
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
    toDomainSpy.mockRestore();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('sanity: OPEN_STATUS is not a finalized status', () => {
    expect(FINALIZED_SCHEDULE_STATUSES).not.toContain(OPEN_STATUS);
  });

  // ════════════════════════════════════════════════════════════════════
  // Guardas comuns (loadSchedules + assertPointByPointTransitionAllowed)
  // ════════════════════════════════════════════════════════════════════
  describe.each([
    {
      method: 'validate',
      run: (ids: number[]) =>
        service.validate(ids.map((id) => ({ id, validate: true })) as any),
      write: () => mockRepository.validate,
    },
    {
      method: 'confirm',
      run: (ids: number[]) =>
        service.confirm(ids.map((id) => ({ id, confirm: true })) as any),
      write: () => mockRepository.confirm,
    },
  ])('$method: shared guards', ({ run, write }) => {
    it('should load every schedule without tx', async () => {
      await run([1, 2, 3]);

      expect(mockFindScheduleByIdRepository.findById).toHaveBeenCalledTimes(3);
      mockFindScheduleByIdRepository.findById.mock.calls.forEach((call) =>
        expect(call).toHaveLength(1),
      );
    });

    it('should throw NotFoundException listing every missing schedule', async () => {
      await expectError(
        run([1, 4, 5]),
        NotFoundException,
        'Programação não encontrada: 4, 5.',
      );
      expect(mockPrisma.obras.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should query the distinct works of the schedules', async () => {
      await run([1, 2, 3]);

      expect(mockPrisma.obras.findMany).toHaveBeenCalledWith({
        where: { id: { in: [10, 20] } },
        select: { id: true, programacao_ponto_a_ponto: true },
      });
    });

    it('should skip point-by-point checks for traditional works (even finalized)', async () => {
      schedulesDb[1] = buildSchedule(1, 10, FINALIZED_STATUS);
      schedulesWithServices.clear();

      await run([1, 2, 3]);

      expect(mockPrisma.programacoes_servicos.findMany).not.toHaveBeenCalled();
      expect(write()).toHaveBeenCalled();
    });

    it('should throw ConflictException listing finalized point-by-point schedules', async () => {
      pointByPointWorkIds.add(10);
      schedulesDb[1] = buildSchedule(1, 10, FINALIZED_STATUS);
      schedulesDb[2] = buildSchedule(2, 10, FINALIZED_STATUS);

      await expectError(
        run([1, 2, 3]),
        ConflictException,
        'Programação já finalizada não pode mudar de etapa: 1, 2.',
      );
      expect(mockPrisma.programacoes_servicos.findMany).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should only check finalization on point-by-point works', async () => {
      pointByPointWorkIds.add(10);
      schedulesDb[3] = buildSchedule(3, 20, FINALIZED_STATUS); // obra 20 é tradicional

      await run([1, 3]);

      expect(write()).toHaveBeenCalled();
    });

    it('should check services only for point-by-point schedules', async () => {
      pointByPointWorkIds.add(10);

      await run([1, 2, 3]);

      expect(mockPrisma.programacoes_servicos.findMany).toHaveBeenCalledWith({
        where: { id_programacao: { in: [1, 2] } },
        select: { id_programacao: true },
        distinct: ['id_programacao'],
      });
    });

    it('should throw BadRequestException listing point-by-point schedules without services', async () => {
      pointByPointWorkIds.add(10);
      schedulesWithServices = new Set([1, 3]);

      await expectError(
        run([1, 2, 3]),
        BadRequestException,
        'Programação sem serviços programados: 2.',
      );
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should run the guards before opening the transaction', async () => {
      pointByPointWorkIds.add(10);

      await run([1]);

      expect(order(mockPrisma.obras.findMany)).toBeLessThan(
        order(mockPrisma.$transaction),
      );
      expect(order(mockPrisma.programacoes_servicos.findMany)).toBeLessThan(
        order(mockPrisma.$transaction),
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // validate
  // ════════════════════════════════════════════════════════════════════
  describe('validate', () => {
    const DATA = [
      { id: 1, validate: true },
      { id: 2, validate: true },
      { id: 3, validate: true },
    ] as any[];

    it.each([[undefined], [null], [[]]])(
      'should throw BadRequestException when data = %p',
      async (data) => {
        await expectError(
          service.validate(data as any),
          BadRequestException,
          'Nenhuma programação foi enviada para ser validada',
        );
        expect(mockFindScheduleByIdRepository.findById).not.toHaveBeenCalled();
      },
    );

    it.each([[false], [undefined], [null]])(
      'should reject when any item has validate = %p',
      async (validate) => {
        await expectError(
          service.validate([
            { id: 1, validate: true },
            { id: 2, validate },
          ] as any),
          BadRequestException,
          'Existe programações não validadas',
        );
        expect(mockFindScheduleByIdRepository.findById).not.toHaveBeenCalled();
        expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      },
    );

    it('should run inside a transaction without options', async () => {
      await service.validate(DATA);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('should validate the schedules with the full payload', async () => {
      await service.validate(DATA);

      expect(mockRepository.validate).toHaveBeenCalledWith(DATA, mockTx);
    });

    it('should set every distinct work as VALIDADA, once each', async () => {
      await service.validate(DATA);

      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledTimes(
        2,
      );
      expect(
        mockStatusFlowRepository.updateStatusWorks,
      ).toHaveBeenNthCalledWith(1, WorkStatus.VALIDADA, 10, mockTx);
      expect(
        mockStatusFlowRepository.updateStatusWorks,
      ).toHaveBeenNthCalledWith(2, WorkStatus.VALIDADA, 20, mockTx);
      expect(order(mockRepository.validate)).toBeLessThan(
        order(mockStatusFlowRepository.updateStatusWorks),
      );
    });

    it('should wrap repository errors in InternalServerErrorException', async () => {
      mockRepository.validate.mockRejectedValueOnce(new Error('db down'));

      await expectError(service.validate(DATA), InternalServerErrorException);
      expect(mockStatusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
    });

    it('should also wrap HttpExceptions thrown inside the transaction (current behaviour)', async () => {
      mockStatusFlowRepository.updateStatusWorks.mockRejectedValueOnce(
        new NotFoundException('Obra não encontrada'),
      );

      await expectError(service.validate(DATA), InternalServerErrorException);
    });

    it('should NOT wrap guard errors (they run outside the try)', async () => {
      await expectError(
        service.validate([{ id: 99, validate: true }] as any),
        NotFoundException,
      );
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // confirm
  // ════════════════════════════════════════════════════════════════════
  describe('confirm', () => {
    const DATA = [
      { id: 1, confirm: true },
      { id: 2, confirm: false },
      { id: 3, confirm: true },
    ] as any[];
    const CONFIRMED = [DATA[0], DATA[2]];

    it.each([
      ['empty list', []],
      ['no item with confirm = true', [{ id: 1, confirm: false }, { id: 2 }]],
    ])('should throw BadRequestException when %s', async (_, data) => {
      await expectError(
        service.confirm(data as any),
        BadRequestException,
        'Nenhuma programação para ser confirmada',
      );
      expect(mockFindScheduleByIdRepository.findById).not.toHaveBeenCalled();
    });

    it('should throw TypeError when data is undefined (current behaviour)', async () => {
      await expect(service.confirm(undefined as any)).rejects.toThrow(
        TypeError,
      );
    });

    it('should load only the confirmed schedules', async () => {
      await service.confirm(DATA);

      const loadedIds = mockFindScheduleByIdRepository.findById.mock.calls.map(
        ([id]) => id,
      );
      expect(loadedIds).toEqual([1, 3]);
    });

    it('should map every loaded schedule to the domain and require the DP number', async () => {
      await service.confirm(DATA);

      expect(toDomainSpy).toHaveBeenCalledTimes(2);
      expect(toDomainSpy).toHaveBeenNthCalledWith(1, schedulesDb[1]);
      expect(toDomainSpy).toHaveBeenNthCalledWith(2, schedulesDb[3]);
      expect(requireDpNumber).toHaveBeenCalledTimes(2);
      expect(order(requireDpNumber)).toBeLessThan(
        order(mockPrisma.$transaction),
      );
    });

    it('should throw BadRequestException when the mapper fails', async () => {
      toDomainSpy.mockImplementationOnce(() => {
        throw new Error('Data de programação inválida');
      });

      await expectError(
        service.confirm(DATA),
        BadRequestException,
        'Erro ao criar programação: Data de programação inválida',
      );
      expect(requireDpNumber).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should propagate the requireDpNumber error as-is and not open the transaction', async () => {
      const error = new BadRequestException('Número de DP obrigatório');
      requireDpNumber.mockImplementationOnce(() => {
        throw error;
      });

      await expect(service.confirm(DATA)).rejects.toBe(error);
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
      expect(mockRepository.confirm).not.toHaveBeenCalled();
    });

    it('should run inside a transaction without options', async () => {
      await service.confirm(DATA);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('should confirm only the confirmed items', async () => {
      await service.confirm(DATA);

      expect(mockRepository.confirm).toHaveBeenCalledWith(CONFIRMED, mockTx);
    });

    it('should set every distinct work as CONFIRMADA, once each', async () => {
      await service.confirm([
        { id: 1, confirm: true },
        { id: 2, confirm: true },
        { id: 3, confirm: true },
      ] as any);

      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledTimes(
        2,
      );
      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        WorkStatus.CONFIRMADA,
        10,
        mockTx,
      );
      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        WorkStatus.CONFIRMADA,
        20,
        mockTx,
      );
      expect(order(mockRepository.confirm)).toBeLessThan(
        order(mockStatusFlowRepository.updateStatusWorks),
      );
    });

    it('should wrap transaction errors in InternalServerErrorException', async () => {
      mockRepository.confirm.mockRejectedValueOnce(new Error('db down'));

      await expectError(service.confirm(DATA), InternalServerErrorException);
      expect(mockStatusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // reject
  // ════════════════════════════════════════════════════════════════════
  describe('reject', () => {
    const DATA = [
      { id: 1, reason: 'Falta equipa' },
      { id: 3, reason: 'Material indisponível' },
    ] as any[];

    it('should do nothing when data is empty', async () => {
      await expect(service.reject([])).resolves.toBeUndefined();

      expect(mockFindScheduleByIdRepository.findById).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException when a schedule does not exist', async () => {
      await expectError(
        service.reject([{ id: 1 }, { id: 9 }] as any),
        NotFoundException,
        'Programação não encontrada: 9.',
      );
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ConflictException for finalized point-by-point schedules', async () => {
      pointByPointWorkIds.add(10);
      schedulesDb[1] = buildSchedule(1, 10, FINALIZED_STATUS);

      await expectError(
        service.reject(DATA),
        ConflictException,
        'Programação já finalizada não pode mudar de etapa: 1.',
      );
      expect(mockRepository.reject).not.toHaveBeenCalled();
    });

    it('should allow rejecting point-by-point schedules without services', async () => {
      pointByPointWorkIds.add(10);
      schedulesWithServices.clear();

      await service.reject(DATA);

      expect(mockPrisma.programacoes_servicos.findMany).not.toHaveBeenCalled();
      expect(mockRepository.reject).toHaveBeenCalledTimes(2);
    });

    it('should run inside a transaction without options', async () => {
      await service.reject(DATA);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('should reload each schedule inside the loop, without tx (current behaviour)', async () => {
      await service.reject(DATA);

      // 2 no loadSchedules + 2 dentro da transação
      expect(mockFindScheduleByIdRepository.findById).toHaveBeenCalledTimes(4);
      mockFindScheduleByIdRepository.findById.mock.calls.forEach((call) =>
        expect(call).toHaveLength(1),
      );
    });

    it('should reject each schedule with the item merged with the schedule data', async () => {
      await service.reject(DATA);

      expect(mockRepository.reject).toHaveBeenNthCalledWith(
        1,
        { ...DATA[0], ...schedulesDb[1] },
        mockTx,
      );
      expect(mockRepository.reject).toHaveBeenNthCalledWith(
        2,
        { ...DATA[1], ...schedulesDb[3] },
        mockTx,
      );
    });

    it('should let schedule fields override item fields with the same name (current behaviour)', async () => {
      await service.reject([{ id: 1, id_obra: 999, reason: 'x' }] as any);

      const [merged] = mockRepository.reject.mock.calls[0];
      expect(merged.id_obra).toBe(10);
      expect(merged.reason).toBe('x');
    });

    it('should set the work of each schedule as SERVICOS_REAGENDADOS', async () => {
      await service.reject(DATA);

      expect(
        mockStatusFlowRepository.updateStatusWorks,
      ).toHaveBeenNthCalledWith(1, WorkStatus.SERVICOS_REAGENDADOS, 10, mockTx);
      expect(
        mockStatusFlowRepository.updateStatusWorks,
      ).toHaveBeenNthCalledWith(2, WorkStatus.SERVICOS_REAGENDADOS, 20, mockTx);
    });

    it('should update the work status once per item, not per distinct work (current behaviour)', async () => {
      await service.reject([{ id: 1 }, { id: 2 }] as any); // ambas da obra 10

      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledTimes(
        2,
      );
      expect(
        mockStatusFlowRepository.updateStatusWorks,
      ).toHaveBeenNthCalledWith(2, WorkStatus.SERVICOS_REAGENDADOS, 10, mockTx);
    });

    it('should process items sequentially: reject → status, item by item', async () => {
      await service.reject(DATA);

      const [reject1, reject2] = mockRepository.reject.mock.invocationCallOrder;
      const [status1, status2] =
        mockStatusFlowRepository.updateStatusWorks.mock.invocationCallOrder;

      expect(reject1).toBeLessThan(status1);
      expect(status1).toBeLessThan(reject2);
      expect(reject2).toBeLessThan(status2);
    });

    it('should propagate errors as-is (not wrapped) and stop processing', async () => {
      const error = new Error('db down');
      mockRepository.reject.mockRejectedValueOnce(error);

      await expect(service.reject(DATA)).rejects.toBe(error);
      expect(mockRepository.reject).toHaveBeenCalledTimes(1);
      expect(mockStatusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
    });

    it('should throw TypeError when the schedule disappears between load and transaction (current behaviour)', async () => {
      mockFindScheduleByIdRepository.findById
        .mockResolvedValueOnce(schedulesDb[1]) // loadSchedules
        .mockResolvedValueOnce(null); // dentro da transação

      await expect(service.reject([{ id: 1 }] as any)).rejects.toThrow(
        TypeError,
      );
      expect(mockStatusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
    });
  });
});
