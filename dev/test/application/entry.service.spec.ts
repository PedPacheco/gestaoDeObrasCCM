import * as moment from 'moment';
import { ENTRY_REPOSITORY } from 'src/domain/repositories/IEntryRepository';

import {
  GetEntryOfWorksByDayDTO,
  GetEntryOfWorksDTO,
} from 'src/interface/dtos/entryDto';

import { Test, TestingModule } from '@nestjs/testing';
import { obras } from '@prisma/client';
import { EntryService } from 'src/application/entry.service';

describe('EntryService', () => {
  let entryService: EntryService;

  const mockRepository = {
    getValuesFromEntry: jest.fn(),
    getEntryOfWorksByDay: jest.fn(),
  };

  const mockObras = (mo_final: number | null, mo_planejada: number) => [
    {
      ovnota: 'ov1',
      mo_final,
      mo_planejada,
      entrada: new Date('2024-01-15'),
      tipos: {
        tipo_obra: 'Tipo 1',
        grupos: {
          grupo: 'Grupo 1',
        },
      },
    } as unknown as obras,
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntryService,
        { provide: ENTRY_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    entryService = module.get<EntryService>(EntryService);
  });

  it('should be defined', () => {
    expect(entryService).toBeDefined();
  });

  describe('getValuesFromEntry', () => {
    it('should return correct values with mo_final', async () => {
      const filters: GetEntryOfWorksDTO = {
        idGrupo: [1],
        idMunicipio: [1],
        idParceira: [1],
        idRegional: [1],
        idTipo: [1],
        idCircuito: [1],
        ano: 2024,
      };

      mockRepository.getValuesFromEntry.mockResolvedValue(mockObras(100, 80));

      const result = await entryService.getValuesFromEntry(filters);

      expect(mockRepository.getValuesFromEntry).toHaveBeenCalledWith(filters);

      expect(result).toEqual([
        {
          tipo: 'Tipo 1',
          grupo: 'Gru',
          total_entrada: 80,
          total_entrada_qtde: 1,
          jan_entrada: 100,
          jan_entrada_qtde: 1,
          ...Array(11)
            .fill({ fev_entrada: 0, fev_entrada_qtde: 0 })
            .reduce((acc, val, idx) => {
              const months = [
                'fev',
                'mar',
                'abr',
                'mai',
                'jun',
                'jul',
                'ago',
                'set',
                'out',
                'nov',
                'dez',
              ];
              return {
                ...acc,
                [`${months[idx]}_entrada`]: 0,
                [`${months[idx]}_entrada_qtde`]: 0,
              };
            }, {}),
        },
      ]);
    });

    it('should return correct values without mo_final', async () => {
      const filters: GetEntryOfWorksDTO = {
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: undefined,
        idTipo: undefined,
        idCircuito: undefined,
        ano: 2024,
      };

      mockRepository.getValuesFromEntry.mockResolvedValue(mockObras(null, 100));

      const result = await entryService.getValuesFromEntry(filters);

      expect(result).toEqual([
        {
          tipo: 'Tipo 1',
          grupo: 'Gru',
          total_entrada: 100,
          total_entrada_qtde: 1,
          jan_entrada: 100,
          jan_entrada_qtde: 1,
          ...Array(11)
            .fill({ fev_entrada: 0, fev_entrada_qtde: 0 })
            .reduce((acc, val, idx) => {
              const months = [
                'fev',
                'mar',
                'abr',
                'mai',
                'jun',
                'jul',
                'ago',
                'set',
                'out',
                'nov',
                'dez',
              ];
              return {
                ...acc,
                [`${months[idx]}_entrada`]: 0,
                [`${months[idx]}_entrada_qtde`]: 0,
              };
            }, {}),
        },
      ]);
    });
  });

  describe('getEntryOfWorksByDay', () => {
    it('should return values for the correct date', async () => {
      const filters: GetEntryOfWorksByDayDTO = {
        idGrupo: [1],
        idMunicipio: [1],
        idParceira: [1],
        idRegional: [1],
        idTipo: [1],
        data: new Date('04/09/2024'),
        tipoFiltro: 'day',
      };

      const mockObrasByDay = [
        {
          id: 1,
          ovnota: '4805886',
          pep: 'pep',
          diagrama: '200000',
          ordem_dci: '162344',
          ordem_dcd: '1900998',
          ordem_dca: '17088798',
          ordem_dcim: '1900886',
          entrada: moment('04/09/2024', 'DD/MM/YYYY', true).toDate(),
          prazo: 90,
          qtde_planejada: 8,
          mo_planejada: 100,
          tipos: { tipo_obra: 'BTZERO' },
          turmas: { turma: 'ENGELMIG' },
          municipios: { mun: 'SJC' },
        } as unknown as obras,
      ];

      const response = {
        ...mockObrasByDay[0],
        prazo_fim: moment('03/12/2024', 'DD/MM/YYYY', true).toDate(),
      };

      const dateRange = { equals: filters.data };

      mockRepository.getEntryOfWorksByDay.mockResolvedValue(mockObrasByDay);

      const result = await entryService.getEntryOfWorksByDay(filters);

      expect(mockRepository.getEntryOfWorksByDay).toHaveBeenCalledWith(
        filters,
        dateRange,
      );

      expect(result).toEqual({
        works: [response],
        totals: {
          total_obras: 1,
          total_mo_planejada: 100,
          total_qtde_planejada: 8,
        },
      });
    });

    it('Should return values for corretc month', async () => {
      const filters: GetEntryOfWorksByDayDTO = {
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: undefined,
        idTipo: undefined,
        data: moment('09/2024', 'MM/YYYY', true).toDate(),
        tipoFiltro: 'month',
      };

      const mockObrasByMonth = [
        {
          id: 1,
          ovnota: '4805886',
          pep: 'pep',
          diagrama: '200000',
          ordem_dci: '162344',
          ordem_dcd: '1900998',
          ordem_dca: '17088798',
          ordem_dcim: '1900886',
          entrada: moment('04/09/2024', 'DD/MM/YYYY', true).toDate(),
          prazo: 90,
          qtde_planejada: 8,
          mo_planejada: 100,
          tipos: { tipo_obra: 'BTZERO' },
          turmas: { turma: 'ENGELMIG' },
          municipios: { mun: 'SJC' },
        } as unknown as obras,
      ];

      const response = {
        ...mockObrasByMonth[0],
        prazo_fim: moment('03/12/2024', 'DD/MM/YYYY', true).toDate(),
      };

      const dateRange = {
        gte: moment(filters.data).startOf('month').toDate(),
        lte: moment(filters.data).endOf('month').startOf('day').toDate(),
      };

      mockRepository.getEntryOfWorksByDay.mockResolvedValue(mockObrasByMonth);

      const result = await entryService.getEntryOfWorksByDay(filters);

      expect(mockRepository.getEntryOfWorksByDay).toHaveBeenCalledWith(
        filters,
        dateRange,
      );

      expect(result).toEqual({
        works: [response],
        totals: {
          total_obras: 1,
          total_mo_planejada: 100,
          total_qtde_planejada: 8,
        },
      });
    });
  });
});
