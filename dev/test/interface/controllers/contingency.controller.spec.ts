// contingency.controller.spec.ts

import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';

import { ContingencyService } from 'src/application/usecases/contingency.service';
import {
  CreateContingencyDTO,
  DashboardFilterDTO,
} from 'src/interface/dtos/contingencyDTO';
import { ContingencyController } from 'src/interface/controllers/contingency.controller';

// ─── Factories ────────────────────────────────────────────────────────────────
// Factories isoladas evitam acoplamento entre testes e facilitam manutenção.

const makeCreateContingencyDTO = (
  overrides: Partial<CreateContingencyDTO> = {},
): CreateContingencyDTO =>
  ({
    // preencha aqui os campos reais do DTO com valores default sensatos
    ...overrides,
  }) as CreateContingencyDTO;

const makeDashboardFilterDTO = (
  overrides: Partial<DashboardFilterDTO> = {},
): DashboardFilterDTO =>
  ({
    // preencha aqui os campos reais do DTO com valores default sensatos
    ...overrides,
  }) as DashboardFilterDTO;

const makeDashboardResponse = () => ({
  totalItems: 42,
  items: [{ id: 1, status: 'ACTIVE' }],
});

// ─── Mock do Service ──────────────────────────────────────────────────────────
// Mock mínimo e tipado — apenas os métodos consumidos pelo controller.

type MockContingencyService = Pick<
  ContingencyService,
  'create' | 'getDashboard'
>;

const makeServiceMock = (): Record<
  keyof MockContingencyService,
  jest.Mock
> => ({
  create: jest.fn().mockResolvedValue(undefined),
  getDashboard: jest.fn().mockResolvedValue(makeDashboardResponse()),
});

// ─── Suíte ────────────────────────────────────────────────────────────────────

describe('ContingencyController', () => {
  let controller: ContingencyController;
  let service: ReturnType<typeof makeServiceMock>;

  beforeEach(async () => {
    service = makeServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContingencyController],
      providers: [
        {
          provide: ContingencyService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<ContingencyController>(ContingencyController);
  });

  afterEach(() => jest.clearAllMocks());

  // ── Sanity ────────────────────────────────────────────────────────────────

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ── POST / (create) ───────────────────────────────────────────────────────

  describe('create', () => {
    it('should delegate to ContingencyService.create with the received DTO', async () => {
      const dto = makeCreateContingencyDTO();

      await controller.create(dto);

      expect(service.create).toHaveBeenCalledTimes(1);
      expect(service.create).toHaveBeenCalledWith(dto);
    });

    it('should return CREATED status and success message', async () => {
      const result = await controller.create(makeCreateContingencyDTO());

      expect(result).toStrictEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Resposta registrada com sucesso',
      });
    });

    it('should propagate service exceptions without catching them', async () => {
      const error = new Error('database unavailable');
      service.create.mockRejectedValueOnce(error);

      await expect(
        controller.create(makeCreateContingencyDTO()),
      ).rejects.toThrow(error);
    });

    it('should await the service before returning (no fire-and-forget)', async () => {
      // Garante que o controller realmente aguarda a Promise do service.
      const executionOrder: string[] = [];

      service.create.mockImplementationOnce(async () => {
        executionOrder.push('service');
      });

      await controller.create(makeCreateContingencyDTO());
      executionOrder.push('controller');

      expect(executionOrder).toStrictEqual(['service', 'controller']);
    });
  });

  // ── GET /dashboard ────────────────────────────────────────────────────────

  describe('getDashboard', () => {
    it('should delegate to ContingencyService.getDashboard with the received query', async () => {
      const query = makeDashboardFilterDTO();

      await controller.getDashboard(query);

      expect(service.getDashboard).toHaveBeenCalledTimes(1);
      expect(service.getDashboard).toHaveBeenCalledWith(query);
    });

    it('should return OK status, success message and service data', async () => {
      const dashboardData = makeDashboardResponse();
      service.getDashboard.mockResolvedValueOnce(dashboardData);

      const result = await controller.getDashboard(makeDashboardFilterDTO());

      expect(result).toStrictEqual({
        statusCode: HttpStatus.OK,
        message: 'Dashboard de contingência retornado com sucesso',
        data: dashboardData,
      });
    });

    it('should return the exact reference returned by the service (no mutation)', async () => {
      const dashboardData = makeDashboardResponse();
      service.getDashboard.mockResolvedValueOnce(dashboardData);

      const result = await controller.getDashboard(makeDashboardFilterDTO());

      // Referência idêntica — controller não clona nem transforma o payload.
      expect(result.data).toBe(dashboardData);
    });

    it('should propagate service exceptions without catching them', async () => {
      const error = new Error('timeout');
      service.getDashboard.mockRejectedValueOnce(error);

      await expect(
        controller.getDashboard(makeDashboardFilterDTO()),
      ).rejects.toThrow(error);
    });

    it('should handle empty dashboard response gracefully', async () => {
      const emptyResponse = { totalItems: 0, items: [] };
      service.getDashboard.mockResolvedValueOnce(emptyResponse);

      const result = await controller.getDashboard(makeDashboardFilterDTO());

      expect(result).toStrictEqual({
        statusCode: HttpStatus.OK,
        message: 'Dashboard de contingência retornado com sucesso',
        data: emptyResponse,
      });
    });
  });
});
