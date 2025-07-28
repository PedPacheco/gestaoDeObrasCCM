import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UpdateSchedulesApplicationService } from 'src/application/updateSchedulesApplication.service';
import { ExecutionReportService } from 'src/domain/services/executionReport.service';
import { AddSchedulesService } from 'src/domain/services/schedule/addSchedules.service';
import { DeleteSchedulesService } from 'src/domain/services/schedule/deleteSchedules.service';
import { GetMonthlySummaryService } from 'src/domain/services/schedule/getMonthlySummary.service';
import { GetPendingScheduleValuesService } from 'src/domain/services/schedule/getPendingScheduleValues.service';
import { GetScheduleRestrictionsService } from 'src/domain/services/schedule/getScheduleRestrictions.service';
import { GetScheduleValuesService } from 'src/domain/services/schedule/getScheduleValues.service';
import { GetTotalValuesScheduleService } from 'src/domain/services/schedule/getTotalValuesSchedule.service';
import { GetValuesWeeklyScheduleService } from 'src/domain/services/schedule/getValuesWeeklySchedule.service';
import { UpdateSchedulesService } from 'src/domain/services/schedule/updateSchedules.service';
import { UsersService } from 'src/domain/services/users.service';
import { ScheduleController } from 'src/interface/controllers/schedule.controller';
import {
  SchedulesDataDTO,
  UpdateSchedulesDataDTO,
} from 'src/interface/dtos/scheduleDTO';
import { GetScheduleValuesResponse } from 'src/interface/types/schedule/getScheduleValuesInterface';

import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { mockUpdateSchedulesController } from '../../../test/mocks/mockAddScheduleService';

describe('ScheduleController', () => {
  let scheduleController: ScheduleController;
  let getTotalValuesScheduleService: GetTotalValuesScheduleService;
  let getValuesWeeklyScheduleService: GetValuesWeeklyScheduleService;
  let getScheduleValuesService: GetScheduleValuesService;
  let getScheduleRestrictionsService: GetScheduleRestrictionsService;
  let getPendingScheduleValuesService: GetPendingScheduleValuesService;
  let getMonthlySummaryService: GetMonthlySummaryService;
  let addSchedulesService: AddSchedulesService;
  let updateSchedulesService: UpdateSchedulesApplicationService;
  let deleteSchedulesService: DeleteSchedulesService;

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
      total_mo_exec: 3262.21,
      total_qtde_planejada: 1,
    },
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
        {
          provide: GetMonthlySummaryService,
          useValue: {
            getSummary: jest.fn(),
            getSecondSummary: jest.fn(),
          },
        },
        { provide: AddSchedulesService, useValue: { add: jest.fn() } },
        { provide: UpdateSchedulesService, useValue: { update: jest.fn() } },
        { provide: DeleteSchedulesService, useValue: { delete: jest.fn() } },
        { provide: UsersService, useValue: { findUser: jest.fn() } },
        { provide: ExecutionReportService, useValue: { create: jest.fn() } },
        {
          provide: UpdateSchedulesApplicationService,
          useValue: { update: jest.fn() },
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
    getMonthlySummaryService = module.get<GetMonthlySummaryService>(
      GetMonthlySummaryService,
    );
    addSchedulesService = module.get<AddSchedulesService>(AddSchedulesService);
    updateSchedulesService = module.get<UpdateSchedulesApplicationService>(
      UpdateSchedulesApplicationService,
    );
    deleteSchedulesService = module.get<DeleteSchedulesService>(
      DeleteSchedulesService,
    );
  });

  it('Should be defined', () => {
    expect(scheduleController).toBeDefined();
  });

  it('Should call getTotalValues method and return correct data', async () => {
    const filters = {
      idRegional: [1],
      idParceira: [1],
      idMunicipio: [1],
      idGrupo: [1],
      idTipo: [1],
      idCircuito: [1],
      ano: 2024,
    };

    const mockTotalValues = [
      {
        turma: 'COMPEL',
        jan: {
          prog: 0,
          exec: 0,
        },
        fev: {
          prog: 0,
          exec: 0,
        },
        mar: {
          prog: 0,
          exec: 0,
        },
        abr: {
          prog: 0,
          exec: 0,
        },
        mai: {
          prog: 0,
          exec: 0,
        },
        jun: {
          prog: 0,
          exec: 0,
        },
        jul: {
          prog: 0,
          exec: 0,
        },
        ago: {
          prog: 0,
          exec: 0,
        },
        set: {
          prog: 0,
          exec: 0,
        },
        out: {
          prog: 0,
          exec: 0,
        },
        nov: {
          prog: 0,
          exec: 0,
        },
        dez: {
          prog: 0,
          exec: 0,
        },
        total: {
          prog: 0,
          exec: 0,
        },
      },
    ];

    jest
      .spyOn(getTotalValuesScheduleService, 'getTotalValues')
      .mockResolvedValue(mockTotalValues);

    const result = await scheduleController.getTotalValues(filters);

    expect(result).toStrictEqual({
      statusCode: HttpStatus.OK,
      message: 'Todas as obras retornadas com sucesso',
      data: mockTotalValues,
    });
    expect(getTotalValuesScheduleService.getTotalValues).toHaveBeenCalledWith(
      filters,
    );
  });

  it('Should call getScheduleValues method and return correct data', async () => {
    const filters = {
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

    jest
      .spyOn(getScheduleValuesService, 'getValues')
      .mockResolvedValue(mockScheduleData);

    const result = await scheduleController.getScheduleValues(filters);

    expect(result).toStrictEqual({
      statusCode: HttpStatus.OK,
      message: 'Valores das programações retornadas com sucesso',
      data: mockScheduleData,
    });
    expect(getScheduleValuesService.getValues).toHaveBeenCalledWith(filters);
  });

  it('Should call getValuesWeeklyScheduleService method and return correct data', async () => {
    const filters = {
      dataInicial: '17/05/2024',
      dataFinal: '18/05/2024',
      idRegional: [1],
      idMunicipio: [1],
      idGrupo: [1],
      idTipo: [1],
      idParceira: [1],
      executado: false,
    };

    const getValuesWeeklyScheduleServiceResponse = [
      {
        id: 5839,
        ovnota: '14417407',
        tipo_abrev: 'SPACER',
        programacoes: [
          {
            data_prog: new Date('2024-10-11T00:00:00.000Z'),
            hora_ini: new Date('1970-01-01T08:00:00.000Z'),
            hora_ter: new Date('1970-01-01T17:00:00.000Z'),
          },
        ],
        parceira: 'ENGELMIG',
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
      idRegional: [1],
      idParceira: [1],
    };

    jest
      .spyOn(getPendingScheduleValuesService, 'getValues')
      .mockResolvedValue(mockScheduleData);

    const result = await scheduleController.getPendingScheduleValues(filters);

    expect(result).toStrictEqual({
      statusCode: HttpStatus.OK,
      message: 'Valores das programações da semana retornadas com sucesso',
      data: mockScheduleData,
    });
    expect(getPendingScheduleValuesService.getValues).toHaveBeenCalledWith(
      filters,
    );
  });

  it('Should call getScheduleRestrictions method and return correct data', async () => {
    const filters = {
      dataInicial: '17/05/2024',
      dataFinal: '18/05/2024',
      idRegional: [1],
      idMunicipio: [1],
      idGrupo: [1],
      idTipo: [1],
      idParceira: [1],
      executado: false,
    };

    const getScheduleRestrictionsResponse = [
      {
        id: 1695,
        ovnota: '3908435',
        mun: 'SJC',
        tipo: 'REMOÇÃO DE REDE',
        parceira: 'ENGELMIG',
        executado: 98,
        data_prog: new Date('2024-08-04T00:00:00.000Z'),
        prog: 0,
        exec: 0,
        observacao_restricao: null,
        restricao_prog1: 'Aviso',
        responsabilidade1: null,
        nome_responsavel: null,
        area_responsavel1: null,
        status_restricao1: null,
        data_resolucao1: null,
        restricao_prog2: 'Aviso',
        responsabilidade2: null,
        nome_responsavel2: null,
        area_responsavel2: null,
        status_restricao2: null,
        data_resolucao2: null,
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

  it('Should call getMonthlySummary method and return correct data', async () => {
    const filters = {
      date: '11/2024',
      idRegional: [1],
      idGrupo: [1],
      idTipo: [1],
      idParceira: [1],
    };

    const getMonthlySummaryResponse = [
      {
        dataProg: '2024-11-01',
        totalQtde: 5,
        totalMoProg: 103682.18347999999,
        totalMoExec: 95076.57347999999,
        totalMoPrev: 95076.57347999999,
      },
      {
        dataProg: '2024-11-02',
        totalQtde: 1,
        totalMoProg: 14459.3,
        totalMoExec: 0,
        totalMoPrev: 0,
      },
    ];

    jest
      .spyOn(getMonthlySummaryService, 'getSummary')
      .mockResolvedValue(getMonthlySummaryResponse);

    const result = await scheduleController.getMonthlySummary(filters);

    expect(result).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Resumo mensal retornado com sucesso',
      data: getMonthlySummaryResponse,
    });
    expect(getMonthlySummaryService.getSummary).toHaveBeenCalledWith(filters);
  });

  it('Should call method getSecondMonthlySummary and return data with correct format', async () => {
    const filters = {
      date: '11/2024',
      idRegional: [1],
      idGrupo: [1],
      idTipo: [1],
      idParceira: [1],
    };

    const getSecondMonthlySummaryResponse = [
      {
        grupo: 'RECOMPOSIÇÃO',
        turma: 'ENGELMIG',
        totalMoProg: 1075887.9138599995,
        totalMoExec: 556246.1940299999,
        totalMoPrev: 948862.9654299996,
      },
      {
        grupo: 'BT ZERO',
        turma: 'ENGELMIG',
        totalMoProg: 673067.8821099999,
        totalMoExec: 541923.11811,
        totalMoPrev: 623527.0451099998,
      },
    ];

    jest
      .spyOn(getMonthlySummaryService, 'getSecondSummary')
      .mockResolvedValue(getSecondMonthlySummaryResponse);

    const result = await scheduleController.getSecondMonthlySummary(filters);

    expect(result).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Resumo mensal retornado com sucesso',
      data: getSecondMonthlySummaryResponse,
    });
    expect(getMonthlySummaryService.getSecondSummary).toHaveBeenCalledWith(
      filters,
    );
  });

  it('Should call addSchedules and return message', async () => {
    jest.spyOn(addSchedulesService, 'add').mockResolvedValue();

    const date = new Date('2025-06-10T00:00:00.000Z');

    const result = await scheduleController.addSchedules({
      idWork: 3146044,
      dataProg: date,
      startTime: '08:00',
      finishTime: '07:00',
      serviceType: 'Inspeção Elétrica',
      prog: 100,
    });

    expect(result).toEqual({
      statusCode: HttpStatus.CREATED,
      message: 'Programação inserida com sucesso',
    });
    expect(addSchedulesService.add).toHaveBeenCalledWith({
      idWork: 3146044,
      dataProg: date,
      startTime: '08:00',
      finishTime: '07:00',
      serviceType: 'Inspeção Elétrica',
      prog: 100,
    });
  });

  it('Should call updateSchedules and return message', async () => {
    jest.spyOn(updateSchedulesService, 'update').mockResolvedValue();

    const result = await scheduleController.updateSchedules(
      1,
      mockUpdateSchedulesController,
    );

    expect(result).toEqual({
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Atualização da programação feita com sucesso',
    });
    expect(updateSchedulesService.update).toHaveBeenCalledWith(
      mockUpdateSchedulesController,
    );
  });

  it('Should call deleteSchedules and return message', async () => {
    jest.spyOn(deleteSchedulesService, 'delete').mockResolvedValue();

    const result = await scheduleController.deleteSchedules(1);

    expect(result).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Programação excluída com sucesso',
    });
    expect(deleteSchedulesService.delete).toHaveBeenCalledWith(1);
  });

  describe('DTO Validation', () => {
    it('should fail validation if exec is not a number', async () => {
      const payload = {
        idWork: 1,
        dataProg: new Date(),
        startTime: '08:00',
        finishTime: '10:00',
        prog: 50,
        exec: null,
      };

      const dto = plainToInstance(SchedulesDataDTO, payload);
      await validate(dto);

      expect(dto.exec).toBeNull();
    });

    it('should pass validation with correct values', async () => {
      const payload = {
        idWork: 1,
        dataProg: new Date(),
        startTime: '08:00',
        finishTime: '10:00',
        prog: 50,
        exec: 20,
      };

      const dto = plainToInstance(SchedulesDataDTO, payload);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('should validate UpdateSchedulesDataDTO with nested SchedulesDataDTO', async () => {
      const payload = {
        updateData: {
          idWork: 1,
          dataProg: new Date(),
          startTime: '08:00',
          finishTime: '10:00',
          prog: 50,
        },
      };

      const dto = plainToInstance(UpdateSchedulesDataDTO, payload);
      const errors = await validate(dto);

      expect(errors.length).toBe(0);
    });

    it('Should convert string to Date using class-transformer in SchedulesDataDTO', () => {
      const input = {
        idWork: 1,
        dataProg: '2025-06-10',
        startTime: '08:00',
        finishTime: '09:00',
        serviceType: 'Inspeção',
        prog: 1,
      };

      const dtoAdd = plainToInstance(SchedulesDataDTO, input);

      expect(dtoAdd.dataProg).toBeInstanceOf(Date);
      expect(dtoAdd.dataProg.toISOString().startsWith('2025-06-10')).toBe(true);
    });
  });
});
