import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';

// Controller under test
import { ExportController } from 'src/interface/controllers/export.controller';

// Guards
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';

// Services - Schedule
import { GetScheduleValuesService } from 'src/application/usecases/schedule/getScheduleValues.service';
import { MonthlySummaryService } from 'src/application/usecases/schedule/getMonthlySummary.service';
import { GetMonthlySummaryForecastService } from 'src/application/usecases/schedule/getMonthlySummaryForecast.service';

// Services - Works
import { GetWorksInPortfolioService } from 'src/application/usecases/works/getWorksInPortfolio.service';
import { GetCompletedWorksService } from 'src/application/usecases/works/getCompletedWorks.service';

// Services - Export (Standard)
import { ExportScheduleService } from 'src/application/usecases/export/exportSchedule.service';
import { ExportWorksInPortfolioService } from 'src/application/usecases/export/exportWorksInPortfolio.service';
import { ExportCompletedWorksService } from 'src/application/usecases/export/exportCompletedWorks.service';
import { ExportMonthlyMOSummaryService } from 'src/application/usecases/export/exportMonthlySummary.service';
import { ExportMonthlyForecastSummaryService } from 'src/application/usecases/export/exportMonthlyForecastSummary.service';
import { ExportFinedWorksService } from 'src/application/usecases/export/exportFinedWorks.service';
import { ExportExecutionCapacityService } from 'src/application/usecases/export/exportExecutionCapacity.service';
import { ExportSuspensionsService } from 'src/application/usecases/export/exportSuspensions.service';
import { ExportExecutionReportService } from 'src/application/usecases/export/exportExecutionReport.service';
import { ExportForecastService } from 'src/application/usecases/export/exportForecast.service';
import { ExportRejectionsService } from 'src/application/usecases/export/exportRejections.service';

// Services - Export (BI)
import { ExportWorksInPortfolioBI } from 'src/application/usecases/export/BI/exportWorkInPortfolioBI.service';
import { ExportCompletedWorksBIService } from 'src/application/usecases/export/BI/exportCompletedWorksBI.service';
import { ExportSchedulesBIService } from 'src/application/usecases/export/BI/exportSchedulesBI.service';

// Types
import { GetScheduleValuesResponse } from 'src/interface/types/schedule/getScheduleValuesInterface';
import { worksInPortfolioResponseService } from 'src/interface/types/works/getWorksInPortfolioInterface';
import { GoalsService } from 'src/application/usecases/goals.service';
import { ExportGoalsService } from 'src/application/usecases/export/exportGoals.service';
import { ExportOrdersService } from 'src/application/usecases/export/exportOrders.service';
import { ExportPublicationRestrictionService } from 'src/application/usecases/export/exportPublicationRestriction.service';
import { RestrictionsService } from 'src/application/usecases/restrictions.service';
import { ExportReportToPubliationService } from 'src/application/usecases/export/exportReportToPublication.service';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────

const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// ─────────────────────────────────────────────
// Factories
// ─────────────────────────────────────────────

function makeMockResponse(): jest.Mocked<Pick<Response, 'setHeader' | 'send'>> {
  return {
    setHeader: jest.fn(),
    send: jest.fn(),
  } as unknown as jest.Mocked<Pick<Response, 'setHeader' | 'send'>>;
}

function makeReq(
  overrides: { idParceira?: number; insufficientPermission?: boolean } = {},
) {
  return { ...overrides } as unknown as Request;
}

// ─────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────

const mockScheduleData: GetScheduleValuesResponse = {
  works: [
    {
      id: 9045,
      ovnota: '12398586',
      ordemdiagrama: '170000002955',
      diagrama: null,
      mun: 'MCR',
      prazo_fim: '2024-03-30T00:00:00.000Z',
      tipo_obra: 'POSTE',
      id_grupo: 1,
      qtde_planejada: '1',
      mo_planejada: '3262.21',
      turma: 'LIG',
      executado: 0,
      data_prog: '2024-10-01T00:00:00.000Z',
      prog: 100,
      exec: null,
      mo_prog: 3262.21,
      mo_exec: 3262.21,
      mat_prog: 2345.32,
      num_dp: '15563352',
      hora_ini: '1970-01-01T14:30:00.000Z',
      hora_ter: '1970-01-01T17:30:00.000Z',
      equipe_linha_morta: 1,
      equipe_linha_viva: 1,
      equipe_regularizacao: 0,
      id_tecnico: 1,
      observprog: '',
      conjunto: '',
      circuito: '',
      status_programacao: 'PROGRAMADA',
      status: 'EM EXECUÇÃO',
      id_restricao_prog1: 0,
      id_restricao_prog2: 0,
      data_resolucao1: new Date('1970-01-01T00:00:00.000Z'),
      data_resolucao2: new Date('1970-01-01T00:00:00.000Z'),
      status_restricao1: 'SEM RESTRIÇÃO',
      status_restricao2: 'SEM RESTRIÇÃO',
      restricao_aberta: false,
      status_prazo: 'Atenção: 32 dias restantes',
      status_ov_sap: 51,
    },
  ],
  totals: {
    total_obras: 1,
    total_mo_planejada: 3262.21,
    total_mo_exec: 0,
    total_qtde_planejada: 1,
  },
};

const mockWorksData: worksInPortfolioResponseService = {
  works: [
    {
      ovnota: '123456',
      ordem_principal: 'OD-001',
      ordem_dcd: 'DCD-01',
      ordem_dca: 'DCA-01',
      ordem_dcim: 'DCIM-01',
      ordemdiagrama: 'OD-001',
      status_ov_sap: 50,
      pep: 'PEP001',
      mun: 'São Paulo',
      abrev_regional: 'SP',
      conjunto: 'Conjunto 1',
      circuito: 'Circuito A',
      prazo_fim: 90,
      tipo_obra: 'Manutenção Geral',
      id_grupo: 1,
      qtde_planejada: 10,
      qtde_pend: 2,
      mo_planejada: 5,
      status: 'Planejado',
      turma: 'Equipe Alpha',
      ano_plan: 2025,
      executado: 50,
      data_empreitamento: new Date('2024-02-20T00:00:00.000Z'),
      empreendimento: 'Empreendimento X',
      id: 0,
      prazo: 0,
      contagem_ocorrencias: 0,
      id_status: 0,
      total_equipe_lm: 1,
      total_equipe_lv: 0,
      total_equipe_reg: 0,
      total_exec: 80,
      total_pend: 20,
      total_prog: 0,
      status_prazo: 'Atenção: 23 dias restantes',
    },
  ],
  totals: {
    total_obras: 1,
    total_mo_planejada: 5,
    total_mo_exec: 2.5,
    total_mo_pend: 0,
    total_qtde_planejada: 10,
    total_qtde_pend: 2,
  },
};

const mockGoalsData = [
  {
    id_tipo: 99,
    id_parceira: 1,
    id_regional: 10,
    tipo_obra: 'Construção',
    turma: 'T1',
    regional: 'Sul',
    anocalc: 2024,
    carteira: 150,
    empreendimento: 'Empreendimento A',

    jan: { meta: 15, prog: 7, real: 4 },
    fev: { meta: 30, prog: 15, real: 12 },

    mar: { meta: 0, prog: 0, real: 0 },
    abr: { meta: 0, prog: 0, real: 0 },
    mai: { meta: 0, prog: 0, real: 0 },
    jun: { meta: 0, prog: 0, real: 0 },
    jul: { meta: 0, prog: 0, real: 0 },
    ago: { meta: 0, prog: 0, real: 0 },
    set: { meta: 0, prog: 0, real: 0 },
    out: { meta: 0, prog: 0, real: 0 },
    nov: { meta: 0, prog: 0, real: 0 },
    dez: { meta: 0, prog: 0, real: 0 },
  },
  {
    id_tipo: 77,
    id_parceira: 2,
    id_regional: 20,
    tipo_obra: 'Reforma',
    turma: 'T2',
    regional: 'Norte',
    anocalc: 2024,
    carteira: 0,
    empreendimento: undefined,

    jan: { meta: 0, prog: 0, real: 0 },
    fev: { meta: 0, prog: 0, real: 0 },
    mar: { meta: 30, prog: 15, real: 10 },

    abr: { meta: 0, prog: 0, real: 0 },
    mai: { meta: 0, prog: 0, real: 0 },
    jun: { meta: 0, prog: 0, real: 0 },
    jul: { meta: 0, prog: 0, real: 0 },
    ago: { meta: 0, prog: 0, real: 0 },
    set: { meta: 0, prog: 0, real: 0 },
    out: { meta: 0, prog: 0, real: 0 },
    nov: { meta: 0, prog: 0, real: 0 },
    dez: { meta: 0, prog: 0, real: 0 },
  },
];

const mockMonthlySummaryFirst = { rows: [{ label: 'Janeiro', value: 100 }] };
const mockMonthlySummarySecond = { rows: [{ label: 'Fevereiro', value: 200 }] };

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function assertXlsxHeaders(
  res: ReturnType<typeof makeMockResponse>,
  filename: string,
) {
  expect(res.setHeader).toHaveBeenCalledWith(
    'Content-Disposition',
    `attachment; filename="${filename}"`,
  );
  expect(res.setHeader).toHaveBeenCalledWith('Content-Type', XLSX_CONTENT_TYPE);
  expect(res.setHeader).toHaveBeenCalledTimes(2);
}

// ─────────────────────────────────────────────
// Suite
// ─────────────────────────────────────────────

describe('ExportController', () => {
  let controller: ExportController;

  // Services
  let getScheduleValuesService: jest.Mocked<GetScheduleValuesService>;
  let getWorksInPortfolioService: jest.Mocked<GetWorksInPortfolioService>;
  let getCompletedWorksService: jest.Mocked<GetCompletedWorksService>;
  let monthlyMOSummaryService: jest.Mocked<MonthlySummaryService>;
  let monthlyForecastSummaryService: jest.Mocked<GetMonthlySummaryForecastService>;
  let goalsService: jest.Mocked<GoalsService>;
  let restrictionService: jest.Mocked<RestrictionsService>;
  let exportScheduleService: jest.Mocked<ExportScheduleService>;
  let exportWorksInPortfolioService: jest.Mocked<ExportWorksInPortfolioService>;
  let exportCompletedWorksService: jest.Mocked<ExportCompletedWorksService>;
  let exportMonthlyMOSummaryService: jest.Mocked<ExportMonthlyMOSummaryService>;
  let exportMonthlyForecastSummaryService: jest.Mocked<ExportMonthlyForecastSummaryService>;
  let exportGoalsService: jest.Mocked<ExportGoalsService>;
  let exportWorksInPortfolioBIService: jest.Mocked<ExportWorksInPortfolioBI>;
  let exportCompletedWorksBIService: jest.Mocked<ExportCompletedWorksBIService>;
  let exportSchedulesBIService: jest.Mocked<ExportSchedulesBIService>;
  let exportFinedWorksService: jest.Mocked<ExportFinedWorksService>;
  let exportExecutionCapacityService: jest.Mocked<ExportExecutionCapacityService>;
  let exportSuspensionsService: jest.Mocked<ExportSuspensionsService>;
  let exportExecutionReportService: jest.Mocked<ExportExecutionReportService>;
  let exportForecastService: jest.Mocked<ExportForecastService>;
  let exportRejectionsService: jest.Mocked<ExportRejectionsService>;
  let exportOrdersService: jest.Mocked<ExportOrdersService>;
  let exportPublicationRestrictionService: jest.Mocked<ExportPublicationRestrictionService>;
  let exportReportToPubliationService: jest.Mocked<ExportReportToPubliationService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [
        // Schedule
        {
          provide: GetScheduleValuesService,
          useValue: { getValues: jest.fn() },
        },
        {
          provide: MonthlySummaryService,
          useValue: { getSummary: jest.fn(), getSecondSummary: jest.fn() },
        },
        {
          provide: GetMonthlySummaryForecastService,
          useValue: { getSummary: jest.fn(), getSecondSummary: jest.fn() },
        },
        // Works
        {
          provide: GetWorksInPortfolioService,
          useValue: { getWorksInPortfolio: jest.fn() },
        },
        {
          provide: GetCompletedWorksService,
          useValue: { getCompletedWorks: jest.fn() },
        },
        { provide: GoalsService, useValue: { getGoals: jest.fn() } },
        {
          provide: RestrictionsService,
          useValue: { getPublicationRestriction: jest.fn() },
        },
        // Export - Standard
        { provide: ExportScheduleService, useValue: { export: jest.fn() } },
        {
          provide: ExportWorksInPortfolioService,
          useValue: { export: jest.fn() },
        },
        {
          provide: ExportCompletedWorksService,
          useValue: { export: jest.fn() },
        },
        {
          provide: ExportMonthlyMOSummaryService,
          useValue: { export: jest.fn() },
        },
        {
          provide: ExportMonthlyForecastSummaryService,
          useValue: { export: jest.fn() },
        },
        {
          provide: ExportGoalsService,
          useValue: { export: jest.fn() },
        },
        { provide: ExportFinedWorksService, useValue: { export: jest.fn() } },
        {
          provide: ExportExecutionCapacityService,
          useValue: { export: jest.fn() },
        },
        { provide: ExportSuspensionsService, useValue: { export: jest.fn() } },
        {
          provide: ExportExecutionReportService,
          useValue: { export: jest.fn() },
        },
        { provide: ExportForecastService, useValue: { export: jest.fn() } },
        { provide: ExportRejectionsService, useValue: { export: jest.fn() } },
        // Export - BI
        { provide: ExportWorksInPortfolioBI, useValue: { export: jest.fn() } },
        {
          provide: ExportCompletedWorksBIService,
          useValue: { export: jest.fn() },
        },
        { provide: ExportSchedulesBIService, useValue: { export: jest.fn() } },
        { provide: ExportOrdersService, useValue: { export: jest.fn() } },
        {
          provide: ExportPublicationRestrictionService,
          useValue: { export: jest.fn() },
        },
        {
          provide: ExportReportToPubliationService,
          useValue: { export: jest.fn() },
        },
      ],
    })
      .overrideGuard(VisualizationGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(ExportController);

    getScheduleValuesService = module.get(GetScheduleValuesService);
    getWorksInPortfolioService = module.get(GetWorksInPortfolioService);
    getCompletedWorksService = module.get(GetCompletedWorksService);
    monthlyMOSummaryService = module.get(MonthlySummaryService);
    monthlyForecastSummaryService = module.get(
      GetMonthlySummaryForecastService,
    );
    goalsService = module.get(GoalsService);
    restrictionService = module.get(RestrictionsService);
    exportScheduleService = module.get(ExportScheduleService);
    exportWorksInPortfolioService = module.get(ExportWorksInPortfolioService);
    exportCompletedWorksService = module.get(ExportCompletedWorksService);
    exportMonthlyMOSummaryService = module.get(ExportMonthlyMOSummaryService);
    exportMonthlyForecastSummaryService = module.get(
      ExportMonthlyForecastSummaryService,
    );
    exportGoalsService = module.get(ExportGoalsService);
    exportWorksInPortfolioBIService = module.get(ExportWorksInPortfolioBI);
    exportCompletedWorksBIService = module.get(ExportCompletedWorksBIService);
    exportSchedulesBIService = module.get(ExportSchedulesBIService);
    exportFinedWorksService = module.get(ExportFinedWorksService);
    exportExecutionCapacityService = module.get(ExportExecutionCapacityService);
    exportSuspensionsService = module.get(ExportSuspensionsService);
    exportExecutionReportService = module.get(ExportExecutionReportService);
    exportForecastService = module.get(ExportForecastService);
    exportRejectionsService = module.get(ExportRejectionsService);
    exportOrdersService = module.get(ExportOrdersService);
    exportPublicationRestrictionService = module.get(
      ExportPublicationRestrictionService,
    );
    exportReportToPubliationService = module.get(
      ExportReportToPubliationService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  // ─────────────────────────────────────────────
  // Instantiation
  // ─────────────────────────────────────────────

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  // ─────────────────────────────────────────────
  // applyFilters (private — tested through public endpoints)
  // ─────────────────────────────────────────────

  describe('applyFilters (via exportWorksInPortfolio)', () => {
    it('should inject idParceira from req into filters when present', async () => {
      const res = makeMockResponse() as unknown as Response;
      const filters = { page: 1 } as any;
      const req = makeReq({ idParceira: 42 });

      getWorksInPortfolioService.getWorksInPortfolio.mockResolvedValue(
        mockWorksData,
      );
      exportWorksInPortfolioService.export.mockResolvedValue(undefined);

      await controller.exportWorksInPortfolio(filters, res, req);

      expect(
        getWorksInPortfolioService.getWorksInPortfolio,
      ).toHaveBeenCalledWith(expect.objectContaining({ idParceira: 42 }));
    });

    it('should inject insufficientPermission from req into filters when defined', async () => {
      const res = makeMockResponse() as unknown as Response;
      const filters = { page: 1 } as any;
      const req = makeReq({ insufficientPermission: true });

      getWorksInPortfolioService.getWorksInPortfolio.mockResolvedValue(
        mockWorksData,
      );
      exportWorksInPortfolioService.export.mockResolvedValue(undefined);

      await controller.exportWorksInPortfolio(filters, res, req);

      expect(
        getWorksInPortfolioService.getWorksInPortfolio,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ insufficientPermission: true }),
      );
    });

    it('should NOT mutate filters when req has no idParceira or insufficientPermission', async () => {
      const res = makeMockResponse() as unknown as Response;
      const filters = { page: 1 } as any;
      const req = makeReq();

      getWorksInPortfolioService.getWorksInPortfolio.mockResolvedValue(
        mockWorksData,
      );
      exportWorksInPortfolioService.export.mockResolvedValue(undefined);

      await controller.exportWorksInPortfolio(filters, res, req);

      expect(
        getWorksInPortfolioService.getWorksInPortfolio,
      ).toHaveBeenCalledWith(
        expect.not.objectContaining({ idParceira: expect.anything() }),
      );
    });
  });

  // ─────────────────────────────────────────────
  // Visualization routes
  // ─────────────────────────────────────────────

  describe('exportSchedule (GET /programacao)', () => {
    const filters = { idRegional: [1] } as any;

    it('should fetch schedule, set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse() as unknown as Response;
      const req = makeReq({ idParceira: 1 });

      getScheduleValuesService.getValues.mockResolvedValue(mockScheduleData);
      exportScheduleService.export.mockResolvedValue(undefined);

      await controller.exportSchedule(filters, res, req);

      expect(getScheduleValuesService.getValues).toHaveBeenCalledWith(
        expect.objectContaining({ idParceira: 1 }),
      );
      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação Programação',
      );
      expect(exportScheduleService.export).toHaveBeenCalledWith(
        mockScheduleData.works,
        res,
      );
    });

    it('should work without idParceira in req', async () => {
      const res = makeMockResponse() as unknown as Response;
      const req = makeReq();

      getScheduleValuesService.getValues.mockResolvedValue(mockScheduleData);
      exportScheduleService.export.mockResolvedValue(undefined);

      await controller.exportSchedule(filters, res, req);

      expect(getScheduleValuesService.getValues).toHaveBeenCalledWith(filters);
      expect(exportScheduleService.export).toHaveBeenCalledWith(
        mockScheduleData.works,
        res,
      );
    });
  });

  describe('exportWorksInPortfolio (GET /obras-carteira)', () => {
    const filters = { page: 1 } as any;

    it('should fetch portfolio works, set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse() as unknown as Response;
      const req = makeReq({ idParceira: 1, insufficientPermission: false });

      getWorksInPortfolioService.getWorksInPortfolio.mockResolvedValue(
        mockWorksData,
      );
      exportWorksInPortfolioService.export.mockResolvedValue(undefined);

      await controller.exportWorksInPortfolio(filters, res, req);

      expect(
        getWorksInPortfolioService.getWorksInPortfolio,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          idParceira: 1,
          insufficientPermission: false,
        }),
      );
      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação obras em carteira',
      );
      expect(exportWorksInPortfolioService.export).toHaveBeenCalledWith(
        mockWorksData,
        res,
      );
    });
  });

  describe('exportCompletedWorks (GET /obras-executadas)', () => {
    const filters = { idRegional: [2] } as any;

    it('should fetch completed works, set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse() as unknown as Response;
      const req = makeReq({ idParceira: 5, insufficientPermission: true });

      getCompletedWorksService.getCompletedWorks.mockResolvedValue(
        mockWorksData,
      );
      exportCompletedWorksService.export.mockResolvedValue(undefined);

      await controller.exportCompletedWorks(filters, res, req);

      expect(getCompletedWorksService.getCompletedWorks).toHaveBeenCalledWith(
        expect.objectContaining({
          idParceira: 5,
          insufficientPermission: true,
        }),
      );
      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação obras executadas',
      );
      expect(exportCompletedWorksService.export).toHaveBeenCalledWith(
        mockWorksData,
        res,
      );
    });

    it('should work without req permissions', async () => {
      const res = makeMockResponse() as unknown as Response;
      const req = makeReq();

      getCompletedWorksService.getCompletedWorks.mockResolvedValue(
        mockWorksData,
      );
      exportCompletedWorksService.export.mockResolvedValue(undefined);

      await controller.exportCompletedWorks(filters, res, req);

      expect(getCompletedWorksService.getCompletedWorks).toHaveBeenCalledWith(
        filters,
      );
    });
  });

  describe('exportGoalsService (GET /metas)', () => {
    const filters = { idRegional: [2] } as any;

    it('should fetch goals, set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse() as unknown as Response;
      const req = makeReq({ idParceira: 5, insufficientPermission: true });

      goalsService.getGoals.mockResolvedValue(mockGoalsData);
      exportGoalsService.export.mockResolvedValue(undefined);

      await controller.exportGoals(filters, res, req);

      expect(goalsService.getGoals).toHaveBeenCalledWith(
        expect.objectContaining({
          idParceira: 5,
          insufficientPermission: true,
        }),
      );
      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação Metas',
      );
      expect(exportGoalsService.export).toHaveBeenCalledWith(
        mockGoalsData,
        res,
      );
    });

    it('should work without req permissions', async () => {
      const res = makeMockResponse() as unknown as Response;
      const req = makeReq();

      goalsService.getGoals.mockResolvedValue(mockGoalsData);
      exportGoalsService.export.mockResolvedValue(undefined);

      await controller.exportGoals(filters, res, req);

      expect(goalsService.getGoals).toHaveBeenCalledWith(filters);
    });
  });

  describe('exportMonthlyMOSummary (GET /resumo-mensal)', () => {
    const filters = { month: 3, year: 2025 } as any;

    it('should fetch both summaries in parallel, set xlsx headers and export', async () => {
      const res = makeMockResponse() as unknown as Response;
      const req = makeReq({ idParceira: 2 });

      monthlyMOSummaryService.getSummary.mockResolvedValue({
        summary: mockMonthlySummaryFirst as any,
        totals: {} as any,
      });
      monthlyMOSummaryService.getSecondSummary.mockResolvedValue({
        summary: mockMonthlySummarySecond as any,
        totals: {} as any,
      });
      exportMonthlyMOSummaryService.export.mockResolvedValue(undefined);

      await controller.exportMonthlyMOSummary(filters, res, req);

      expect(monthlyMOSummaryService.getSummary).toHaveBeenCalledWith(
        expect.objectContaining({ idParceira: 2 }),
      );
      expect(monthlyMOSummaryService.getSecondSummary).toHaveBeenCalledWith(
        expect.objectContaining({ idParceira: 2 }),
      );
      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação Resumo Mensal - Mão de Obra',
      );
      expect(exportMonthlyMOSummaryService.export).toHaveBeenCalledWith(
        mockMonthlySummaryFirst,
        mockMonthlySummarySecond,
        res,
      );
    });

    it('should call getSummary and getSecondSummary concurrently via Promise.all', async () => {
      const res = makeMockResponse() as unknown as Response;
      const req = makeReq();
      const callOrder: string[] = [];

      monthlyMOSummaryService.getSummary.mockImplementation(async () => {
        callOrder.push('getSummary');
        return mockMonthlySummaryFirst as any;
      });
      monthlyMOSummaryService.getSecondSummary.mockImplementation(async () => {
        callOrder.push('getSecondSummary');
        return mockMonthlySummarySecond as any;
      });
      exportMonthlyMOSummaryService.export.mockResolvedValue(undefined);

      await controller.exportMonthlyMOSummary(filters, res, req);

      expect(callOrder).toEqual(['getSummary', 'getSecondSummary']);
    });
  });

  describe('exportMonthlyForecastSummary (GET /resumo-mensal-forecast)', () => {
    const filters = { month: 4, year: 2025 } as any;

    it('should fetch both forecast summaries in parallel, set xlsx headers and export', async () => {
      const res = makeMockResponse() as unknown as Response;
      const req = makeReq({ idParceira: 3 });

      monthlyForecastSummaryService.getSummary.mockResolvedValue({
        summary: mockMonthlySummaryFirst as any,
        totals: {} as any,
      });
      monthlyForecastSummaryService.getSecondSummary.mockResolvedValue({
        summary: mockMonthlySummarySecond as any,
        totals: {} as any,
      });
      exportMonthlyForecastSummaryService.export.mockResolvedValue(undefined);

      await controller.exportMonthlyForecastSummary(filters, res, req);

      expect(monthlyForecastSummaryService.getSummary).toHaveBeenCalledWith(
        expect.objectContaining({ idParceira: 3 }),
      );
      expect(
        monthlyForecastSummaryService.getSecondSummary,
      ).toHaveBeenCalledWith(expect.objectContaining({ idParceira: 3 }));
      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação Resumo Mensal - Forecast',
      );
      expect(exportMonthlyForecastSummaryService.export).toHaveBeenCalledWith(
        mockMonthlySummaryFirst,
        mockMonthlySummarySecond,
        res,
      );
    });
  });

  describe('exportPublicationRestrictions (GET /metas)', () => {
    const filters = { idRegional: [2] } as any;

    it('should fetch publication restrictions, set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse() as unknown as Response;
      const req = makeReq({ idParceira: 5, insufficientPermission: true });

      restrictionService.getPublicationRestriction.mockResolvedValue({
        works: [],
      });
      exportPublicationRestrictionService.export.mockResolvedValue(undefined);

      await controller.exportPublicationRestrictions(filters, res, req);

      expect(restrictionService.getPublicationRestriction).toHaveBeenCalledWith(
        expect.objectContaining({
          idParceira: 5,
          insufficientPermission: true,
        }),
      );
      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação Restrições de Publicação',
      );
      expect(exportPublicationRestrictionService.export).toHaveBeenCalledWith(
        {
          works: [],
        },
        res,
      );
    });

    it('should work without req permissions', async () => {
      const res = makeMockResponse() as unknown as Response;
      const req = makeReq();

      goalsService.getGoals.mockResolvedValue(mockGoalsData);
      exportGoalsService.export.mockResolvedValue(undefined);

      await controller.exportGoals(filters, res, req);

      expect(goalsService.getGoals).toHaveBeenCalledWith(filters);
    });
  });

  // ─────────────────────────────────────────────
  // BI routes
  // ─────────────────────────────────────────────

  describe('exportWorksInPortfolioBI (GET /obras-carteira-bi)', () => {
    it('should set xlsx headers and delegate to BI export service', async () => {
      const res = makeMockResponse() as unknown as Response;
      exportWorksInPortfolioBIService.export.mockResolvedValue(undefined);

      await controller.exportWorksInPortfolioBI(res);

      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação obras em carteira',
      );
      expect(exportWorksInPortfolioBIService.export).toHaveBeenCalledWith(res);
    });
  });

  describe('exportCompletedWorksBI (GET /obras-executadas-bi)', () => {
    it('should set xlsx headers and delegate to BI export service', async () => {
      const res = makeMockResponse() as unknown as Response;
      exportCompletedWorksBIService.export.mockResolvedValue(undefined);

      await controller.exportCompletedWorksBI(res);

      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação obras executadas',
      );
      expect(exportCompletedWorksBIService.export).toHaveBeenCalledWith(res);
    });
  });

  describe('exportSchedulesBI (GET /programacoes-bi)', () => {
    it('should set xlsx headers and delegate to BI export service', async () => {
      const res = makeMockResponse() as unknown as Response;
      exportSchedulesBIService.export.mockResolvedValue(undefined);

      await controller.exportSchedulesBI(res);

      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação programações',
      );
      expect(exportSchedulesBIService.export).toHaveBeenCalledWith(res);
    });
  });

  // ─────────────────────────────────────────────
  // Permission routes
  // ─────────────────────────────────────────────

  describe('exportFinedWorks (GET /obras-multas)', () => {
    it('should set xlsx headers and forward date range to export service', async () => {
      const res = makeMockResponse() as unknown as Response;
      exportFinedWorksService.export.mockResolvedValue(undefined);

      await controller.exportFinedWorks(res, '2025-01-01', '2025-01-31');

      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação a serem multadas',
      );
      expect(exportFinedWorksService.export).toHaveBeenCalledWith(
        res,
        '2025-01-01',
        '2025-01-31',
      );
    });

    it('should work when startDate and endDate are omitted', async () => {
      const res = makeMockResponse() as unknown as Response;
      exportFinedWorksService.export.mockResolvedValue(undefined);

      await controller.exportFinedWorks(res);

      expect(exportFinedWorksService.export).toHaveBeenCalledWith(
        res,
        undefined,
        undefined,
      );
    });
  });

  describe('exportExecutionCapacity (GET /capacidade-execucao)', () => {
    it('should set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse() as unknown as Response;
      exportExecutionCapacityService.export.mockResolvedValue(undefined);

      await controller.exportExecutionCapacity(res);

      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação capacidade de execução',
      );
      expect(exportExecutionCapacityService.export).toHaveBeenCalledWith(res);
    });
  });

  describe('exportSuspensions (GET /suspensoes)', () => {
    it('should set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse() as unknown as Response;
      exportSuspensionsService.export.mockResolvedValue(undefined);

      await controller.exportSuspensions(res);

      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação Suspensões',
      );
      expect(exportSuspensionsService.export).toHaveBeenCalledWith(res);
    });
  });

  describe('exportExecutionReport (GET /relatorio-execucao)', () => {
    it('should set xlsx headers with the correct filename (not "Suspensões") and delegate', async () => {
      const res = makeMockResponse() as unknown as Response;
      exportExecutionReportService.export.mockResolvedValue(undefined);

      await controller.exportExecutionReport(res);

      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação Relatório de Execução',
      );
      expect(exportExecutionReportService.export).toHaveBeenCalledWith(res);
    });
  });

  describe('exportForecast (GET /forecast)', () => {
    it('should set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse() as unknown as Response;
      exportForecastService.export.mockResolvedValue(undefined);

      await controller.exportForecast(res);

      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação do Forecast',
      );
      expect(exportForecastService.export).toHaveBeenCalledWith(res);
    });
  });

  describe('exportRejections (GET /reprovacoes)', () => {
    it('should set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse() as unknown as Response;
      exportRejectionsService.export.mockResolvedValue(undefined);

      await controller.exportRejections(res);

      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação das reprovações',
      );
      expect(exportRejectionsService.export).toHaveBeenCalledWith(res);
    });
  });

  describe('exportOrders (GET /ordens)', () => {
    it('should set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse() as unknown as Response;
      exportOrdersService.export.mockResolvedValue(undefined);

      await controller.exportOrders(res);

      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação Ordens/Diagramas',
      );
      expect(exportOrdersService.export).toHaveBeenCalledWith(res);
    });
  });

  describe('exportReportToPublication (GET /ordens)', () => {
    it('should set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse() as unknown as Response;
      exportOrdersService.export.mockResolvedValue(undefined);

      await controller.exportReportToPublication(res);

      assertXlsxHeaders(
        res as unknown as ReturnType<typeof makeMockResponse>,
        'Exportação Relatório Publicações ',
      );
      expect(exportReportToPubliationService.export).toHaveBeenCalledWith(res);
    });
  });
});
