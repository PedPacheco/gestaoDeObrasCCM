import { HttpStatus } from '@nestjs/common';
import { TestingModule, Test } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import * as moment from 'moment';
import {
  GetEntryOfWorksByDayDTO,
  GetEntryOfWorksDTO,
} from 'src/config/dto/entryDto';
import { EntryController } from 'src/modules/entry/entry.controller';
import { EntryService } from 'src/modules/entry/entry.service';

describe('EntryController', () => {
  let entryController: EntryController;
  let entryService: EntryService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EntryController],
      providers: [
        {
          provide: EntryService,
          useValue: {
            getValuesFromEntry: jest.fn(),
            getEntryOfWorksByDay: jest.fn(),
          },
        },
      ],
    }).compile();

    entryController = module.get<EntryController>(EntryController);
    entryService = module.get<EntryService>(EntryService);
  });

  const dataResponse = [
    {
      tipo: 'BT ZERO',
      grupo: 'BT ',
      total_entrada: 3141086.667899998,
      total_entrada_qtde: 213,
      jan_entrada: 192.64,
      jan_entrada_qtde: 1,
      fev_entrada: 0,
      fev_entrada_qtde: 0,
      mar_entrada: 219623.78889999999,
      mar_entrada_qtde: 8,
      abr_entrada: 896075.5101000001,
      abr_entrada_qtde: 37,
      mai_entrada: 269727.7517,
      mai_entrada_qtde: 14,
      jun_entrada: 732929.7024000001,
      jun_entrada_qtde: 48,
      jul_entrada: 0,
      jul_entrada_qtde: 1,
      ago_entrada: 393759.58080000005,
      ago_entrada_qtde: 64,
      set_entrada: 628777.6940000001,
      set_entrada_qtde: 40,
      out_entrada: 0,
      out_entrada_qtde: 0,
      nov_entrada: 0,
      nov_entrada_qtde: 0,
      dez_entrada: 0,
      dez_entrada_qtde: 0,
    },
  ];

  it('Should be defined', () => {
    expect(entryController).toBeDefined();
  });

  describe('getEntry', () => {
    it('Should build filters, get values entry with filters and return the result with correct format', async () => {
      const entryDTO: GetEntryOfWorksDTO = {
        ano: 2024,
        idRegional: 1,
        idMunicipio: 0,
        idGrupo: 0,
        idTipo: 0,
        idParceira: 0,
        idCircuito: 0,
      };

      jest
        .spyOn(entryService, 'getValuesFromEntry')
        .mockResolvedValue(dataResponse);

      const result = await entryController.getEntry(entryDTO);

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Valores de entrada trazidos com sucesso',
        data: dataResponse,
      };

      expect(entryService.getValuesFromEntry).toHaveBeenCalledWith(entryDTO);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getEntryByDay', () => {
    it('Should build filters, get values entry with filters and return the result with correct format', async () => {
      const entryDTO: GetEntryOfWorksByDayDTO = {
        data: new Date('09/10/2024'),
        tipoFiltro: 'mes',
        idRegional: 0,
        idMunicipio: 0,
        idGrupo: 0,
        idTipo: 0,
        idParceira: 0,
      };

      jest
        .spyOn(entryService, 'getEntryOfWorksByDay')
        .mockResolvedValue(dataResponse);

      const result = await entryController.getEntryByDay(entryDTO);

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Valores de entrada trazidos com sucesso',
        data: dataResponse,
      };

      expect(entryService.getEntryOfWorksByDay).toHaveBeenCalledWith(entryDTO);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('GetEntryOfWorksDTO', () => {
    it('Should GetEntryOfWorksDTO transformer type of params', () => {
      const filters = {
        ano: '2024',
        idRegional: '2',
        idMunicipio: '4',
        idGrupo: '5',
        idTipo: '1',
        idParceira: '5',
        idCircuito: '7',
      };

      const instance = plainToInstance(GetEntryOfWorksDTO, filters);

      expect(instance.ano).toBe(2024);
      expect(instance.idRegional).toBe(2);
      expect(instance.idMunicipio).toBe(4);
      expect(instance.idGrupo).toBe(5);
      expect(instance.idTipo).toBe(1);
      expect(instance.idParceira).toBe(5);
      expect(instance.idCircuito).toBe(7);
    });
  });

  describe('GetEntryWorksByDayDTO', () => {
    it('Should GetEntryOfWorksDTO transformer type of params', () => {
      const filters = {
        data: '09/2024',
        tipoFiltro: 'mes',
        idRegional: '2',
        idMunicipio: '4',
        idGrupo: '5',
        idTipo: '1',
        idParceira: '5',
      };

      const instance = plainToInstance(GetEntryOfWorksByDayDTO, filters);

      expect(instance.idRegional).toBe(2);
      expect(instance.idMunicipio).toBe(4);
      expect(instance.idGrupo).toBe(5);
      expect(instance.idTipo).toBe(1);
      expect(instance.idParceira).toBe(5);
      expect(instance.data).toEqual(moment('09/2024', 'MM/YYYY').toDate());
    });

    it('Should GetEntryOfWorksDTO transformer type of params with data null', () => {
      const filters = {
        data: 'fsfs/2024',
        tipoFiltro: 'mes',
        idRegional: '2',
        idMunicipio: '4',
        idGrupo: '5',
        idTipo: '1',
        idParceira: '5',
      };

      const instance = plainToInstance(GetEntryOfWorksByDayDTO, filters);

      expect(instance.idRegional).toBe(2);
      expect(instance.idMunicipio).toBe(4);
      expect(instance.idGrupo).toBe(5);
      expect(instance.idTipo).toBe(1);
      expect(instance.idParceira).toBe(5);
      expect(instance.data).toEqual(null);
    });
  });
});
