import { Test } from '@nestjs/testing';
import { obras } from '@prisma/client';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { EntryService } from 'src/modules/entry/entry.service';
import {
  GetEntryOfWorksByDayDTO,
  GetEntryOfWorksDTO,
} from 'src/config/dto/entryDto';
import * as moment from 'moment';

describe('EntryService', () => {
  let entryService: EntryService;
  let prismaService: PrismaService;

  const mockPrismaService = {
    obras: {
      findMany: jest.fn(),
    },
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
    const moduleRef = await Test.createTestingModule({
      providers: [
        EntryService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    entryService = moduleRef.get<EntryService>(EntryService);
    prismaService = moduleRef.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(entryService).toBeDefined();
  });

  describe('getValuesFromEntry', () => {
    it('should return correct values with mo_final', async () => {
      const filters: GetEntryOfWorksDTO = {
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: 1,
        idTipo: undefined,
        idCircuito: undefined,
        ano: 2024,
      };

      jest
        .spyOn(prismaService.obras, 'findMany')
        .mockResolvedValue(mockObras(100, 80));
      const result = await entryService.getValuesFromEntry(filters);

      expect(prismaService.obras.findMany).toHaveBeenCalledWith({
        where: expect.anything(),
        select: expect.anything(),
        orderBy: { tipos: { grupos: { grupo: 'asc' } } },
      });

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
        idParceira: 1,
        idRegional: undefined,
        idTipo: undefined,
        idCircuito: undefined,
        ano: 2024,
      };

      jest
        .spyOn(prismaService.obras, 'findMany')
        .mockResolvedValue(mockObras(null, 100));
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
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: 1,
        idTipo: undefined,
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

      jest
        .spyOn(prismaService.obras, 'findMany')
        .mockResolvedValue(mockObrasByDay);

      const result = await entryService.getEntryOfWorksByDay(filters);

      expect(prismaService.obras.findMany).toHaveBeenCalledWith({
        where: expect.anything(),
        select: expect.anything(),
        orderBy: { entrada: 'asc' },
      });

      expect(result).toEqual([
        {
          ...mockObrasByDay[0],
          prazo_fim: moment('03/12/2024', 'DD/MM/YYYY', true).toDate(),
          total_obras: 1,
          total_mo_planejada: 100,
          total_qtde_planejada: 8,
        },
      ]);
    });

    it('Should return values for corretc month', async () => {
      const filters: GetEntryOfWorksByDayDTO = {
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: 1,
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

      jest
        .spyOn(prismaService.obras, 'findMany')
        .mockResolvedValue(mockObrasByMonth);

      const result = await entryService.getEntryOfWorksByDay(filters);

      console.log(result);

      expect(prismaService.obras.findMany).toHaveBeenCalledWith({
        where: expect.anything(),
        select: expect.anything(),
        orderBy: { entrada: 'asc' },
      });

      expect(result).toEqual([
        {
          ...mockObrasByMonth[0],
          prazo_fim: moment('03/12/2024', 'DD/MM/YYYY', true).toDate(),
          total_obras: 1,
          total_mo_planejada: 100,
          total_qtde_planejada: 8,
        },
      ]);
    });
  });
});
