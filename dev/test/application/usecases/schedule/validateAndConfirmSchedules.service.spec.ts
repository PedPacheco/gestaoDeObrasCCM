import {
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ValidateConfirmAndRejectSchedulesService } from 'src/application/usecases/works/schedule/validateAndConfirmSchedules.service';
import type {
  ConfirmSchedulesDTO,
  RejectScheduleDTO,
  ValidateSchedulesDTO,
} from 'src/interface/dtos/scheduleDTO';
import { WorkStatus } from 'src/utils/pointByPoint/serviceType.utils';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
// ajuste o caminho

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const { FINALIZED_STATUS, ACTIVE_STATUS } = vi.hoisted(() => ({
  FINALIZED_STATUS: 99,
  ACTIVE_STATUS: 1,
}));

vi.mock('src/utils/pointByPoint/serviceType.utils', () => ({
  WorkStatus: {
    VALIDADA: 'VALIDADA',
    CONFIRMADA: 'CONFIRMADA',
    SERVICOS_REAGENDADOS: 'SERVICOS_REAGENDADOS',
  },
  FINALIZED_SCHEDULE_STATUSES: [FINALIZED_STATUS],
}));

vi.mock('src/infra/prisma/prisma.service', () => ({
  PrismaService: class {},
}));

vi.mock(
  'src/infra/repositories/works/schedule/findScheduleByIdRepository',
  () => ({ FindScheduleByIdRepository: class {} }),
);

// ---------------------------------------------------------------------------
// Test doubles & helpers
// ---------------------------------------------------------------------------

interface ScheduleStub {
  id: number;
  workId: number;
  statusId: number;
  requireDpNumber: Mock;
}

const tx = { __tx: 'transaction-client' };

let validateRepo: { validate: Mock; confirm: Mock; reject: Mock };
let statusFlowRepo: { updateStatusWorks: Mock };
let findRepo: { findById: Mock };
let prisma: {
  $transaction: Mock;
  obras: { findMany: Mock };
  programacoes_servicos: { findMany: Mock };
};
let service: ValidateConfirmAndRejectSchedulesService;

function makeSchedule(
  overrides: Partial<ScheduleStub> & { id: number },
): ScheduleStub {
  return {
    workId: 10,
    statusId: ACTIVE_STATUS,
    requireDpNumber: vi.fn(),
    ...overrides,
  };
}

const validateItem = (id: number, validate = true) =>
  ({ id, validate }) as unknown as ValidateSchedulesDTO;

const confirmItem = (id: number, confirm = true) =>
  ({ id, confirm }) as unknown as ConfirmSchedulesDTO;

const rejectItem = (id: number, extra: Record<string, unknown> = {}) =>
  ({ id, ...extra }) as unknown as RejectScheduleDTO;

/** Makes findById resolve the given schedules and null for any other id. */
function givenSchedules(...schedules: ScheduleStub[]) {
  const byId = new Map(schedules.map((s) => [s.id, s]));
  findRepo.findById.mockImplementation(
    async (id: number) => byId.get(id) ?? null,
  );
}

/** Flags the given work ids as point-by-point; every other work is traditional. */
function givenPointByPointWorks(...workIds: number[]) {
  prisma.obras.findMany.mockImplementation(
    async ({ where }: { where: { id: { in: number[] } } }) =>
      where.id.in.map((id) => ({
        id,
        programacao_ponto_a_ponto: workIds.includes(id),
      })),
  );
}

function givenSchedulesWithServices(...scheduleIds: number[]) {
  prisma.programacoes_servicos.findMany.mockResolvedValue(
    scheduleIds.map((id) => ({ id_programacao: id })),
  );
}

async function catchError(promise: Promise<unknown>): Promise<Error> {
  try {
    await promise;
  } catch (error) {
    return error as Error;
  }
  throw new Error('Expected the promise to reject, but it resolved');
}

beforeEach(() => {
  validateRepo = {
    validate: vi.fn().mockResolvedValue(undefined),
    confirm: vi.fn().mockResolvedValue(undefined),
    reject: vi.fn().mockResolvedValue(undefined),
  };
  statusFlowRepo = { updateStatusWorks: vi.fn().mockResolvedValue(undefined) };
  findRepo = { findById: vi.fn().mockResolvedValue(null) };
  prisma = {
    $transaction: vi.fn(async (cb: (client: unknown) => Promise<unknown>) =>
      cb(tx),
    ),
    obras: { findMany: vi.fn().mockResolvedValue([]) },
    programacoes_servicos: { findMany: vi.fn().mockResolvedValue([]) },
  };

  service = new ValidateConfirmAndRejectSchedulesService(
    validateRepo as never,
    statusFlowRepo as never,
    findRepo as never,
    prisma as never,
  );
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ValidateConfirmAndRejectSchedulesService', () => {
  describe('validate', () => {
    it.each([
      ['null', null],
      ['undefined', undefined],
      ['an empty array', []],
    ])(
      'throws BadRequestException when the payload is %s',
      async (_, payload) => {
        const error = await catchError(service.validate(payload as never));

        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.message).toBe(
          'Nenhuma programação foi enviada para ser validada',
        );
        expect(findRepo.findById).not.toHaveBeenCalled();
      },
    );

    it('throws BadRequestException when at least one schedule is not flagged as validated', async () => {
      const error = await catchError(
        service.validate([validateItem(1), validateItem(2, false)]),
      );

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe('Existe programações não validadas');
      expect(findRepo.findById).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException listing every schedule id that does not exist', async () => {
      givenSchedules(makeSchedule({ id: 1 }));

      const error = await catchError(
        service.validate([validateItem(1), validateItem(2), validateItem(3)]),
      );

      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe('Programação não encontrada: 2, 3.');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('validates the schedules and moves each distinct work to VALIDADA within a single transaction', async () => {
      givenSchedules(
        makeSchedule({ id: 1, workId: 10 }),
        makeSchedule({ id: 2, workId: 10 }),
        makeSchedule({ id: 3, workId: 20 }),
      );
      const payload = [validateItem(1), validateItem(2), validateItem(3)];

      await expect(service.validate(payload)).resolves.toBeUndefined();

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(validateRepo.validate).toHaveBeenCalledWith(payload, tx);
      expect(statusFlowRepo.updateStatusWorks).toHaveBeenCalledTimes(2);
      expect(statusFlowRepo.updateStatusWorks).toHaveBeenNthCalledWith(
        1,
        WorkStatus.VALIDADA,
        10,
        tx,
      );
      expect(statusFlowRepo.updateStatusWorks).toHaveBeenNthCalledWith(
        2,
        WorkStatus.VALIDADA,
        20,
        tx,
      );
    });

    it('skips the point-by-point guards when none of the works use point-by-point scheduling', async () => {
      givenSchedules(makeSchedule({ id: 1, statusId: FINALIZED_STATUS }));
      givenPointByPointWorks();

      await expect(
        service.validate([validateItem(1)]),
      ).resolves.toBeUndefined();

      expect(prisma.obras.findMany).toHaveBeenCalledWith({
        where: { id: { in: [10] } },
        select: { id: true, programacao_ponto_a_ponto: true },
      });
      expect(prisma.programacoes_servicos.findMany).not.toHaveBeenCalled();
    });

    it('does not open a transaction when a point-by-point guard fails', async () => {
      givenSchedules(makeSchedule({ id: 1, statusId: FINALIZED_STATUS }));
      givenPointByPointWorks(10);

      const error = await catchError(service.validate([validateItem(1)]));

      expect(error).toBeInstanceOf(ConflictException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('wraps repository failures inside the transaction in InternalServerErrorException', async () => {
      givenSchedules(makeSchedule({ id: 1 }));
      validateRepo.validate.mockRejectedValue(new Error('db down'));

      const error = await catchError(service.validate([validateItem(1)]));

      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect(statusFlowRepo.updateStatusWorks).not.toHaveBeenCalled();
    });

    it('wraps status flow failures in InternalServerErrorException', async () => {
      givenSchedules(makeSchedule({ id: 1 }));
      statusFlowRepo.updateStatusWorks.mockRejectedValue(
        new Error('status flow failed'),
      );

      const error = await catchError(service.validate([validateItem(1)]));

      expect(error).toBeInstanceOf(InternalServerErrorException);
    });
  });

  describe('confirm', () => {
    it.each([
      ['the payload is empty', []],
      [
        'no schedule is flagged with confirm=true',
        [confirmItem(1, false), confirmItem(2, false)],
      ],
    ])('throws BadRequestException when %s', async (_, payload) => {
      const error = await catchError(service.confirm(payload));

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe('Nenhuma programação para ser confirmada');
      expect(findRepo.findById).not.toHaveBeenCalled();
    });

    it('only loads and confirms the schedules flagged with confirm=true', async () => {
      givenSchedules(
        makeSchedule({ id: 1, workId: 10 }),
        makeSchedule({ id: 3, workId: 20 }),
      );
      const confirmed = [confirmItem(1), confirmItem(3)];

      await service.confirm([
        confirmed[0],
        confirmItem(2, false),
        confirmed[1],
      ]);

      expect(findRepo.findById).toHaveBeenCalledTimes(2);
      expect(findRepo.findById).toHaveBeenCalledWith(1);
      expect(findRepo.findById).toHaveBeenCalledWith(3);
      expect(validateRepo.confirm).toHaveBeenCalledWith(confirmed, tx);
    });

    it('moves each distinct work to CONFIRMADA within a single transaction', async () => {
      givenSchedules(
        makeSchedule({ id: 1, workId: 10 }),
        makeSchedule({ id: 2, workId: 10 }),
        makeSchedule({ id: 3, workId: 20 }),
      );

      await service.confirm([confirmItem(1), confirmItem(2), confirmItem(3)]);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(statusFlowRepo.updateStatusWorks).toHaveBeenCalledTimes(2);
      expect(statusFlowRepo.updateStatusWorks).toHaveBeenCalledWith(
        WorkStatus.CONFIRMADA,
        10,
        tx,
      );
      expect(statusFlowRepo.updateStatusWorks).toHaveBeenCalledWith(
        WorkStatus.CONFIRMADA,
        20,
        tx,
      );
    });

    it('requires a DP number on every confirmed schedule before persisting', async () => {
      const first = makeSchedule({ id: 1 });
      const second = makeSchedule({ id: 2 });
      givenSchedules(first, second);

      await service.confirm([confirmItem(1), confirmItem(2)]);

      expect(first.requireDpNumber).toHaveBeenCalledTimes(1);
      expect(second.requireDpNumber).toHaveBeenCalledTimes(1);
    });

    it('propagates the domain error unwrapped and skips persistence when a schedule has no DP number', async () => {
      const domainError = new BadRequestException('Número de DP obrigatório');
      givenSchedules(
        makeSchedule({
          id: 1,
          requireDpNumber: vi.fn(() => {
            throw domainError;
          }),
        }),
      );

      const error = await catchError(service.confirm([confirmItem(1)]));

      expect(error).toBe(domainError);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when a confirmed schedule does not exist', async () => {
      givenSchedules();

      const error = await catchError(service.confirm([confirmItem(7)]));

      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe('Programação não encontrada: 7.');
    });

    it('wraps transaction failures in InternalServerErrorException', async () => {
      givenSchedules(makeSchedule({ id: 1 }));
      validateRepo.confirm.mockRejectedValue(new Error('db down'));

      const error = await catchError(service.confirm([confirmItem(1)]));

      expect(error).toBeInstanceOf(InternalServerErrorException);
      expect(statusFlowRepo.updateStatusWorks).not.toHaveBeenCalled();
    });
  });

  describe('reject', () => {
    it('returns early without touching the database when no schedules are sent', async () => {
      await expect(service.reject([])).resolves.toBeUndefined();

      expect(findRepo.findById).not.toHaveBeenCalled();
      expect(prisma.obras.findMany).not.toHaveBeenCalled();
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('rejects each schedule merging the request payload with the stored schedule data', async () => {
      givenSchedules(makeSchedule({ id: 1, workId: 10 }));

      await service.reject([rejectItem(1, { reason: 'Falta de material' })]);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(validateRepo.reject).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          reason: 'Falta de material',
          workId: 10,
          statusId: ACTIVE_STATUS,
        }),
        tx,
      );
    });

    it('lets stored schedule fields override payload fields with the same name', async () => {
      givenSchedules(makeSchedule({ id: 1, workId: 10 }));

      await service.reject([rejectItem(1, { workId: 999 })]);

      expect(validateRepo.reject).toHaveBeenCalledWith(
        expect.objectContaining({ workId: 10 }),
        tx,
      );
    });

    it('moves the work to SERVICOS_REAGENDADOS once per rejected schedule', async () => {
      givenSchedules(
        makeSchedule({ id: 1, workId: 10 }),
        makeSchedule({ id: 2, workId: 10 }),
        makeSchedule({ id: 3, workId: 20 }),
      );

      await service.reject([rejectItem(1), rejectItem(2), rejectItem(3)]);

      expect(validateRepo.reject).toHaveBeenCalledTimes(3);
      expect(statusFlowRepo.updateStatusWorks).toHaveBeenCalledTimes(3);
      expect(statusFlowRepo.updateStatusWorks).toHaveBeenNthCalledWith(
        1,
        WorkStatus.SERVICOS_REAGENDADOS,
        10,
        tx,
      );
      expect(statusFlowRepo.updateStatusWorks).toHaveBeenNthCalledWith(
        2,
        WorkStatus.SERVICOS_REAGENDADOS,
        10,
        tx,
      );
      expect(statusFlowRepo.updateStatusWorks).toHaveBeenNthCalledWith(
        3,
        WorkStatus.SERVICOS_REAGENDADOS,
        20,
        tx,
      );
    });

    it('throws NotFoundException when a schedule to reject does not exist', async () => {
      givenSchedules(makeSchedule({ id: 1 }));

      const error = await catchError(
        service.reject([rejectItem(1), rejectItem(5)]),
      );

      expect(error).toBeInstanceOf(NotFoundException);
      expect(error.message).toBe('Programação não encontrada: 5.');
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('throws ConflictException when rejecting a finalized point-by-point schedule', async () => {
      givenSchedules(makeSchedule({ id: 1, statusId: FINALIZED_STATUS }));
      givenPointByPointWorks(10);

      const error = await catchError(service.reject([rejectItem(1)]));

      expect(error).toBeInstanceOf(ConflictException);
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('does not require programmed services to reject a point-by-point schedule', async () => {
      givenSchedules(makeSchedule({ id: 1 }));
      givenPointByPointWorks(10);

      await expect(service.reject([rejectItem(1)])).resolves.toBeUndefined();

      expect(prisma.programacoes_servicos.findMany).not.toHaveBeenCalled();
      expect(validateRepo.reject).toHaveBeenCalledTimes(1);
    });

    it('propagates transaction errors without wrapping them', async () => {
      givenSchedules(makeSchedule({ id: 1 }));
      validateRepo.reject.mockRejectedValue(new Error('boom'));

      const error = await catchError(service.reject([rejectItem(1)]));

      expect(error).not.toBeInstanceOf(InternalServerErrorException);
      expect(error.message).toBe('boom');
    });
  });

  describe.each([
    [
      'validate',
      (ids: number[]) => service.validate(ids.map((id) => validateItem(id))),
    ],
    [
      'confirm',
      (ids: number[]) => service.confirm(ids.map((id) => confirmItem(id))),
    ],
  ] as const)('point-by-point guards on %s', (_, run) => {
    it('queries the point-by-point flag only for the distinct work ids involved', async () => {
      givenSchedules(
        makeSchedule({ id: 1, workId: 10 }),
        makeSchedule({ id: 2, workId: 10 }),
        makeSchedule({ id: 3, workId: 20 }),
      );

      await run([1, 2, 3]);

      expect(prisma.obras.findMany).toHaveBeenCalledWith({
        where: { id: { in: [10, 20] } },
        select: { id: true, programacao_ponto_a_ponto: true },
      });
    });

    it('throws ConflictException listing every finalized point-by-point schedule', async () => {
      givenSchedules(
        makeSchedule({ id: 1, statusId: FINALIZED_STATUS }),
        makeSchedule({ id: 2, statusId: FINALIZED_STATUS }),
        makeSchedule({ id: 3 }),
      );
      givenPointByPointWorks(10);

      const error = await catchError(run([1, 2, 3]));

      expect(error).toBeInstanceOf(ConflictException);
      expect(error.message).toBe(
        'Programação já finalizada não pode mudar de etapa: 1, 2.',
      );
      expect(prisma.programacoes_servicos.findMany).not.toHaveBeenCalled();
    });

    it('throws BadRequestException listing point-by-point schedules without programmed services', async () => {
      givenSchedules(
        makeSchedule({ id: 1 }),
        makeSchedule({ id: 2 }),
        makeSchedule({ id: 3 }),
      );
      givenPointByPointWorks(10);
      givenSchedulesWithServices(2);

      const error = await catchError(run([1, 2, 3]));

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe('Programação sem serviços programados: 1, 3.');
      expect(prisma.programacoes_servicos.findMany).toHaveBeenCalledWith({
        where: { id_programacao: { in: [1, 2, 3] } },
        select: { id_programacao: true },
        distinct: ['id_programacao'],
      });
      expect(prisma.$transaction).not.toHaveBeenCalled();
    });

    it('allows the transition when every point-by-point schedule has programmed services', async () => {
      givenSchedules(makeSchedule({ id: 1 }), makeSchedule({ id: 2 }));
      givenPointByPointWorks(10);
      givenSchedulesWithServices(1, 2);

      await expect(run([1, 2])).resolves.toBeUndefined();

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('ignores schedules that belong to traditional works, even when finalized or without services', async () => {
      givenSchedules(
        makeSchedule({ id: 1, workId: 10 }),
        makeSchedule({ id: 2, workId: 20, statusId: FINALIZED_STATUS }),
      );
      givenPointByPointWorks(10);
      givenSchedulesWithServices(1);

      await expect(run([1, 2])).resolves.toBeUndefined();

      expect(prisma.programacoes_servicos.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id_programacao: { in: [1] } } }),
      );
    });
  });
});
