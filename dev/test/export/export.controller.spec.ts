import { GetCompletedWorksService } from './../../src/modules/works/services/getCompletedWorks.service';
import { Test } from '@nestjs/testing';
import { Response } from 'express';
import { ExportController } from 'src/modules/export/export.controller';
import { ExportCompletedWorksService } from 'src/modules/export/services/exportCompletedWorks.service';
import { ExportScheduleService } from 'src/modules/export/services/exportSchedule.service';
import { ExportWorksInPortfolioService } from 'src/modules/export/services/exportWorksInPortfolio.service';
import { GetScheduleValuesService } from 'src/modules/schedule/services/getScheduleValues.service';
import { GetWorksInPortfolioService } from 'src/modules/works/services/getWorksInPortfolio.service';

describe('ExportController', () => {
  let controller: ExportController;
  let getScheduleValuesService: GetScheduleValuesService;
  let exportScheduleService: ExportScheduleService;
  let getWorksInPortfolioService: GetWorksInPortfolioService;
  let exportWorksInPortofolioService: ExportWorksInPortfolioService;
  let getCompletedWorksService: GetCompletedWorksService;
  let exportCompletedWorksService: ExportCompletedWorksService;

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
  });

  it('Should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('Should call exportSchedule and return the excel file', async () => {
    const mockFilters = {
      data: '17/05/2024',
      tipoFiltro: 'day',
      idRegional: 1,
      idMunicipio: 1,
      idGrupo: 1,
      idTipo: 1,
      idParceira: 1,
      executado: false,
    };
    const mockScheduleData = [{ key: 'value' }];
    const mockResponse = {
      setHeader: jest.fn(),
      send: jest.fn(),
    } as unknown as Response;

    jest
      .spyOn(getScheduleValuesService, 'getValues')
      .mockResolvedValue(mockScheduleData);

    jest.spyOn(exportScheduleService, 'export').mockResolvedValue(undefined);

    await controller.exportSchedule(mockFilters, mockResponse);

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
      mockScheduleData,
      mockResponse,
    );
  });

  it('Should call exportWorksInPortfolio and return the excel file', async () => {
    const mockFilters = {
      data: '09/04/2024',
      tipoFiltro: 'dia',
      idCircuito: undefined,
      idConjunto: undefined,
      idEmpreendimento: undefined,
      idOvnota: undefined,
      idGrupo: undefined,
      idMunicipio: undefined,
      idParceira: undefined,
      idRegional: 1,
      idStatus: undefined,
      idTipo: undefined,
    };
    const mockWorksData = [{ key: 'teste' }];
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

    await controller.exportWorksInPortfolio(mockFilters, mockResponse);

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
      data: '09/04/2024',
      tipoFiltro: 'dia',
      idCircuito: undefined,
      idConjunto: undefined,
      idEmpreendimento: undefined,
      idOvnota: undefined,
      idGrupo: undefined,
      idMunicipio: undefined,
      idParceira: undefined,
      idRegional: 1,
      idStatus: undefined,
      idTipo: undefined,
    };
    const mockWorksData = [{ key: 'teste' }];
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

    await controller.exportCompletedWorks(mockFilters, mockResponse);

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
