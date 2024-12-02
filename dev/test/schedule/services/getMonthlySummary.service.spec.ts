import { Test } from '@nestjs/testing';
import { obras, programacoes } from '@prisma/client';
import { GetMonthlySummaryDTO } from 'src/config/dto/scheduleDTO';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { GetMonthlySummaryService } from 'src/modules/schedule/services/getMonthlySummary.service';

describe('GetMonthlySummaryService', () => {
  let prisma: PrismaService;
  let service: GetMonthlySummaryService;

  const filtersNotDefined: GetMonthlySummaryDTO = {
    date: '11/2024',
    idGrupo: undefined,
    idParceira: undefined,
    idRegional: undefined,
    idTipo: undefined,
  };

  const filters = {
    date: '11/2024',
    idGrupo: 1,
    idParceira: 2,
    idRegional: 3,
    idTipo: 4,
  };

  const prismaMock = {
    programacoes: {
      findMany: jest.fn(),
    },
    obras: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetMonthlySummaryService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    service = module.get<GetMonthlySummaryService>(GetMonthlySummaryService);
  });

  describe('getSummary', () => {
    const mockPrismaResponse = [
      {
        data_prog: new Date('2024-11-01T03:00:00.000Z'),
        prog: 100,
        exec: null,
        obras: {
          mo_final: null,
          mo_planejada: 3058,
        },
      } as unknown as programacoes,
      {
        data_prog: new Date('2024-11-02T03:00:00.000Z'),
        prog: 100,
        exec: 50,
        obras: {
          mo_final: null,
          mo_planejada: 21882.1269,
        },
      } as unknown as programacoes,
    ];

    it('should call the method getSummary without filters and format the results correctly', async () => {
      const mockResponse = [
        {
          dataProg: '2024-11-01',
          totalQtde: 1,
          totalMoProg: 3058,
          totalMoExec: 0,
          totalMoPrev: 3058,
        },
        {
          dataProg: '2024-11-02',
          totalQtde: 1,
          totalMoProg: 21882.1269,
          totalMoExec: 10941.06345,
          totalMoPrev: 10941.06345,
        },
      ];

      const spyPrisma = jest
        .spyOn(prisma.programacoes, 'findMany')
        .mockResolvedValue(mockPrismaResponse);

      const result = await service.getSummary(filtersNotDefined);

      expect(result).toEqual(mockResponse);
      expect(spyPrisma).toHaveBeenCalledWith({
        where: {
          data_prog: {
            gte: new Date('2024-11-01T03:00:00.000Z'),
            lt: new Date('2024-12-01T03:00:00.000Z'),
          },
          obras: {
            tipos: { id_grupo: undefined },
            municipios: { id_regional: undefined },
            id_turma: undefined,
            id_tipo: undefined,
          },
        },
        select: {
          data_prog: true,
          prog: true,
          exec: true,
          obras: {
            select: { mo_final: true, mo_planejada: true },
          },
        },
        orderBy: { data_prog: 'asc' },
      });
    });

    it('should return empty array if no data is found', async () => {
      jest.spyOn(prisma.programacoes, 'findMany').mockResolvedValue([]);

      const result = await service.getSummary(filters);

      expect(result).toEqual([]);
    });

    it('should apply all filters correctly in the Prisma query', async () => {
      const spyPrisma = jest
        .spyOn(prisma.programacoes, 'findMany')
        .mockResolvedValue(mockPrismaResponse);

      await service.getSummary(filters);

      expect(spyPrisma).toHaveBeenCalledWith({
        where: {
          data_prog: {
            gte: new Date('2024-11-01T03:00:00.000Z'),
            lt: new Date('2024-12-01T03:00:00.000Z'),
          },
          obras: {
            tipos: { id_grupo: 1 },
            municipios: { id_regional: 3 },
            id_turma: 2,
            id_tipo: 4,
          },
        },
        select: {
          data_prog: true,
          prog: true,
          exec: true,
          obras: {
            select: { mo_final: true, mo_planejada: true },
          },
        },
        orderBy: { data_prog: 'asc' },
      });
    });
  });

  describe('getSecondSummary', () => {
    const mockPrismaResponse = [
      {
        ovnota: '13906734',
        mo_final: null,
        mo_planejada: 40243.45360000001,
        turmas: {
          turma: 'START-TAU',
        },
        tipos: {
          grupos: {
            grupo: 'BT ZERO',
          },
        },
        programacoes: [
          {
            data_prog: new Date('2024-11-18T03:00:00.000Z'),
            prog: 100,
            exec: 0,
          },
        ],
      } as unknown as obras,
      {
        ovnota: '14032497',
        mo_final: null,
        mo_planejada: 2942.13,
        turmas: {
          turma: 'ENGELMIG',
        },
        tipos: {
          grupos: {
            grupo: 'RECOMPOSIÇÃO',
          },
        },
        programacoes: [
          {
            data_prog: new Date('2024-11-29T03:00:00.000Z'),
            prog: 100,
            exec: null,
          },
        ],
      } as unknown as obras,
      {
        ovnota: '14490588',
        mo_final: null,
        mo_planejada: 55343.5343,
        turmas: {
          turma: 'ENGELMIG',
        },
        tipos: {
          grupos: {
            grupo: 'BT ZERO',
          },
        },
        programacoes: [
          {
            data_prog: new Date('2024-11-29T03:00:00.000Z'),
            prog: 100,
            exec: 50,
          },
        ],
      } as unknown as obras,
    ];

    it('should call the method getSummary without filters and format the results correctly', async () => {
      const mockResponse = [
        {
          grupo: 'BT ZERO',
          turma: 'START-TAU',
          totalMoProg: 40243.45360000001,
          totalMoExec: 0,
          totalMoPrev: 0,
        },
        {
          grupo: 'RECOMPOSIÇÃO',
          turma: 'ENGELMIG',
          totalMoProg: 2942.13,
          totalMoExec: 0,
          totalMoPrev: 2942.13,
        },
        {
          grupo: 'BT ZERO',
          turma: 'ENGELMIG',
          totalMoProg: 55343.5343,
          totalMoExec: 27671.76715,
          totalMoPrev: 27671.76715,
        },
      ];

      const spyPrisma = jest
        .spyOn(prisma.obras, 'findMany')
        .mockResolvedValue(mockPrismaResponse);

      const result = await service.getSecondSummary(filtersNotDefined);

      const firstItem = result[0];
      const secondItem = result[1];

      expect(result).toEqual(mockResponse);
      expect(firstItem.turma).toBe('START-TAU');
      expect(secondItem.turma).toBe('ENGELMIG');
      expect(spyPrisma).toHaveBeenCalledWith({
        where: {
          programacoes: {
            some: {
              data_prog: {
                gte: new Date('2024-11-01T03:00:00.000Z'),
                lt: new Date('2024-12-01T03:00:00.000Z'),
              },
            },
          },
          tipos: { id_grupo: undefined },
          municipios: { id_regional: undefined },
          id_turma: undefined,
          id_tipo: undefined,
        },
        select: {
          ovnota: true,
          mo_final: true,
          mo_planejada: true,
          turmas: { select: { turma: true } },
          tipos: { select: { grupos: { select: { grupo: true } } } },
          programacoes: {
            where: {
              data_prog: {
                gte: new Date('2024-11-01T03:00:00.000Z'),
                lt: new Date('2024-12-01T03:00:00.000Z'),
              },
            },
            select: { data_prog: true, prog: true, exec: true },
          },
        },
      });
    });

    it('should return empty array if no data is found', async () => {
      jest.spyOn(prisma.obras, 'findMany').mockResolvedValue([]);

      const result = await service.getSecondSummary(filters);

      expect(result).toEqual([]);
    });

    it('should apply all filters correctly in the Prisma query', async () => {
      const spyPrisma = jest
        .spyOn(prisma.obras, 'findMany')
        .mockResolvedValue(mockPrismaResponse);

      await service.getSecondSummary(filters);

      expect(spyPrisma).toHaveBeenCalledWith({
        where: {
          programacoes: {
            some: {
              data_prog: {
                gte: new Date('2024-11-01T03:00:00.000Z'),
                lt: new Date('2024-12-01T03:00:00.000Z'),
              },
            },
          },
          tipos: { id_grupo: 1 },
          municipios: { id_regional: 3 },
          id_turma: 2,
          id_tipo: 4,
        },
        select: {
          ovnota: true,
          mo_final: true,
          mo_planejada: true,
          turmas: { select: { turma: true } },
          tipos: { select: { grupos: { select: { grupo: true } } } },
          programacoes: {
            where: {
              data_prog: {
                gte: new Date('2024-11-01T03:00:00.000Z'),
                lt: new Date('2024-12-01T03:00:00.000Z'),
              },
            },
            select: { data_prog: true, prog: true, exec: true },
          },
        },
      });
    });
  });
});
