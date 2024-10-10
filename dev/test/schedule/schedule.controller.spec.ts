import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ScheduleController } from 'src/modules/schedule/schedule.controller';
import { GetPendingScheduleValuesService } from 'src/modules/schedule/services/getPendingScheduleValues.service';
import { GetScheduleRestrictionsService } from 'src/modules/schedule/services/getScheduleRestrictions.service';
import { GetScheduleValuesService } from 'src/modules/schedule/services/getScheduleValues.service';
import { GetTotalValuesScheduleService } from 'src/modules/schedule/services/getTotalValuesSchedule.service';
import { GetValuesWeeklyScheduleService } from 'src/modules/schedule/services/getValuesWeeklySchedule.service';

describe('ScheduleController', () => {
  let scheduleController: ScheduleController;
  let getTotalValuesScheduleService: GetTotalValuesScheduleService;
  let getValuesWeeklyScheduleService: GetValuesWeeklyScheduleService;
  let getScheduleValuesService: GetScheduleValuesService;
  let getScheduleRestrictionsService: GetScheduleRestrictionsService;
  let getPendingScheduleValuesService: GetPendingScheduleValuesService;

  const response = {
    ovnota: '232423',
    id: 4,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [ScheduleController],
      providers: [
        {
          provide: GetTotalValuesScheduleService,
          useValue: {
            getTotalValues: jest.fn(),
          },
        },
        {
          provide: GetValuesWeeklyScheduleService,
          useValue: {
            getValues: jest.fn(),
          },
        },
        {
          provide: GetScheduleValuesService,
          useValue: {
            getValues: jest.fn(),
          },
        },
        {
          provide: GetScheduleRestrictionsService,
          useValue: {
            getRestrictions: jest.fn(),
          },
        },
        {
          provide: GetPendingScheduleValuesService,
          useValue: {
            getValues: jest.fn(),
          },
        },
      ],
    }).compile();

    scheduleController = module.get<ScheduleController>(ScheduleController);
    getTotalValuesScheduleService = module.get<GetTotalValuesScheduleService>(
      GetTotalValuesScheduleService,
    );
    getValuesWeeklyScheduleService = module.get<GetValuesWeeklyScheduleService>(
      GetValuesWeeklyScheduleService,
    );
    getScheduleValuesService = module.get<GetScheduleValuesService>(
      GetScheduleValuesService,
    );
    getScheduleRestrictionsService = module.get<GetScheduleRestrictionsService>(
      GetScheduleRestrictionsService,
    );
    getPendingScheduleValuesService =
      module.get<GetPendingScheduleValuesService>(
        GetPendingScheduleValuesService,
      );
  });

  it('Should be defined', () => {
    expect(scheduleController).toBeDefined();
  });

  it('Should call getTotalValues method and return correct data', async () => {
    const filters = {
      idRegional: 1,
      idParceira: 1,
      idMunicipio: 1,
      idGrupo: 1,
      idTipo: 1,
      idCircuito: 1,
      ano: 2024,
    };

    jest
      .spyOn(getTotalValuesScheduleService, 'getTotalValues')
      .mockResolvedValue(response);

    const result = await scheduleController.getTotalValues(filters);

    expect(result).toStrictEqual({
      statusCode: HttpStatus.OK,
      message: 'Todas as obras retornadas com sucesso',
      data: response,
    });
    expect(getTotalValuesScheduleService.getTotalValues).toHaveBeenCalledWith(
      filters,
    );
  });

  it('Should call getScheduleValues method and return correct data', async () => {
    const filters = {
      data: '17/05/2024',
      tipoFiltro: 'day',
      idRegional: 1,
      idMunicipio: 1,
      idGrupo: 1,
      idTipo: 1,
      idParceira: 1,
      executado: false,
    };

    jest
      .spyOn(getScheduleValuesService, 'getValues')
      .mockResolvedValue(response);

    const result = await scheduleController.getScheduleValues(filters);

    expect(result).toStrictEqual({
      statusCode: HttpStatus.OK,
      message: 'Valores das programações retornadas com sucesso',
      data: response,
    });
    expect(getScheduleValuesService.getValues).toHaveBeenCalledWith(filters);
  });

  it('Should call getValuesWeeklyScheduleService method and return correct data', async () => {
    const filters = {
      dataInicial: '17/05/2024',
      dataFinal: '18/05/2024',
      idRegional: 1,
      idMunicipio: 1,
      idGrupo: 1,
      idTipo: 1,
      idParceira: 1,
      executado: false,
    };

    const getValuesWeeklyScheduleServiceResponse = [
      {
        id: 5839,
        ovnota: '14417407',
        tipos: {
          tipo_abrev: 'SPACER',
        },
        programacoes: [
          {
            data_prog: new Date('2024-10-11T00:00:00.000Z'),
            hora_ini: new Date('1970-01-01T08:00:00.000Z'),
            hora_ter: new Date('1970-01-01T17:00:00.000Z'),
          },
        ],
        turmas: {
          turma: 'ENGELMIG',
        },
      },
    ];

    jest
      .spyOn(getValuesWeeklyScheduleService, 'getValues')
      .mockResolvedValue(getValuesWeeklyScheduleServiceResponse);

    const result = await scheduleController.getValuesWeeklySchedule(filters);

    expect(result).toStrictEqual({
      statusCode: HttpStatus.OK,
      message: 'Valores das programações da semana retornadas com sucesso',
      data: getValuesWeeklyScheduleServiceResponse,
    });
    expect(getValuesWeeklyScheduleService.getValues).toHaveBeenCalledWith(
      filters,
    );
  });

  it('Should call getPendingSchedule method and return correct data', async () => {
    const filters = {
      idRegional: 1,
      idParceira: 1,
    };

    jest
      .spyOn(getPendingScheduleValuesService, 'getValues')
      .mockResolvedValue(response);

    const result = await scheduleController.getPendingScheduleValues(filters);

    expect(result).toStrictEqual({
      statusCode: HttpStatus.OK,
      message: 'Valores das programações da semana retornadas com sucesso',
      data: response,
    });
    expect(getPendingScheduleValuesService.getValues).toHaveBeenCalledWith(
      filters,
    );
  });

  it('Should call getScheduleRestrictions method and return correct data', async () => {
    const filters = {
      dataInicial: '17/05/2024',
      dataFinal: '18/05/2024',
      idRegional: 1,
      idMunicipio: 1,
      idGrupo: 1,
      idTipo: 1,
      idParceira: 1,
      executado: false,
    };

    const getScheduleRestrictionsResponse = [
      {
        id: 1695,
        ovnota: '3908435',
        diagrama: null,
        ordem_dci: null,
        ordem_dcim: null,
        executado: 98,
        programacoes: [
          {
            data_prog: new Date('2024-08-04T00:00:00.000Z'),
            prog: 0,
            exec: 0,
            observacao_restricao: null,
            id_restricao_prog1: 1,
            responsabilidade1: null,
            nome_responsavel: null,
            area_responsavel1: null,
            status_restricao1: null,
            data_resolucao1: null,
            id_restricao_prog2: 1,
            responsabilidade2: null,
            nome_responsavel2: null,
            area_responsavel2: null,
            status_restricao2: null,
            data_resolucao2: null,
          },
        ],
        municipios: {
          mun: 'SJC',
          regionais: {
            regional: 'São José dos Campos',
          },
        },
        tipos: {
          tipo_obra: 'REMOÇÃO DE REDE',
        },
        turmas: {
          turma: 'ENGELMIG',
        },
      },
    ];

    jest
      .spyOn(getScheduleRestrictionsService, 'getRestrictions')
      .mockResolvedValue(getScheduleRestrictionsResponse);

    const result = await scheduleController.getScheduleRestrictions(filters);

    expect(result).toStrictEqual({
      statusCode: HttpStatus.OK,
      message: 'Restrições das programações retornadas com sucesso',
      data: getScheduleRestrictionsResponse,
    });
    expect(getScheduleRestrictionsService.getRestrictions).toHaveBeenCalledWith(
      filters,
    );
  });
});
