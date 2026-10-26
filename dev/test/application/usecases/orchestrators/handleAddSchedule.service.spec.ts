import type { Mock } from 'vitest';
import { HandleAddScheduleService } from 'src/application/usecases/orchestrators/handleAddSchedule.service';
import { WorksServicesService } from 'src/application/usecases/services/worksServices.service';
import { AddSchedulesService } from 'src/application/usecases/works/schedule/addSchedules.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  CreateScheduleWithServicesDTO,
  SchedulesDataDTO,
} from 'src/interface/dtos/scheduleDTO';

import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'src/generated/prisma/client';

// ─── Constantes e helpers ────────────────────────────────────────────
const SCHEDULE_STATUS_ID = 43;

const order = (fn: Mock) => fn.mock.invocationCallOrder[0];

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

const MSG_NOT_PONTO_A_PONTO =
  'Esta obra não segue a programação ponto a ponto. Use a programação tradicional.';
const MSG_IS_PONTO_A_PONTO =
  'Esta obra segue a programação ponto a ponto. Use o fluxo de programação com serviços.';

describe('HandleAddScheduleService', () => {
  let service: HandleAddScheduleService;

  const mockTx = {
    obras: { findUnique: vi.fn() },
  };
  const tx = mockTx as unknown as Prisma.TransactionClient;

  const mockPrisma = {
    $transaction: vi.fn((cb: (tx: Prisma.TransactionClient) => unknown) =>
      cb(tx),
    ),
  };

  const mockStatusFlowRepository = {
    updateScheduleStatus: vi.fn(),
    updateStatusWorks: vi.fn(),
  };

  const mockWorksServicesService = { scheduleServices: vi.fn() };
  const mockAddScheduleService = { add: vi.fn() };

  /** Define o modo da obra devolvido pelo tx.obras.findUnique */
  const mockWork = (programacao_ponto_a_ponto: boolean | null) =>
    mockTx.obras.findUnique.mockResolvedValue({ programacao_ponto_a_ponto });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleAddScheduleService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: STATUS_FLOW_REPOSITORY, useValue: mockStatusFlowRepository },
        { provide: WorksServicesService, useValue: mockWorksServicesService },
        { provide: AddSchedulesService, useValue: mockAddScheduleService },
      ],
    }).compile();

    service = module.get(HandleAddScheduleService);
  });

  afterEach(vi.clearAllMocks);

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ════════════════════════════════════════════════════════════════════
  // add (programação tradicional)
  // ════════════════════════════════════════════════════════════════════
  describe('add', () => {
    const WORK_ID = 10;
    const DATA = {
      idWork: WORK_ID,
      prog: 25,
      dataProg: '2026-10-20',
    } as unknown as SchedulesDataDTO;

    beforeEach(() => {
      mockWork(false);
      mockAddScheduleService.add.mockResolvedValue(3);
    });

    it('should run inside a transaction without options', async () => {
      await service.add(DATA);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('should check the work mode using the transaction', async () => {
      await service.add(DATA);

      expect(mockTx.obras.findUnique).toHaveBeenCalledWith({
        where: { id: WORK_ID },
        select: { programacao_ponto_a_ponto: true },
      });
    });

    it('should create the schedule with the original data and update the work status', async () => {
      await service.add(DATA);

      expect(mockAddScheduleService.add).toHaveBeenCalledWith(DATA, tx);
      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        SCHEDULE_STATUS_ID,
        WORK_ID,
        tx,
      );
    });

    it('should run the steps in order: check → create → status', async () => {
      await service.add(DATA);

      const steps = [
        order(mockTx.obras.findUnique),
        order(mockAddScheduleService.add),
        order(mockStatusFlowRepository.updateStatusWorks),
      ];
      expect(steps).toEqual([...steps].sort((a, b) => a - b));
    });

    it('should not schedule services (traditional flow)', async () => {
      await service.add(DATA);

      expect(mockWorksServicesService.scheduleServices).not.toHaveBeenCalled();
    });

    it('should resolve with undefined', async () => {
      await expect(service.add(DATA)).resolves.toBeUndefined();
    });

    it.each([[false], [null], [undefined]])(
      'should accept a work with programacao_ponto_a_ponto = %p',
      async (value) => {
        mockTx.obras.findUnique.mockResolvedValueOnce({
          programacao_ponto_a_ponto: value,
        });

        await service.add(DATA);

        expect(mockAddScheduleService.add).toHaveBeenCalled();
      },
    );

    it('should throw NotFoundException when the work does not exist', async () => {
      mockTx.obras.findUnique.mockResolvedValueOnce(null);

      await expectError(
        service.add(DATA),
        NotFoundException,
        'Obra não encontrada.',
      );
      expect(mockAddScheduleService.add).not.toHaveBeenCalled();
      expect(mockStatusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
    });

    it('should throw ConflictException when the work is ponto a ponto', async () => {
      mockWork(true);

      await expectError(
        service.add(DATA),
        ConflictException,
        MSG_IS_PONTO_A_PONTO,
      );
      expect(mockAddScheduleService.add).not.toHaveBeenCalled();
      expect(mockStatusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
    });

    it('should not update the work status when schedule creation fails', async () => {
      mockAddScheduleService.add.mockRejectedValueOnce(
        new Error('insert failed'),
      );

      await expect(service.add(DATA)).rejects.toThrow('insert failed');
      expect(mockStatusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
    });

    it('should propagate errors from updateStatusWorks', async () => {
      mockStatusFlowRepository.updateStatusWorks.mockRejectedValueOnce(
        new Error('status failed'),
      );

      await expect(service.add(DATA)).rejects.toThrow('status failed');
    });
  });

  // ════════════════════════════════════════════════════════════════════
  // newAdd (programação ponto a ponto com serviços)
  // ════════════════════════════════════════════════════════════════════
  describe('newAdd', () => {
    const WORK_ID = 10;
    const NEW_SCHEDULE_ID = 77;

    const SCHEDULE = { idWork: WORK_ID, prog: 25, dataProg: '2026-10-20' };
    const SERVICES = [
      { id: 100, idTeam: 1, prog: 5 },
      { id: 101, idTeam: 2, prog: 3, additional: 1 },
    ];

    const buildData = (overrides: Record<string, unknown> = {}) =>
      ({
        schedule: SCHEDULE,
        services: SERVICES,
        ...overrides,
      }) as unknown as CreateScheduleWithServicesDTO;

    beforeEach(() => {
      mockWork(true);
      mockAddScheduleService.add.mockResolvedValue(NEW_SCHEDULE_ID);
    });

    it('should run inside a transaction without options', async () => {
      await service.newAdd(buildData());

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.$transaction).toHaveBeenCalledWith(
        expect.any(Function),
      );
    });

    it('should check the work mode of schedule.idWork', async () => {
      await service.newAdd(buildData());

      expect(mockTx.obras.findUnique).toHaveBeenCalledWith({
        where: { id: WORK_ID },
        select: { programacao_ponto_a_ponto: true },
      });
    });

    it('should create the schedule with prog forced to 0', async () => {
      await service.newAdd(buildData());

      expect(mockAddScheduleService.add).toHaveBeenCalledWith(
        { ...SCHEDULE, prog: 0 },
        tx,
      );
    });

    it('should not mutate the original schedule object', async () => {
      const schedule = { ...SCHEDULE };

      await service.newAdd(buildData({ schedule }));

      expect(schedule.prog).toBe(25);
    });

    it('should update the work status with SCHEDULE_STATUS_ID', async () => {
      await service.newAdd(buildData());

      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        SCHEDULE_STATUS_ID,
        WORK_ID,
        tx,
      );
    });

    it('should schedule services with the new schedule id attached, reusing the tx', async () => {
      await service.newAdd(buildData());

      expect(mockWorksServicesService.scheduleServices).toHaveBeenCalledWith(
        WORK_ID,
        [
          { id: 100, idTeam: 1, prog: 5, idSchedule: NEW_SCHEDULE_ID },
          {
            id: 101,
            idTeam: 2,
            prog: 3,
            additional: 1,
            idSchedule: NEW_SCHEDULE_ID,
          },
        ],
        tx,
      );
    });

    it('should override any idSchedule sent by the client', async () => {
      await service.newAdd(
        buildData({
          services: [{ id: 100, idTeam: 1, prog: 5, idSchedule: 999 }],
        }),
      );

      const [, services] =
        mockWorksServicesService.scheduleServices.mock.calls[0];
      expect(services).toEqual([
        { id: 100, idTeam: 1, prog: 5, idSchedule: NEW_SCHEDULE_ID },
      ]);
    });

    it('should not mutate the original services array', async () => {
      const services = [{ id: 100, idTeam: 1, prog: 5 }];

      await service.newAdd(buildData({ services }));

      expect(services[0]).not.toHaveProperty('idSchedule');
    });

    it('should run the steps in order: check → create → status → services', async () => {
      await service.newAdd(buildData());

      const steps = [
        order(mockTx.obras.findUnique),
        order(mockAddScheduleService.add),
        order(mockStatusFlowRepository.updateStatusWorks),
        order(mockWorksServicesService.scheduleServices),
      ];
      expect(steps).toEqual([...steps].sort((a, b) => a - b));
    });

    it('should resolve with 1 (current behaviour, not the schedule id)', async () => {
      await expect(service.newAdd(buildData())).resolves.toBe(1);
    });

    it('should throw NotFoundException when the work does not exist', async () => {
      mockTx.obras.findUnique.mockResolvedValueOnce(null);

      await expectError(
        service.newAdd(buildData()),
        NotFoundException,
        'Obra não encontrada.',
      );
      expect(mockAddScheduleService.add).not.toHaveBeenCalled();
      expect(mockWorksServicesService.scheduleServices).not.toHaveBeenCalled();
    });

    it.each([[false], [null], [undefined]])(
      'should throw ConflictException when programacao_ponto_a_ponto = %p',
      async (value) => {
        mockTx.obras.findUnique.mockResolvedValueOnce({
          programacao_ponto_a_ponto: value,
        });

        await expectError(
          service.newAdd(buildData()),
          ConflictException,
          MSG_NOT_PONTO_A_PONTO,
        );
        expect(mockAddScheduleService.add).not.toHaveBeenCalled();
        expect(
          mockStatusFlowRepository.updateStatusWorks,
        ).not.toHaveBeenCalled();
        expect(
          mockWorksServicesService.scheduleServices,
        ).not.toHaveBeenCalled();
      },
    );

    it('should not continue when schedule creation fails', async () => {
      mockAddScheduleService.add.mockRejectedValueOnce(
        new Error('insert failed'),
      );

      await expect(service.newAdd(buildData())).rejects.toThrow(
        'insert failed',
      );
      expect(mockStatusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
      expect(mockWorksServicesService.scheduleServices).not.toHaveBeenCalled();
    });

    it('should propagate errors from scheduleServices (transaction rolls back)', async () => {
      const error = new ConflictException('Saldo insuficiente');
      mockWorksServicesService.scheduleServices.mockRejectedValueOnce(error);

      await expect(service.newAdd(buildData())).rejects.toBe(error);
    });

    it('should delegate the empty services validation to scheduleServices', async () => {
      await service.newAdd(buildData({ services: [] }));

      expect(mockWorksServicesService.scheduleServices).toHaveBeenCalledWith(
        WORK_ID,
        [],
        tx,
      );
    });

    it('should throw TypeError when services is undefined (current behaviour)', async () => {
      await expect(
        service.newAdd(buildData({ services: undefined })),
      ).rejects.toThrow(TypeError);
      expect(mockWorksServicesService.scheduleServices).not.toHaveBeenCalled();
    });
  });
});
