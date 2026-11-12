// contingency.controller.spec.ts
import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ContingencyService } from 'src/application/usecases/contingency.service';
import { ContingencyController } from 'src/interface/controllers/contingency.controller';
import {
  CreateContingencyDTO,
  DashboardFilterDTO,
} from 'src/interface/dtos/contingencyDTO';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

// ─── Factories ────────────────────────────────────────────────────────────────
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
type ContingencyServiceContract = Pick<
  ContingencyService,
  'create' | 'getDashboard'
>;

type ContingencyServiceMock = {
  [K in keyof ContingencyServiceContract]: Mock<ContingencyServiceContract[K]>;
};

const makeServiceMock = (): ContingencyServiceMock => ({
  create: vi.fn().mockResolvedValue(undefined),
  getDashboard: vi.fn().mockResolvedValue(makeDashboardResponse()),
});

// ─── Suíte ────────────────────────────────────────────────────────────────────
describe('ContingencyController', () => {
  let controller: ContingencyController;
  let service: ContingencyServiceMock;

  beforeEach(async () => {
    service = makeServiceMock();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContingencyController],
      providers: [{ provide: ContingencyService, useValue: service }],
    }).compile();

    controller = module.get(ContingencyController);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

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
      const executionOrder: string[] = [];

      service.create.mockImplementationOnce(async () => {
        // Atraso real (macrotask): se o controller não fizer await,
        // 'controller' será registado antes de 'service'.
        await new Promise((resolve) => setTimeout(resolve, 0));
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
      service.getDashboard.mockResolvedValueOnce(dashboardData as never);

      const result = await controller.getDashboard(makeDashboardFilterDTO());

      expect(result).toStrictEqual({
        statusCode: HttpStatus.OK,
        message: 'Dashboard de contingência retornado com sucesso',
        data: dashboardData,
      });
    });

    it('should return the exact reference returned by the service (no mutation)', async () => {
      const dashboardData = makeDashboardResponse();
      service.getDashboard.mockResolvedValueOnce(dashboardData as never);

      const result = await controller.getDashboard(makeDashboardFilterDTO());

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
      service.getDashboard.mockResolvedValueOnce(emptyResponse as never);

      const result = await controller.getDashboard(makeDashboardFilterDTO());

      expect(result).toStrictEqual({
        statusCode: HttpStatus.OK,
        message: 'Dashboard de contingência retornado com sucesso',
        data: emptyResponse,
      });
    });
  });
});
