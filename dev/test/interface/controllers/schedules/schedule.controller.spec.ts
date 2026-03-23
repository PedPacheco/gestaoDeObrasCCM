import { ForecastSnapshotService } from 'src/application/usecases/schedule/forecastSnapshot.service';
import { MonthlySummaryService } from 'src/application/usecases/schedule/getMonthlySummary.service';
import { GetMonthlySummaryForecastService } from 'src/application/usecases/schedule/getMonthlySummaryForecast.service';
import { GetScheduleValuesService } from 'src/application/usecases/schedule/getScheduleValues.service';
import { GetTotalValuesScheduleService } from 'src/application/usecases/schedule/getTotalValuesSchedule.service';
import { RejectionsOfSchedulesService } from 'src/application/usecases/schedule/rejectionOfSchedules.service';
import { UsersService } from 'src/application/usecases/users.service';
import { ScheduleController } from 'src/interface/controllers/schedules/schedule.controller';
import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';
import { GetScheduleValuesResponse } from 'src/interface/types/schedule/getScheduleValuesInterface';
import {
  DailyForecastSummaryTotals,
  DailySummaryEntryForecast,
  GroupForecastSummaryTotals,
  GroupTeamSummaryEntryForecast,
} from 'src/interface/types/schedule/monthlySummaryForecastInterface';
import { DailySummaryEntry } from 'src/interface/types/schedule/monthlySummaryInterface';
import { createForecastSnapshotMock } from '../../../mocks/mockAddScheduleService';

import { HttpStatus } from '@nestjs/common';
import { Test } from '@nestjs/testing';

describe('ScheduleController', () => {
  let scheduleController: ScheduleController;
  let getTotalValuesScheduleService: GetTotalValuesScheduleService;
  let getScheduleValuesService: GetScheduleValuesService;
  let getMonthlySummaryService: MonthlySummaryService;
  let rejectionsOfSchedulesService: RejectionsOfSchedulesService;
  let getMonthlySummaryForecastService: GetMonthlySummaryForecastService;
  let forecastSnapshotService: ForecastSnapshotService;

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
        mat_prog: 2345.23,
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
      total_mo_exec: 3262.21,
      total_qtde_planejada: 1,
    },
  };

  const mockReq = {
    insufficientPermission: true,
    idParceira: 1,
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
          provide: GetScheduleValuesService,
          useValue: {
            getValues: jest.fn(),
          },
        },
        {
          provide: MonthlySummaryService,
          useValue: {
            getSummary: jest.fn(),
            getSecondSummary: jest.fn(),
          },
        },
        {
          provide: GetMonthlySummaryForecastService,
          useValue: {
            getSummary: jest.fn(),
            getSecondSummary: jest.fn(),
          },
        },
        {
          provide: RejectionsOfSchedulesService,
          useValue: { get: jest.fn() },
        },
        { provide: UsersService, useValue: { findUser: jest.fn() } },
        {
          provide: ForecastSnapshotService,
          useValue: { get: jest.fn() },
        },
      ],
    }).compile();

    scheduleController = module.get<ScheduleController>(ScheduleController);
    getTotalValuesScheduleService = module.get<GetTotalValuesScheduleService>(
      GetTotalValuesScheduleService,
    );
    getScheduleValuesService = module.get<GetScheduleValuesService>(
      GetScheduleValuesService,
    );
    getMonthlySummaryService = module.get<MonthlySummaryService>(
      MonthlySummaryService,
    );
    getMonthlySummaryForecastService =
      module.get<GetMonthlySummaryForecastService>(
        GetMonthlySummaryForecastService,
      );
    rejectionsOfSchedulesService = module.get<RejectionsOfSchedulesService>(
      RejectionsOfSchedulesService,
    );
    forecastSnapshotService = module.get<ForecastSnapshotService>(
      ForecastSnapshotService,
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

  describe('GetSchedulesValues', () => {
    const filters: GetScheduleValuesDTO = {
      dataInicial: '17/05/2024',
      dataFinal: '18/05/2024',
      idRegional: [1],
      idMunicipio: [1],
      idGrupo: [1],
      idTipo: [1],
      idParceira: [1],
      idStatus: [1],
      idStatusProgramacao: [1],
      executado: false,
      pendente: false,
      page: 0,
      ovnota: '3434',
    };

    it('Should call getScheduleValues method and return correct data', async () => {
      jest
        .spyOn(getScheduleValuesService, 'getValues')
        .mockResolvedValue(mockScheduleData);

      const result = await scheduleController.getScheduleValues(
        filters,
        mockReq,
      );

      expect(result).toStrictEqual({
        statusCode: HttpStatus.OK,
        message: 'Valores das programações retornadas com sucesso',
        data: mockScheduleData,
      });
      expect(getScheduleValuesService.getValues).toHaveBeenCalledWith(filters);
    });

    it('Should not overwrite filters when req does not have idRegional or insufficientPermission', async () => {
      jest
        .spyOn(getScheduleValuesService, 'getValues')
        .mockResolvedValue(mockScheduleData);

      const result = await scheduleController.getScheduleValues(filters, {
        ...mockReq,
        idParceira: undefined,
      });

      expect(result).toStrictEqual({
        statusCode: HttpStatus.OK,
        message: 'Valores das programações retornadas com sucesso',
        data: mockScheduleData,
      });
      expect(getScheduleValuesService.getValues).toHaveBeenCalledWith(filters);
    });
  });

  it('Should call getMonthlySummary method and return correct data', async () => {
    const filters = {
      date: '11/2024',
      idRegional: [1],
      idGrupo: [1],
      idTipo: [1],
      idParceira: [1],
    };

    const dailySummaryMock: DailySummaryEntry[] = [
      {
        dataProg: '2026-03-01',
        totalQtde: 25,
        teamsTotal: 8,
        financialGoal: 15000,
        financialGoalWith8: 18000,
        diaryGoal: 1200,
        diaryGoalWith8: 1500,
        totalMoProg: 14000,
        totalMoExec: 13000,
        diff: -1000,
      },
      {
        dataProg: '2026-03-02',
        totalQtde: 30,
        teamsTotal: 10,
        financialGoal: 20000,
        financialGoalWith8: 22000,
        diaryGoal: 1600,
        diaryGoalWith8: 1800,
        totalMoProg: 19500,
        totalMoExec: 21000,
        diff: 1500,
      },
    ];

    const getSecondMonthlySummaryResponse = [
      {
        grupo: 'RECOMPOSIÇÃO',
        turma: 'ENGELMIG',
        qtdeWorks: 49,
        totalMoPlan: 1075887.9138599995,
        totalMoProg: 1075887.9138599995,
        totalMoExec: 556246.1940299999,
        totalMoPrev: 948862.9654299996,
        diff: 55,
      },
      {
        grupo: 'BT ZERO',
        turma: 'ENGELMIG',
        qtdeWorks: 19,
        totalMoPlan: 673067.8821099999,
        totalMoProg: 673067.8821099999,
        totalMoExec: 541923.11811,
        totalMoPrev: 623527.0451099998,
        diff: 98,
      },
    ];

    jest
      .spyOn(getMonthlySummaryService, 'getSummary')
      .mockResolvedValue({ summary: dailySummaryMock, totals: {} as any });

    jest.spyOn(getMonthlySummaryService, 'getSecondSummary').mockResolvedValue({
      summary: getSecondMonthlySummaryResponse,
      totals: {} as any,
    });

    const result = await scheduleController.getMonthlySummary(filters);

    expect(result).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Resumo mensal retornado com sucesso',
      data: {
        firstSummary: { summary: dailySummaryMock, totals: {} as any },
        secondSummary: {
          summary: getSecondMonthlySummaryResponse,
          totals: {} as any,
        },
      },
    });
    expect(getMonthlySummaryService.getSummary).toHaveBeenCalledWith(filters);
  });

  it('Should call getMonthlySummaryForecast method and return correct data', async () => {
    const filters = {
      date: '11/2024',
      idRegional: [1],
      idGrupo: [1],
      idTipo: [1],
      idParceira: [1],
    };

    const dailySummaryForecastMock: DailySummaryEntryForecast[] = [
      {
        dataProg: '2026-03-01',
        qtdeWorks: 20,
        teams: 6,
        financialGoal: 18000,
        diaryGoal: 1200,
        serviceMoProg: 9000,
        serviceMoPlan: 8500,
        serviceMoPend: 500,
        serviceMoExec: 8000,
        materialMoProg: 6000,
        materialMoPlan: 5800,
        materialMoPend: 200,
        materialMoExec: 5600,
        diff: -900,
        serviceMoForecast: 500,
        materialMoForecast: 200,
        isMaterialPendLowerThanProg: true,
        isServicePendLowerThanProg: true,
      },
      {
        dataProg: '2026-03-02',
        qtdeWorks: 28,
        teams: 9,
        financialGoal: 22000,
        diaryGoal: 1500,
        serviceMoProg: 11000,
        serviceMoPlan: 10500,
        serviceMoPend: 500,
        serviceMoExec: 10800,
        materialMoProg: 7000,
        materialMoPlan: 6800,
        materialMoPend: 200,
        materialMoExec: 7200,
        diff: 1000,
        serviceMoForecast: 500,
        materialMoForecast: 200,
        isMaterialPendLowerThanProg: true,
        isServicePendLowerThanProg: true,
      },
    ];

    const mockDailySummaryTotals: DailyForecastSummaryTotals = {
      totalQtdeObras: 10,
      totalTeams: 5,
      totalFinancialGoal: 50000,
      totalDiaryGoal: 2000,
      totalServiceMoProg: 15000,
      totalServiceMoPlan: 20000,
      totalServiceMoPend: 5000,
      totalServiceMoExec: 12000,
      totalServiceMoForecast: 15000,
      totalMaterialMoProg: 10000,
      totalMaterialMoPlan: 15000,
      totalMaterialMoPend: 5000,
      totalMaterialMoForecast: 10000,
      totalMaterialMoExec: 8000,
      totalDiff: 3000,
    };

    const getSecondMonthlySummaryForecastResponse: GroupTeamSummaryEntryForecast[] =
      [
        {
          grupo: 'RECOMPOSIÇÃO',
          turma: 'ENGELMIG',
          qtdeWorks: 49,
          totalServiceMoProg: 1075887.9138599995,
          totalServiceMoPlan: 0,
          totalServiceMoPend: 0,
          totalServiceMoPrev: 948862.9654299996,
          totalServiceMoExec: 556246.1940299999,
          totalMaterialMoProg: 0,
          totalMaterialMoPlan: 0,
          totalMaterialMoPend: 0,
          totalMaterialMoPrev: 0,
          totalMaterialMoExec: 0,
          diff: 55,
        },
        {
          grupo: 'BT ZERO',
          turma: 'ENGELMIG',
          qtdeWorks: 19,
          totalServiceMoProg: 673067.8821099999,
          totalServiceMoPlan: 0,
          totalServiceMoPend: 0,
          totalServiceMoPrev: 623527.0451099998,
          totalServiceMoExec: 541923.11811,
          totalMaterialMoProg: 0,
          totalMaterialMoPlan: 0,
          totalMaterialMoPend: 0,
          totalMaterialMoPrev: 0,
          totalMaterialMoExec: 0,
          diff: 98,
        },
      ];

    const mockGroupSummaryTotals: GroupForecastSummaryTotals = {
      totalWorks: 12,
      totalServiceMoProgByGrouping: 18000,
      totalServiceMoPlanByGrouping: 22000,
      totalServiceMoPendByGrouping: 4000,
      totalServiceMoExecByGrouping: 15000,
      totalMaterialMoProgByGrouping: 12000,
      totalMaterialMoPlanByGrouping: 16000,
      totalMaterialMoPendByGrouping: 4000,
      totalMaterialMoExecByGrouping: 9000,
      totalDiff: 3000,
    };

    jest
      .spyOn(getMonthlySummaryForecastService, 'getSummary')
      .mockResolvedValue({
        summary: dailySummaryForecastMock,
        totals: mockDailySummaryTotals,
      });

    jest
      .spyOn(getMonthlySummaryForecastService, 'getSecondSummary')
      .mockResolvedValue({
        summary: getSecondMonthlySummaryForecastResponse,
        totals: mockGroupSummaryTotals,
      });

    const result = await scheduleController.getMonthlySummaryForecast(filters);

    expect(result).toEqual({
      statusCode: HttpStatus.OK,
      message: 'Resumo mensal do Forecast retornado com sucesso',
      data: {
        firstSummary: {
          summary: dailySummaryForecastMock,
          totals: mockDailySummaryTotals,
        },
        secondSummary: {
          summary: getSecondMonthlySummaryForecastResponse,
          totals: mockGroupSummaryTotals,
        },
      },
    });
    expect(getMonthlySummaryForecastService.getSummary).toHaveBeenCalledWith(
      filters,
    );
  });

  it('should call getRejectionsOfSchedules and return data of rejections', async () => {
    jest.spyOn(rejectionsOfSchedulesService, 'get').mockResolvedValue([
      {
        motivo: 'CHI',
        data_prog: new Date('2025-05-17'),
        hora_ini: '08:00',
        hora_ter: '17:00',
        prog: 80,
        descricao: 'Obra sem chi',
        equip_desligado: 'transformador',
        equipe_linha_morta: 6,
        equipe_linha_viva: 0,
        equipe_regularizacao: 0,
        tipo_servico: 'DP',
        observacao_programacao: null,
      },
    ]);

    const result = await scheduleController.GetRejectionsOfSchedules(1);

    expect(result).toStrictEqual({
      statusCode: HttpStatus.OK,
      message: 'Retornados as reprovações das programções',
      data: [
        {
          motivo: 'CHI',
          data_prog: new Date('2025-05-17'),
          hora_ini: '08:00',
          hora_ter: '17:00',
          prog: 80,
          descricao: 'Obra sem chi',
          equip_desligado: 'transformador',
          equipe_linha_morta: 6,
          equipe_linha_viva: 0,
          equipe_regularizacao: 0,
          tipo_servico: 'DP',
          observacao_programacao: null,
        },
      ],
    });
  });

  it('should call forecastSnapshotService.get and return data of forecast', async () => {
    jest.spyOn(forecastSnapshotService, 'get').mockResolvedValue([
      {
        id: 1,
        geradoEm: '2026-03-01',
        nomeArquivo: 'forecast_diario',
        diario: createForecastSnapshotMock.diario,
        grupo: createForecastSnapshotMock.grupo,
      },
    ]);

    const result = await scheduleController.getForecastSnapshot({
      dataInicial: '2026-03-01',
      dataFinal: '2026-03-31',
    });

    expect(result).toStrictEqual({
      statusCode: HttpStatus.OK,
      message: 'Retornado dados do forecast',
      data: [
        {
          id: 1,
          geradoEm: '2026-03-01',
          nomeArquivo: 'forecast_diario',
          diario: createForecastSnapshotMock.diario,
          grupo: createForecastSnapshotMock.grupo,
        },
      ],
    });
  });
});
