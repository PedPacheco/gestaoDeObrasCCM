import { Response } from 'express';
import { ExportCompletedWorksService } from 'src/application/export/exportCompletedWorks.service';
import { ExportScheduleService } from 'src/application/export/exportSchedule.service';
import { ExportWorksInPortfolioService } from 'src/application/export/exportWorksInPortfolio.service';
import { GetScheduleValuesService } from 'src/application/schedule/getScheduleValues.service';
import { ExportController } from 'src/interface/controllers/export.controller';
import { GetScheduleValuesResponse } from 'src/interface/types/schedule/getScheduleValuesInterface';
import { worksInPortfolioResponseService } from 'src/interface/types/works/getWorksInPortfolioInterface';

import { Test } from '@nestjs/testing';
import { GetWorksInPortfolioService } from 'src/application/works/getWorksInPortfolio.service';
import { GetCompletedWorksService } from 'src/application/works/getCompletedWorks.service';
import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';
import { UsersService } from 'src/application/users.service';
import { ExportWorksInPortfolioBI } from 'src/application/export/BI/exportWorkInPortfolioBI.service';
import { ExportCompletedWorksBIService } from 'src/application/export/BI/exportCompletedWorksBI.service';
import { ExportSchedulesBIService } from 'src/application/export/BI/exportSchedulesBI.service';
import { ExportFinedWorksService } from 'src/application/export/exportFinedWorks.service';
import { ExportExecutionCapacityService } from 'src/application/export/exportExecutionCapacity.service';
import { ExportSuspensionsService } from 'src/application/export/exportSuspensions.service';

const mockReq = {
  insufficientPermission: true,
  idParceira: 1,
} as unknown as Request;

describe('ExportController', () => {
  let controller: ExportController;
  let getScheduleValuesService: GetScheduleValuesService;
  let exportScheduleService: ExportScheduleService;
  let getWorksInPortfolioService: GetWorksInPortfolioService;
  let exportWorksInPortofolioService: ExportWorksInPortfolioService;
  let getCompletedWorksService: GetCompletedWorksService;
  let exportCompletedWorksService: ExportCompletedWorksService;
  let exportWorksInPortfolioBIService: ExportWorksInPortfolioBI;
  let exportCompletedWorksBIService: ExportCompletedWorksBIService;
  let exportSchedulesBIService: ExportSchedulesBIService;
  let exportFinedWorksService: ExportFinedWorksService;
  let exportExecutionCapacityService: ExportExecutionCapacityService;
  let exportSuspensionsService: ExportSuspensionsService;

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
        total_obras: 0,
        total_mo_planejada: 0,
        total_qtde_planejada: 0,
      },
    ],
    totals: {
      total_obras: 1,
      total_mo_planejada: 3262.21,
      total_mo_exec: 0,
      total_qtde_planejada: 1,
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ExportController],
      providers: [
        {
          provide: GetScheduleValuesService,
          useValue: { getValues: jest.fn() },
        },
        {
          provide: ExportScheduleService,
          useValue: { export: jest.fn() },
        },
        {
          provide: GetWorksInPortfolioService,
          useValue: { getWorksInPortfolio: jest.fn() },
        },
        { provide: UsersService, useValue: { findUser: jest.fn() } },
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
        {
          provide: ExportWorksInPortfolioBI,
          useValue: { export: jest.fn() },
        },
        {
          provide: ExportCompletedWorksBIService,
          useValue: { export: jest.fn() },
        },
        {
          provide: ExportSchedulesBIService,
          useValue: { export: jest.fn() },
        },
        {
          provide: ExportFinedWorksService,
          useValue: { export: jest.fn() },
        },
        {
          provide: ExportExecutionCapacityService,
          useValue: { export: jest.fn() },
        },
        {
          provide: ExportSuspensionsService,
          useValue: { export: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ExportController>(ExportController);
    getScheduleValuesService = module.get<GetScheduleValuesService>(
      GetScheduleValuesService,
    );
    exportScheduleService = module.get<ExportScheduleService>(
      ExportScheduleService,
    );
    getWorksInPortfolioService = module.get<GetWorksInPortfolioService>(
      GetWorksInPortfolioService,
    );
    exportWorksInPortofolioService = module.get<ExportWorksInPortfolioService>(
      ExportWorksInPortfolioService,
    );
    getCompletedWorksService = module.get<GetCompletedWorksService>(
      GetCompletedWorksService,
    );
    exportCompletedWorksService = module.get<ExportCompletedWorksService>(
      ExportCompletedWorksService,
    );
    exportWorksInPortfolioBIService = module.get<ExportWorksInPortfolioBI>(
      ExportWorksInPortfolioBI,
    );
    exportCompletedWorksBIService = module.get<ExportCompletedWorksBIService>(
      ExportCompletedWorksBIService,
    );
    exportSchedulesBIService = module.get<ExportSchedulesBIService>(
      ExportSchedulesBIService,
    );
    exportFinedWorksService = module.get<ExportFinedWorksService>(
      ExportFinedWorksService,
    );
    exportExecutionCapacityService = module.get<ExportExecutionCapacityService>(
      ExportExecutionCapacityService,
    );
    exportSuspensionsService = module.get<ExportSuspensionsService>(
      ExportSuspensionsService,
    );
  });

  it('Should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('Should call exportSchedule and return the excel file', async () => {
    const mockFilters: GetScheduleValuesDTO = {
      idParceira: [1],
      executado: false,
      pendente: false,
    };

    const mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    jest
      .spyOn(getScheduleValuesService, 'getValues')
      .mockResolvedValue(mockScheduleData);

    jest.spyOn(exportScheduleService, 'export').mockResolvedValue(undefined);

    await controller.exportSchedule(mockFilters, mockResponse, mockReq);

    expect(getScheduleValuesService.getValues).toHaveBeenCalledWith(
      mockFilters,
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="Exportação Programação"',
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(exportScheduleService.export).toHaveBeenCalledWith(
      mockScheduleData.works,
      mockResponse,
    );
  });

  it('should call exportSchedule with not restriction of id_parceira', async () => {
    const mockFilters: GetScheduleValuesDTO = {
      executado: false,
      pendente: false,
    };

    const mockReqWithoutIdParceira = {
      id_parceira: undefined,
    };

    const mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    jest
      .spyOn(getScheduleValuesService, 'getValues')
      .mockResolvedValue(mockScheduleData);

    jest.spyOn(exportScheduleService, 'export').mockResolvedValue(undefined);

    await controller.exportSchedule(
      mockFilters,
      mockResponse,
      mockReqWithoutIdParceira,
    );

    expect(getScheduleValuesService.getValues).toHaveBeenCalledWith(
      mockFilters,
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="Exportação Programação"',
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(exportScheduleService.export).toHaveBeenCalledWith(
      mockScheduleData.works,
      mockResponse,
    );
  });

  it('Should call exportWorksInPortfolio and return the excel file', async () => {
    const mockFilters = {
      page: 1,
    };

    const mockReqWithoutIdParceira = {
      insufficientPermission: undefined,
      idParceira: undefined,
    } as unknown as Request;

    const mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    jest
      .spyOn(getWorksInPortfolioService, 'getWorksInPortfolio')
      .mockResolvedValue(mockWorksData);

    jest
      .spyOn(exportWorksInPortofolioService, 'export')
      .mockResolvedValue(undefined);

    await controller.exportWorksInPortfolio(
      mockFilters,
      mockResponse,
      mockReqWithoutIdParceira,
    );

    expect(getWorksInPortfolioService.getWorksInPortfolio).toHaveBeenCalledWith(
      mockFilters,
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="Exportação obras em carteira"',
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(exportWorksInPortofolioService.export).toHaveBeenCalledWith(
      mockWorksData,
      mockResponse,
    );
  });

  it('Should call exportCompletedWorks and return the excel file', async () => {
    const mockFilters = {
      insufficientPermission: true,
      idRegional: [1],
    };

    const mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    jest
      .spyOn(getCompletedWorksService, 'getCompletedWorks')
      .mockResolvedValue(mockWorksData);

    jest
      .spyOn(exportCompletedWorksService, 'export')
      .mockResolvedValue(undefined);

    await controller.exportCompletedWorks(mockFilters, mockResponse, mockReq);

    expect(getCompletedWorksService.getCompletedWorks).toHaveBeenCalledWith(
      mockFilters,
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Disposition',
      'attachment; filename="Exportação obras executadas"',
    );
    expect(mockResponse.setHeader).toHaveBeenCalledWith(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(exportCompletedWorksService.export).toHaveBeenCalledWith(
      mockWorksData,
      mockResponse,
    );
  });
});
