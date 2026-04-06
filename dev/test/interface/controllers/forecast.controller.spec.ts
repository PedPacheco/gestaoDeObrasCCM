import { UsersService } from 'src/application/usecases/users.service';

import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ForecastController } from 'src/interface/controllers/forecast.controller';
import { ForecastSnapshotService } from 'src/application/usecases/schedule/forecastSnapshot.service';
import { createForecastSnapshotMock } from '../../../test/mocks/mockAddScheduleService';
import * as moment from 'moment';

describe('ForecastController', () => {
  let controller: ForecastController;
  let service: ForecastSnapshotService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ForecastController],
      providers: [
        { provide: UsersService, useValue: { findUser: jest.fn() } },
        {
          provide: ForecastSnapshotService,
          useValue: {
            execute: jest.fn(),
            get: jest.fn(),
            getAll: jest.fn(),
            delete: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = moduleRef.get<ForecastController>(ForecastController);
    service = moduleRef.get<ForecastSnapshotService>(ForecastSnapshotService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call forecastSnapshotService.get and return data of forecast', async () => {
    jest.spyOn(service, 'get').mockResolvedValue({
      id: 1,
      geradoEm: '2026-03-01',
      nomeArquivo: 'forecast_diario',
      diario: createForecastSnapshotMock.diario,
      grupo: createForecastSnapshotMock.grupo,
    });

    const result = await controller.getSnapshotById(1);

    expect(result).toStrictEqual({
      statusCode: HttpStatus.OK,
      message: 'Retornado dados do forecast',
      data: {
        id: 1,
        geradoEm: '2026-03-01',
        nomeArquivo: 'forecast_diario',
        diario: createForecastSnapshotMock.diario,
        grupo: createForecastSnapshotMock.grupo,
      },
    });
  });

  it('should call saveForecastSnapshot and return message', async () => {
    jest.spyOn(service, 'execute').mockResolvedValue();

    const result = await controller.saveForecastSnapshot(
      createForecastSnapshotMock,
    );

    expect(result).toEqual({
      statusCode: HttpStatus.CREATED,
      message: 'Snapshot do forecast salvo com sucesso',
    });
    expect(service.execute).toHaveBeenCalledTimes(1);
  });

  it('should call forecastSnapshotService.getAll and return data of forecast', async () => {
    const mockResponseService = [
      {
        id: 1,
        nomeArquivo: `Relatório do dia ${moment('2026-03-24 12:19:11.1-03').format('DD/MM/YYYY HH:mm')}`,
        filtros: {
          dataInicial: '2026-03-01',
          dataFinal: '2026-03-31',
          idParceira: ['São José'],
        },
      },
    ];

    jest.spyOn(service, 'getAll').mockResolvedValue(mockResponseService);

    const result = await controller.getAllSnapshots({});

    expect(result).toStrictEqual({
      statusCode: HttpStatus.OK,
      data: mockResponseService,
    });
  });

  it('should call delete method', async () => {
    jest.spyOn(service, 'delete').mockResolvedValue();

    const result = await controller.deleteForecastSnapshot(1);

    expect(result).toEqual({
      statusCode: HttpStatus.CREATED,
      message: 'Snapshot do forecast deletado com sucesso',
    });
    expect(service.delete).toHaveBeenCalledTimes(1);
  });
});
