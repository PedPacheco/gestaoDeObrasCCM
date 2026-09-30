import { ExportExecutionCapacityService } from 'src/application/usecases/export/exportExecutionCapacity.service';
import { ExportExecutionReportService } from 'src/application/usecases/export/exportExecutionReport.service';
import { ExportForecastService } from 'src/application/usecases/export/exportForecast.service';
import { ExportGoalsService } from 'src/application/usecases/export/exportGoals.service';
import { ExportMonthlyForecastSummaryService } from 'src/application/usecases/export/exportMonthlyForecastSummary.service';
import { ExportMonthlyMOSummaryService } from 'src/application/usecases/export/exportMonthlySummary.service';
import { ExportScheduleService } from 'src/application/usecases/export/exportSchedule.service';
import { GoalsService } from 'src/application/usecases/goals.service';
import { MonthlySummaryService } from 'src/application/usecases/works/schedule/getMonthlySummary.service';
import { GetMonthlySummaryForecastService } from 'src/application/usecases/works/schedule/getMonthlySummaryForecast.service';
import { GetScheduleValuesService } from 'src/application/usecases/works/schedule/getScheduleValues.service';
import { ExportScheduleController } from 'src/interface/controllers/export/exportSchedule.controller';
import { GetScheduleValuesResponse } from 'src/interface/types/schedule/getScheduleValuesInterface';

import { TestingModule } from '@nestjs/testing';

import {
  assertXlsxHeaders,
  createExportTestingModule,
  makeMockResponse,
  makeReq,
  mockProvider,
} from './export.utils';

const emptyMonth = { meta: 0, prog: 0, real: 0 };

export const mockGoalsData = [
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
    mar: emptyMonth,
    abr: emptyMonth,
    mai: emptyMonth,
    jun: emptyMonth,
    jul: emptyMonth,
    ago: emptyMonth,
    set: emptyMonth,
    out: emptyMonth,
    nov: emptyMonth,
    dez: emptyMonth,
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
    jan: emptyMonth,
    fev: emptyMonth,
    mar: { meta: 30, prog: 15, real: 10 },
    abr: emptyMonth,
    mai: emptyMonth,
    jun: emptyMonth,
    jul: emptyMonth,
    ago: emptyMonth,
    set: emptyMonth,
    out: emptyMonth,
    nov: emptyMonth,
    dez: emptyMonth,
  },
];

export const mockScheduleData: GetScheduleValuesResponse = {
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
      encontrado: false,
      id_programacao: 5,
      moExecutadoPontoAPonto: 2000,
      moPlanejadaPontoAPonto: 2000,
    },
  ],
  totals: {
    total_obras: 1,
    total_mo_planejada: 3262.21,
    total_mo_exec: 0,
    total_qtde_planejada: 1,
  },
};

const mockMonthlySummaryFirst = {
  rows: [{ label: 'Janeiro', value: 100 }],
};
const mockMonthlySummarySecond = {
  rows: [{ label: 'Fevereiro', value: 200 }],
};

describe('ExportScheduleController', () => {
  let controller: ExportScheduleController;

  let getScheduleValuesService: jest.Mocked<GetScheduleValuesService>;
  let monthlyMOSummaryService: jest.Mocked<MonthlySummaryService>;
  let monthlyForecastSummaryService: jest.Mocked<GetMonthlySummaryForecastService>;
  let goalsService: jest.Mocked<GoalsService>;
  let exportScheduleService: jest.Mocked<ExportScheduleService>;
  let exportMonthlyMOSummaryService: jest.Mocked<ExportMonthlyMOSummaryService>;
  let exportMonthlyForecastSummaryService: jest.Mocked<ExportMonthlyForecastSummaryService>;
  let exportExecutionCapacityService: jest.Mocked<ExportExecutionCapacityService>;
  let exportExecutionReportService: jest.Mocked<ExportExecutionReportService>;
  let exportForecastService: jest.Mocked<ExportForecastService>;
  let exportGoalsService: jest.Mocked<ExportGoalsService>;

  const moFirstResponse = {
    summary: mockMonthlySummaryFirst as any,
    totals: {} as any,
    contractValueByMonth: { monthlyValue: 0 },
  };
  const moSecondResponse = {
    summary: mockMonthlySummarySecond as any,
    totals: {} as any,
  };
  const forecastFirstResponse = {
    summary: mockMonthlySummaryFirst as any,
    totals: {} as any,
  };
  const forecastSecondResponse = {
    summary: mockMonthlySummarySecond as any,
    totals: {} as any,
  };

  beforeEach(async () => {
    const module: TestingModule = await createExportTestingModule(
      ExportScheduleController,
      [
        mockProvider(GetScheduleValuesService, ['getValues']),
        mockProvider(MonthlySummaryService, ['getSummary', 'getSecondSummary']),
        mockProvider(GetMonthlySummaryForecastService, [
          'getSummary',
          'getSecondSummary',
        ]),
        mockProvider(GoalsService, ['getGoals']),
        mockProvider(ExportScheduleService, ['export']),
        mockProvider(ExportMonthlyMOSummaryService, ['export']),
        mockProvider(ExportMonthlyForecastSummaryService, ['export']),
        mockProvider(ExportExecutionCapacityService, ['export']),
        mockProvider(ExportExecutionReportService, ['export']),
        mockProvider(ExportForecastService, ['export']),
        mockProvider(ExportGoalsService, ['export']),
      ],
    );

    controller = module.get(ExportScheduleController);
    getScheduleValuesService = module.get(GetScheduleValuesService);
    monthlyMOSummaryService = module.get(MonthlySummaryService);
    monthlyForecastSummaryService = module.get(
      GetMonthlySummaryForecastService,
    );
    goalsService = module.get(GoalsService);
    exportScheduleService = module.get(ExportScheduleService);
    exportMonthlyMOSummaryService = module.get(ExportMonthlyMOSummaryService);
    exportMonthlyForecastSummaryService = module.get(
      ExportMonthlyForecastSummaryService,
    );
    exportExecutionCapacityService = module.get(ExportExecutionCapacityService);
    exportExecutionReportService = module.get(ExportExecutionReportService);
    exportForecastService = module.get(ExportForecastService);
    exportGoalsService = module.get(ExportGoalsService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('exportSchedule (GET /programacao)', () => {
    it('should fetch schedule, set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse();
      getScheduleValuesService.getValues.mockResolvedValue(mockScheduleData);
      exportScheduleService.export.mockResolvedValue(undefined);

      await controller.exportSchedule(
        { idRegional: [1] } as any,
        res,
        makeReq({ idParceira: 1 }),
      );

      expect(getScheduleValuesService.getValues).toHaveBeenCalledWith(
        expect.objectContaining({ idParceira: 1 }),
      );
      assertXlsxHeaders(res, 'Exportação Programação');
      expect(exportScheduleService.export).toHaveBeenCalledWith(
        mockScheduleData.works,
        res,
      );
    });

    it('should not add idParceira when req has none', async () => {
      const res = makeMockResponse();
      getScheduleValuesService.getValues.mockResolvedValue(mockScheduleData);
      exportScheduleService.export.mockResolvedValue(undefined);

      await controller.exportSchedule(
        { idRegional: [1] } as any,
        res,
        makeReq(),
      );

      expect(getScheduleValuesService.getValues).toHaveBeenCalledWith({
        idRegional: [1],
      });
    });
  });

  describe('exportMonthlyMOSummary (GET /resumo-mensal)', () => {
    it('should fetch both summaries, set xlsx headers and export', async () => {
      const res = makeMockResponse();
      monthlyMOSummaryService.getSummary.mockResolvedValue(moFirstResponse);
      monthlyMOSummaryService.getSecondSummary.mockResolvedValue(
        moSecondResponse,
      );
      exportMonthlyMOSummaryService.export.mockResolvedValue(undefined);

      await controller.exportMonthlyMOSummary(
        { month: 3, year: 2025 } as any,
        res,
        makeReq({ idParceira: 2 }),
      );

      expect(monthlyMOSummaryService.getSummary).toHaveBeenCalledWith(
        expect.objectContaining({ idParceira: 2 }),
      );
      expect(monthlyMOSummaryService.getSecondSummary).toHaveBeenCalledWith(
        expect.objectContaining({ idParceira: 2 }),
      );
      assertXlsxHeaders(res, 'Exportação Resumo Mensal - Mão de Obra');
      expect(exportMonthlyMOSummaryService.export).toHaveBeenCalledWith(
        mockMonthlySummaryFirst,
        mockMonthlySummarySecond,
        res,
      );
    });

    it('should start both summary requests before awaiting either (Promise.all)', async () => {
      const res = makeMockResponse();
      let releaseFirst!: () => void;
      monthlyMOSummaryService.getSummary.mockImplementation(
        () =>
          new Promise((resolve) => {
            releaseFirst = () => resolve(moFirstResponse);
          }),
      );
      monthlyMOSummaryService.getSecondSummary.mockResolvedValue(
        moSecondResponse,
      );
      exportMonthlyMOSummaryService.export.mockResolvedValue(undefined);

      const pending = controller.exportMonthlyMOSummary(
        { month: 3, year: 2025 } as any,
        res,
        makeReq(),
      );

      // A primeira ainda não resolveu, mas a segunda já deve ter sido disparada.
      expect(monthlyMOSummaryService.getSecondSummary).toHaveBeenCalledTimes(1);

      releaseFirst();
      await pending;
      expect(exportMonthlyMOSummaryService.export).toHaveBeenCalledTimes(1);
    });
  });

  describe('exportMonthlyForecastSummary (GET /resumo-mensal-forecast)', () => {
    it('should fetch both forecast summaries, set xlsx headers and export', async () => {
      const res = makeMockResponse();
      monthlyForecastSummaryService.getSummary.mockResolvedValue(
        forecastFirstResponse,
      );
      monthlyForecastSummaryService.getSecondSummary.mockResolvedValue(
        forecastSecondResponse,
      );
      exportMonthlyForecastSummaryService.export.mockResolvedValue(undefined);

      await controller.exportMonthlyForecastSummary(
        { month: 4, year: 2025 } as any,
        res,
        makeReq({ idParceira: 3 }),
      );

      expect(monthlyForecastSummaryService.getSummary).toHaveBeenCalledWith(
        expect.objectContaining({ idParceira: 3 }),
      );
      expect(
        monthlyForecastSummaryService.getSecondSummary,
      ).toHaveBeenCalledWith(expect.objectContaining({ idParceira: 3 }));
      assertXlsxHeaders(res, 'Exportação Resumo Mensal - Forecast');
      expect(exportMonthlyForecastSummaryService.export).toHaveBeenCalledWith(
        mockMonthlySummaryFirst,
        mockMonthlySummarySecond,
        res,
      );
    });

    it('should start both forecast requests before awaiting either (Promise.all)', async () => {
      const res = makeMockResponse();
      let releaseFirst!: () => void;
      monthlyForecastSummaryService.getSummary.mockImplementation(
        () =>
          new Promise((resolve) => {
            releaseFirst = () => resolve(forecastFirstResponse);
          }),
      );
      monthlyForecastSummaryService.getSecondSummary.mockResolvedValue(
        forecastSecondResponse,
      );
      exportMonthlyForecastSummaryService.export.mockResolvedValue(undefined);

      const pending = controller.exportMonthlyForecastSummary(
        { month: 4, year: 2025 } as any,
        res,
        makeReq(),
      );

      expect(
        monthlyForecastSummaryService.getSecondSummary,
      ).toHaveBeenCalledTimes(1);

      releaseFirst();
      await pending;
      expect(exportMonthlyForecastSummaryService.export).toHaveBeenCalledTimes(
        1,
      );
    });
  });

  describe('exportGoals (GET /metas)', () => {
    it('should fetch goals, set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse();
      goalsService.getGoals.mockResolvedValue(mockGoalsData);
      exportGoalsService.export.mockResolvedValue(undefined);

      await controller.exportGoals(
        { idRegional: [2] } as any,
        res,
        makeReq({ idParceira: 5, user: { tipo_usuario: 'PARCEIRA' } }),
      );

      expect(goalsService.getGoals).toHaveBeenCalledWith(
        expect.objectContaining({
          idParceira: 5,
          insufficientPermission: true,
        }),
      );
      assertXlsxHeaders(res, 'Exportação Metas');
      expect(exportGoalsService.export).toHaveBeenCalledWith(
        mockGoalsData,
        res,
      );
    });

    it('should not add partner filters for an INTERNO user without idParceira', async () => {
      const res = makeMockResponse();
      goalsService.getGoals.mockResolvedValue(mockGoalsData);
      exportGoalsService.export.mockResolvedValue(undefined);

      await controller.exportGoals({ idRegional: [2] } as any, res, makeReq());

      expect(goalsService.getGoals).toHaveBeenCalledWith({ idRegional: [2] });
    });
  });

  describe('exportForecast (GET /forecast)', () => {
    it('should set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse();
      exportForecastService.export.mockResolvedValue(undefined);

      await controller.exportForecast(res);

      assertXlsxHeaders(res, 'Exportação do Forecast');
      expect(exportForecastService.export).toHaveBeenCalledWith(res);
    });
  });

  describe('exportExecutionCapacity (GET /capacidade-execucao)', () => {
    it('should set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse();
      exportExecutionCapacityService.export.mockResolvedValue(undefined);

      await controller.exportExecutionCapacity(res);

      assertXlsxHeaders(res, 'Exportação capacidade de execução');
      expect(exportExecutionCapacityService.export).toHaveBeenCalledWith(res);
    });
  });

  describe('exportExecutionReport (GET /relatorio-execucao)', () => {
    it('should set xlsx headers with the correct filename and delegate', async () => {
      const res = makeMockResponse();
      exportExecutionReportService.export.mockResolvedValue(undefined);

      await controller.exportExecutionReport(res);

      assertXlsxHeaders(res, 'Exportação Relatório de Execução');
      expect(exportExecutionReportService.export).toHaveBeenCalledWith(res);
    });
  });
});
