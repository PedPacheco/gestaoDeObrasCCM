import * as moment from 'moment';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Test } from '@nestjs/testing';
import { obras, programacoes } from '@prisma/client';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import { GetMonthlySummaryForecastRepository } from 'src/infra/repositories/schedule/getMonthlySummaryForecastRepository';

describe('GetMonthlySummaryForecastRepository', () => {
  let prisma: PrismaService;
  let getMonthlySummaryRepository: GetMonthlySummaryForecastRepository;

  const filtersNotDefined: GetMonthlySummaryDTO = {
    dataFinal: '30/11/2024',
    dataInicial: '01/11/2024',
    idGrupo: undefined,
    idParceira: undefined,
    idRegional: undefined,
    idTipo: undefined,
  };

  const filters: GetMonthlySummaryDTO = {
    dataFinal: '30/11/2024',
    dataInicial: '01/11/2024',
    idGrupo: [1],
    idParceira: [2],
    idRegional: [3],
    idTipo: [4],
  };

  const prismaMock = {
    programacoes: {
      findMany: jest.fn(),
    },
    obras: {
      findMany: jest.fn(),
    },
  };

  const mockGetSummaryForecastResponse = [
    {
      data_prog: moment.utc('2024-11-01').toDate(),
      prog: 100,
      exec: null,
      obras: {
        capex_mat_pend: 3000,
        capex_mat_plan: 3000,
        capex_mo_pend: 2000,
        capex_mo_plan: 2000,
      },
    } as unknown as programacoes,
    {
      data_prog: moment.utc('2024-11-02').toDate(),
      prog: 100,
      exec: 50,
      obras: {
        capex_mat_pend: 0,
        capex_mat_plan: 3000,
        capex_mo_pend: 0,
        capex_mo_plan: 2000,
      },
    } as unknown as programacoes,
    {
      data_prog: moment.utc('2024-11-02').toDate(),
      prog: 100,
      exec: 50,
      obras: {
        capex_mat_pend: 0,
        capex_mat_plan: 2000,
        capex_mo_pend: 0,
        capex_mo_plan: 2000,
      },
    } as unknown as programacoes,
  ];

  const mockGetSecondSummaryResponse = [
    {
      ovnota: '13906734',
      ordem_dci: '0',
      ordem_dca: '0',
      ordem_dcd: '0',
      ordem_dcim: '0',
      capex_mat_pend: 0,
      capex_mat_plan: 2000,
      capex_mo_pend: 0,
      capex_mo_plan: 2000,
      turmas: { turma: 'START-TAU' },
      tipos: { grupos: { grupo: 'BT ZERO' } },
      programacoes: [
        { data_prog: moment.utc('2024-11-18').toDate(), prog: 100, exec: 0 },
      ],
    } as unknown as obras,
    {
      ovnota: '14032497',
      ordem_dci: '0',
      ordem_dca: '0',
      ordem_dcd: '0',
      ordem_dcim: '0',
      capex_mat_pend: 0,
      capex_mat_plan: 2000,
      capex_mo_pend: 0,
      capex_mo_plan: 2000,
      turmas: { turma: 'ENGELMIG' },
      tipos: { grupos: { grupo: 'RECOMPOSIÇÃO' } },
      programacoes: [
        {
          data_prog: moment.utc('2024-11-29').toDate(),
          prog: 100,
          exec: null,
        },
      ],
    } as unknown as obras,
    {
      ovnota: '14490588',
      ordem_dci: '0',
      ordem_dca: '0',
      ordem_dcd: '0',
      ordem_dcim: '0',
      capex_mat_pend: 3000,
      capex_mat_plan: 3000,
      capex_mo_pend: 2000,
      capex_mo_plan: 2000,
      turmas: { turma: 'ENGELMIG' },
      tipos: { grupos: { grupo: 'RECOMPOSIÇÃO' } },
      programacoes: [
        { data_prog: moment.utc('2024-11-29').toDate(), prog: 100, exec: 50 },
      ],
    } as unknown as obras,
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: prismaMock },
        GetMonthlySummaryForecastRepository,
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    getMonthlySummaryRepository =
      module.get<GetMonthlySummaryForecastRepository>(
        GetMonthlySummaryForecastRepository,
      );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GetSummary', () => {
    it('should call the method getSummary without filters and return data correctly', async () => {
      const spyPrisma = jest
        .spyOn(prisma.programacoes, 'findMany')
        .mockResolvedValue(mockGetSummaryForecastResponse);

      const result =
        await getMonthlySummaryRepository.getSummary(filtersNotDefined);

      expect(result).toEqual(mockGetSummaryForecastResponse);
      expect(spyPrisma).toHaveBeenCalledWith({
        where: {
          data_prog: {
            gte: moment.utc('2024-11-01').toDate(),
            lte: moment.utc('2024-11-30').toDate(),
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
            select: {
              capex_mat_pend: true,
              capex_mat_plan: true,
              capex_mo_pend: true,
              capex_mo_plan: true,
            },
          },
        },
        orderBy: { data_prog: 'asc' },
      });
    });

    it('should apply all filters correctly in the Prisma query', async () => {
      const spyPrisma = jest
        .spyOn(prisma.programacoes, 'findMany')
        .mockResolvedValue(mockGetSummaryForecastResponse);

      await getMonthlySummaryRepository.getSummary(filters);

      expect(spyPrisma).toHaveBeenCalledWith({
        where: {
          data_prog: {
            gte: moment.utc('2024-11-01').toDate(),
            lte: moment.utc('2024-11-30').toDate(),
          },
          obras: {
            tipos: { id_grupo: { in: [1] } },
            municipios: { id_regional: { in: [3] } },
            id_turma: { in: [2] },
            id_tipo: { in: [4] },
          },
        },
        select: {
          data_prog: true,
          prog: true,
          exec: true,
          obras: {
            select: {
              capex_mat_pend: true,
              capex_mat_plan: true,
              capex_mo_pend: true,
              capex_mo_plan: true,
            },
          },
        },
        orderBy: { data_prog: 'asc' },
      });
    });
  });

  describe('GetSecodnSummary', () => {
    it('should call the method getSummary without filters and format the results correctly', async () => {
      const spyPrisma = jest
        .spyOn(prisma.obras, 'findMany')
        .mockResolvedValue(mockGetSecondSummaryResponse);

      const result =
        await getMonthlySummaryRepository.getSecondSummary(filtersNotDefined);

      const firstItem = result[0];
      const secondItem = result[1];

      expect(result).toEqual(mockGetSecondSummaryResponse);
      expect(firstItem.turmas.turma).toBe('START-TAU');
      expect(secondItem.turmas.turma).toBe('ENGELMIG');
      expect(spyPrisma).toHaveBeenCalledWith({
        where: {
          programacoes: {
            some: {
              data_prog: {
                gte: moment.utc('2024-11-01').toDate(),
                lte: moment.utc('2024-11-30').toDate(),
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
          ordem_dci: true,
          ordem_dca: true,
          ordem_dcd: true,
          ordem_dcim: true,
          capex_mat_pend: true,
          capex_mat_plan: true,
          capex_mo_pend: true,
          capex_mo_plan: true,
          turmas: { select: { turma: true } },
          tipos: { select: { grupos: { select: { grupo: true } } } },
          programacoes: {
            where: {
              data_prog: {
                gte: moment.utc('2024-11-01').toDate(),
                lte: moment.utc('2024-11-30').toDate(),
              },
            },
            select: { data_prog: true, prog: true, exec: true },
          },
        },
        orderBy: {
          tipos: { id_grupo: 'asc' },
        },
      });
    });

    it('should apply all filters correctly in the Prisma query', async () => {
      const spyPrisma = jest
        .spyOn(prisma.obras, 'findMany')
        .mockResolvedValue(mockGetSecondSummaryResponse);

      await getMonthlySummaryRepository.getSecondSummary(filters);

      expect(spyPrisma).toHaveBeenCalledWith({
        where: {
          programacoes: {
            some: {
              data_prog: {
                gte: moment.utc('2024-11-01').toDate(),
                lte: moment.utc('2024-11-30').toDate(),
              },
            },
          },
          tipos: { id_grupo: { in: [1] } },
          municipios: { id_regional: { in: [3] } },
          id_turma: { in: [2] },
          id_tipo: { in: [4] },
        },
        select: {
          ovnota: true,
          ordem_dci: true,
          ordem_dca: true,
          ordem_dcd: true,
          ordem_dcim: true,
          capex_mat_pend: true,
          capex_mat_plan: true,
          capex_mo_pend: true,
          capex_mo_plan: true,
          turmas: { select: { turma: true } },
          tipos: { select: { grupos: { select: { grupo: true } } } },
          programacoes: {
            where: {
              data_prog: {
                gte: moment.utc('2024-11-01').toDate(),
                lte: moment.utc('2024-11-30').toDate(),
              },
            },
            select: { data_prog: true, prog: true, exec: true },
          },
        },
        orderBy: {
          tipos: { id_grupo: 'asc' },
        },
      });
    });
  });
});
