import { plainToInstance } from 'class-transformer';
import * as moment from 'moment';
import { EntryController } from 'src/interface/controllers/entry.controller';
import {
  GetEntryOfWorksByDayDTO,
  GetEntryOfWorksDTO,
} from 'src/interface/dtos/entryDto';

import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { EntryService } from 'src/application/entry.service';
import { UsersService } from 'src/application/users.service';

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
        { provide: UsersService, useValue: { findUser: jest.fn() } },
      ],
    }).compile();

    entryController = module.get<EntryController>(EntryController);
    entryService = module.get<EntryService>(EntryService);
  });

  const mockGetValuesFromEntryResponse = {
    'BT ZERO': {
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
  };

  const mockGetEntryByDayResponse = {
    works: [
      {
        id: 17617,
        ovnota: '15373379',
        pep: 'X/005016',
        diagrama: null,
        ordem_dci: '170000015211',
        ordem_dcd: '190000016813',
        ordem_dca: '150000001995',
        ordem_dcim: null,
        entrada: null,
        prazo: 0,
        prazo_fim: moment('1970-01-01', 'DD/MM/YYYY', true).toDate(),
        qtde_planejada: 0,
        mo_planejada: 91105.824,
        observ_obra: null,
        tipos: {
          tipo_obra: 'RISCO A SEGURANÇA',
        },
        turmas: {
          turma: 'ENGELMIG',
        },
        municipios: {
          mun: 'SBR',
        },
      },
    ],
    totals: {
      total_obras: 1,
      total_mo_planejada: 91105.824,
      total_qtde_planejada: 0,
    },
  };

  it('Should be defined', () => {
    expect(entryController).toBeDefined();
  });

  describe('getEntry', () => {
    it('Should build filters, get values entry with filters and return the result with correct format', async () => {
      const entryDTO: GetEntryOfWorksDTO = {
        ano: 2024,
        idRegional: [1],
        idMunicipio: [0],
        idGrupo: [0],
        idTipo: [0],
        idParceira: [0],
        idCircuito: [0],
      };

      jest
        .spyOn(entryService, 'getValuesFromEntry')
        .mockResolvedValue(Object.values(mockGetValuesFromEntryResponse));

      const result = await entryController.getEntry(entryDTO);

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Valores de entrada trazidos com sucesso',
        data: Object.values(mockGetValuesFromEntryResponse),
      };

      expect(entryService.getValuesFromEntry).toHaveBeenCalledWith(entryDTO);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('getEntryByDay', () => {
    it('Should build filters, get values entry with filters and return the result with correct format', async () => {
      const entryDTO: GetEntryOfWorksByDayDTO = {
        dataInicial: '01/12/2025',
        dataFinal: '02/12/2025',
        idRegional: [0],
        idMunicipio: [0],
        idGrupo: [0],
        idTipo: [0],
        idParceira: [0],
      };

      jest
        .spyOn(entryService, 'getEntryOfWorksByDay')
        .mockResolvedValue(mockGetEntryByDayResponse);

      const result = await entryController.getEntryByDay(entryDTO);

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Valores de entrada trazidos com sucesso',
        data: mockGetEntryByDayResponse,
      };

      expect(entryService.getEntryOfWorksByDay).toHaveBeenCalledWith(entryDTO);
      expect(result).toEqual(expectedResponse);
    });
  });

  describe('GetEntryOfWorksDTO', () => {
    it('Should GetEntryOfWorksDTO transformer type of params', () => {
      const filters = {
        ano: '2024',
        idRegional: '2,4',
        idMunicipio: '4',
        idGrupo: '5',
        idTipo: '1',
        idParceira: '5, 6',
        idCircuito: '7',
      };

      const instance = plainToInstance(GetEntryOfWorksDTO, filters);

      expect(instance.ano).toBe(2024);
      expect(instance.idRegional).toStrictEqual([2, 4]);
      expect(instance.idMunicipio).toStrictEqual([4]);
      expect(instance.idGrupo).toStrictEqual([5]);
      expect(instance.idTipo).toStrictEqual([1]);
      expect(instance.idParceira).toStrictEqual([5, 6]);
      expect(instance.idCircuito).toStrictEqual([7]);
    });
  });

  describe('GetEntryWorksByDayDTO', () => {
    it('Should GetEntryOfWorksDTO transformer type of params', () => {
      const filters = {
        dataInicial: '01/12/2025',
        dataFinal: '02/12/2025',
        idRegional: '2',
        idMunicipio: '4',
        idGrupo: '5',
        idTipo: '1',
        idParceira: '5',
      };

      const instance = plainToInstance(GetEntryOfWorksByDayDTO, filters);

      expect(instance.idRegional).toStrictEqual([2]);
      expect(instance.idMunicipio).toStrictEqual([4]);
      expect(instance.idGrupo).toStrictEqual([5]);
      expect(instance.idTipo).toStrictEqual([1]);
      expect(instance.idParceira).toStrictEqual([5]);
    });

    it('Should GetEntryOfWorksDTO transformer type of params with data null', () => {
      const filters = {
        dataInicial: '01/12/2025',
        dataFinal: '02/12/2025',
        idRegional: '2,4',
        idMunicipio: '4',
        idGrupo: '5,6',
        idTipo: '1',
        idParceira: '5',
      };

      const instance = plainToInstance(GetEntryOfWorksByDayDTO, filters);

      expect(instance.idRegional).toStrictEqual([2, 4]);
      expect(instance.idMunicipio).toStrictEqual([4]);
      expect(instance.idGrupo).toStrictEqual([5, 6]);
      expect(instance.idTipo).toStrictEqual([1]);
      expect(instance.idParceira).toStrictEqual([5]);
    });
  });
});
