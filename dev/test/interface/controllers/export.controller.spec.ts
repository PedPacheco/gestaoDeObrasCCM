import { Response } from 'express';
import { Test } from '@nestjs/testing';
import { ExportController } from 'src/interface/controllers/export.controller';

import { GetScheduleValuesService } from 'src/application/schedule/getScheduleValues.service';
import { ExportScheduleService } from 'src/application/export/exportSchedule.service';
import { GetWorksInPortfolioService } from 'src/application/works/getWorksInPortfolio.service';
import { ExportWorksInPortfolioService } from 'src/application/export/exportWorksInPortfolio.service';
import { GetCompletedWorksService } from 'src/application/works/getCompletedWorks.service';
import { ExportCompletedWorksService } from 'src/application/export/exportCompletedWorks.service';
import { ExportWorksInPortfolioBI } from 'src/application/export/BI/exportWorkInPortfolioBI.service';
import { ExportCompletedWorksBIService } from 'src/application/export/BI/exportCompletedWorksBI.service';
import { ExportSchedulesBIService } from 'src/application/export/BI/exportSchedulesBI.service';
import { ExportFinedWorksService } from 'src/application/export/exportFinedWorks.service';
import { ExportExecutionCapacityService } from 'src/application/export/exportExecutionCapacity.service';
import { ExportSuspensionsService } from 'src/application/export/exportSuspensions.service';
import { UsersService } from 'src/application/users.service';

import { worksInPortfolioResponseService } from 'src/interface/types/works/getWorksInPortfolioInterface';
import { GetScheduleValuesResponse } from 'src/interface/types/schedule/getScheduleValuesInterface';
import { ExportExecutionReportService } from 'src/application/export/exportExecutionReport.service';

describe('ExportController', () => {
  let controller: ExportController;
  let getScheduleValuesService: GetScheduleValuesService;
  let exportScheduleService: ExportScheduleService;
  let getWorksInPortfolioService: GetWorksInPortfolioService;
  let exportWorksInPortfolioService: ExportWorksInPortfolioService;
  let getCompletedWorksService: GetCompletedWorksService;
  let exportCompletedWorksService: ExportCompletedWorksService;
  let exportWorksInPortfolioBIService: ExportWorksInPortfolioBI;
  let exportCompletedWorksBIService: ExportCompletedWorksBIService;
  let exportSchedulesBIService: ExportSchedulesBIService;
  let exportFinedWorksService: ExportFinedWorksService;
  let exportExecutionCapacityService: ExportExecutionCapacityService;
  let exportSuspensionsService: ExportSuspensionsService;
  let exportExecutionReportService: ExportExecutionReportService;

  const mockReq = {
    insufficientPermission: true,
    idParceira: 1,
  } as unknown as Request;

  const mockWorksData: worksInPortfolioResponseService = {
    works: [
      {
        ovnota: '123456',
        ordemdiagrama: 'OD-001',
        ordem_dcd: 'DCD-01',
        ordem_dca: 'DCA-01',
        ordem_dcim: 'DCIM-01',
        status_ov_sap: 50,
        pep: 'PEP001',
        mun: 'São Paulo',
        abrev_regional: 'SP',
        conjunto: 'Conjunto 1',
        circuito: 'Circuito A',
        entrada: new Date('2024-01-15T00:00:00.000Z'),
        prazo_fim: 90,
        tipo_obra: 'Manutenção Geral',
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
      },
    ],
    totals: {
      total_obras: 1,
      total_mo_planejada: 5,
      total_mo_exec: 2.5,
      total_mo_suspensa: 0,
      total_qtde_planejada: 10,
      total_qtde_pend: 2,
    },
  };

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
        qtde_planejada: '1',
        mo_planejada: '3262.21',
        turma: 'LIG',
        executado: 0,
        entrada: '2024-08-01T00:00:00.000Z',
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
      },
    ],
    totals: {
      total_obras: 1,
      total_mo_planejada: 3262.21,
      total_mo_exec: 0,
      total_qtde_planejada: 1,
    },
  };

  async function testGenericExport(
    controllerMethod: (...args: any[]) => Promise<void>,
    serviceGetter: jest.Mock,
    exportGetter: jest.Mock,
    mockFilters: any,
    mockData: any,
    fileName: string,
    mockReq?: any,
  ) {
    const mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    serviceGetter.mockResolvedValue(mockData);
    exportGetter.mockResolvedValue(undefined);

    await controllerMethod(mockFilters, mockResponse, mockReq);

    const expectedRequestService =
      fileName === 'Exportação Programação' ? mockData.works : mockData;

    expect(serviceGetter).toHaveBeenCalledWith(mockFilters);
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(exportGetter).toHaveBeenCalledWith(
      expectedRequestService,
      mockResponse,
    );
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [
        {
          provide: GetScheduleValuesService,
          useValue: { getValues: jest.fn() },
        },
        { provide: ExportScheduleService, useValue: { export: jest.fn() } },
        {
          provide: GetWorksInPortfolioService,
          useValue: { getWorksInPortfolio: jest.fn() },
        },
        {
          provide: ExportWorksInPortfolioService,
          useValue: { export: jest.fn() },
        },
        {
          provide: GetCompletedWorksService,
          useValue: { getCompletedWorks: jest.fn() },
        },
        {
          provide: ExportCompletedWorksService,
          useValue: { export: jest.fn() },
        },
        { provide: ExportWorksInPortfolioBI, useValue: { export: jest.fn() } },
        {
          provide: ExportCompletedWorksBIService,
          useValue: { export: jest.fn() },
        },
        { provide: ExportSchedulesBIService, useValue: { export: jest.fn() } },
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
        { provide: UsersService, useValue: { findUser: jest.fn() } },
      ],
    }).compile();

    controller = module.get<ExportController>(ExportController);
    getScheduleValuesService = module.get(GetScheduleValuesService);
    exportScheduleService = module.get(ExportScheduleService);
    getWorksInPortfolioService = module.get(GetWorksInPortfolioService);
    exportWorksInPortfolioService = module.get(ExportWorksInPortfolioService);
    getCompletedWorksService = module.get(GetCompletedWorksService);
    exportCompletedWorksService = module.get(ExportCompletedWorksService);
    exportWorksInPortfolioBIService = module.get(ExportWorksInPortfolioBI);
    exportCompletedWorksBIService = module.get(ExportCompletedWorksBIService);
    exportSchedulesBIService = module.get(ExportSchedulesBIService);
    exportFinedWorksService = module.get(ExportFinedWorksService);
    exportExecutionCapacityService = module.get(ExportExecutionCapacityService);
    exportSuspensionsService = module.get(ExportSuspensionsService);
    exportExecutionReportService = module.get(ExportExecutionReportService);
  });

  afterAll(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should export Schedule', async () => {
    await testGenericExport(
      controller.exportSchedule.bind(controller),
      getScheduleValuesService.getValues as jest.Mock,
      exportScheduleService.export as jest.Mock,
      { idParceira: [1] },
      mockScheduleData,
      'Exportação Programação',
      mockReq,
    );
  });

  it('should export Schedule without req.idParceira', async () => {
    const mockReqWithoutIdParceira = {
      insufficientPermission: undefined,
    } as unknown as Request;

    await testGenericExport(
      controller.exportSchedule.bind(controller),
      getScheduleValuesService.getValues as jest.Mock,
      exportScheduleService.export as jest.Mock,
      undefined,
      mockScheduleData,
      'Exportação Programação',
      mockReqWithoutIdParceira,
    );
  });

  it('should export WorksInPortfolio', async () => {
    await testGenericExport(
      controller.exportWorksInPortfolio.bind(controller),
      getWorksInPortfolioService.getWorksInPortfolio as jest.Mock,
      exportWorksInPortfolioService.export as jest.Mock,
      { page: 1 },
      mockWorksData,
      'Exportação obras em carteira',
      mockReq,
    );
  });

  it('should export CompletedWorks', async () => {
    const mockReqWithoutIdParceira = {
      insufficientPermission: undefined,
    } as unknown as Request;

    await testGenericExport(
      controller.exportCompletedWorks.bind(controller),
      getCompletedWorksService.getCompletedWorks as jest.Mock,
      exportCompletedWorksService.export as jest.Mock,
      { idRegional: [1] },
      mockWorksData,
      'Exportação obras executadas',
      mockReqWithoutIdParceira,
    );
  });

  it('should export WorksInPortfolioBI', async () => {
    const mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;
    jest
      .spyOn(exportWorksInPortfolioBIService, 'export')
      .mockResolvedValue(undefined);

    await controller.exportWorksInPortfolioBI(mockResponse);

    expect(mockResponse.setHeader).toHaveBeenCalled();
    expect(exportWorksInPortfolioBIService.export).toHaveBeenCalledWith(
      mockResponse,
    );
  });

  it('should export CompletedWorksBI', async () => {
    const mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;
    jest
      .spyOn(exportCompletedWorksBIService, 'export')
      .mockResolvedValue(undefined);

    await controller.exportCompletedWorksBI(mockResponse);

    expect(mockResponse.setHeader).toHaveBeenCalled();
    expect(exportCompletedWorksBIService.export).toHaveBeenCalledWith(
      mockResponse,
    );
  });

  it('should export SchedulesBI', async () => {
    const mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;
    jest.spyOn(exportSchedulesBIService, 'export').mockResolvedValue(undefined);

    await controller.exportSchedulesBI(mockResponse);

    expect(mockResponse.setHeader).toHaveBeenCalled();
    expect(exportSchedulesBIService.export).toHaveBeenCalledWith(mockResponse);
  });

  it('should export FinedWorks', async () => {
    const mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;
    jest.spyOn(exportFinedWorksService, 'export').mockResolvedValue(undefined);

    await controller.exportFinedWorks(mockResponse, '2025-09-10', '2025-09-15');

    expect(mockResponse.setHeader).toHaveBeenCalled();
    expect(exportFinedWorksService.export).toHaveBeenCalledWith(
      mockResponse,
      '2025-09-10',
      '2025-09-15',
    );
  });

  it('should export ExecutionCapacity', async () => {
    const mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;
    jest
      .spyOn(exportExecutionCapacityService, 'export')
      .mockResolvedValue(undefined);

    await controller.exportExecutionCapacity(mockResponse);

    expect(mockResponse.setHeader).toHaveBeenCalled();
    expect(exportExecutionCapacityService.export).toHaveBeenCalledWith(
      mockResponse,
    );
  });

  it('should export Suspensions', async () => {
    const mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;
    jest.spyOn(exportSuspensionsService, 'export').mockResolvedValue(undefined);

    await controller.exportSuspensions(mockResponse);

    expect(mockResponse.setHeader).toHaveBeenCalled();
    expect(exportSuspensionsService.export).toHaveBeenCalledWith(mockResponse);
  });

  it('should export execution report', async () => {
    const mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;
    jest
      .spyOn(exportExecutionReportService, 'export')
      .mockResolvedValue(undefined);

    await controller.exportExecutonReport(mockResponse);

    expect(mockResponse.setHeader).toHaveBeenCalled();
    expect(exportExecutionReportService.export).toHaveBeenCalledWith(
      mockResponse,
    );
  });
});
