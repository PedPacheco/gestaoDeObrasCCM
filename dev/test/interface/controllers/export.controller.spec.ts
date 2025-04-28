import { Response } from 'express';
import { ExportCompletedWorksService } from 'src/domain/services/export/exportCompletedWorks.service';
import { ExportScheduleService } from 'src/domain/services/export/exportSchedule.service';
import { ExportWorksInPortfolioService } from 'src/domain/services/export/exportWorksInPortfolio.service';
import { GetScheduleValuesService } from 'src/domain/services/schedule/getScheduleValues.service';
import { GetCompletedWorksService } from 'src/domain/services/works/getCompletedWorks.service';
import { GetWorksInPortfolioService } from 'src/domain/services/works/getWorksInPortfolio.service';
import { ExportController } from 'src/interface/controllers/export.controller';
import { GetScheduleValuesResponse } from 'src/interface/types/schedule/getScheduleValuesInterface';
import { worksInPortfolioResponseService } from 'src/interface/types/works/getWorksInPortfolioInterface';

import { Test } from '@nestjs/testing';

describe('ExportController', () => {
  let controller: ExportController;
  let getScheduleValuesService: GetScheduleValuesService;
  let exportScheduleService: ExportScheduleService;
  let getWorksInPortfolioService: GetWorksInPortfolioService;
  let exportWorksInPortofolioService: ExportWorksInPortfolioService;
  let getCompletedWorksService: GetCompletedWorksService;
  let exportCompletedWorksService: ExportCompletedWorksService;

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
        executado: 50,
        first_data_prog: new Date('2024-03-15T00:00:00.000Z'),
        chi: 414,
        hora_ini: '08:00',
        hora_ter: '17:00',
        equipe_linha_morta: 1,
        equipe_linha_viva: 3,
        equipe_regularizacao: 4,
        data_empreitamento: new Date('2024-02-20T00:00:00.000Z'),
        empreendimento: 'Empreendimento X',
        id: 0,
        prazo: 0,
        contagem_ocorrencias: 0,
        id_status: 0,
        tipo_servico: '',
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
      idRegional: [1],
      idMunicipio: [1],
      idGrupo: [1],
      idTipo: [1],
      idParceira: [1],
      executado: false,
      page: 1,
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
      mockScheduleData.works,
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
      idRegional: [1],
      idStatus: undefined,
      idTipo: undefined,
      page: 1,
    };

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
      idRegional: [1],
      idStatus: undefined,
      idTipo: undefined,
      page: 1,
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
