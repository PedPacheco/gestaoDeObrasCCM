import * as moment from 'moment';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Test } from '@nestjs/testing';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';
import { GetMonthlySummaryForecastRepository } from 'src/infra/repositories/schedule/getMonthlySummaryForecastRepository';
// import { GetMonthlySummaryForecastInterface } from 'src/interface/types/schedule/getMonthlySummaryForecastInterface';

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

  const mockGetSummaryForecastResponse: any[] = [
    {
      data_prog: moment.utc('2024-11-01').toDate(),
      prog: 100,
      exec: null,
      equipe_linha_morta: 1,
      equipe_linha_viva: 0,
      equipe_regularizacao: 0,
      obras: {
        ovnota: 'OV001',
        ordem_dci: 'DCI001',
        ordem_dca: 'DCA001',
        ordem_dcd: 'DCD001',
        ordem_dcim: 'DCIM001',
        capex_mat_pend: 3000,
        capex_mat_plan: 3000,
        capex_mo_pend: 2000,
        capex_mo_plan: 2000,
        turmas: {
          turma: 'Turma A',
        },
        tipos: {
          grupos: {
            grupo: 'Grupo 1',
          },
        },
      },
    },
    {
      data_prog: moment.utc('2024-11-02').toDate(),
      prog: 100,
      exec: 50,
      equipe_linha_morta: 0,
      equipe_linha_viva: 1,
      equipe_regularizacao: 0,
      obras: {
        ovnota: 'OV002',
        ordem_dci: 'DCI002',
        ordem_dca: 'DCA002',
        ordem_dcd: 'DCD002',
        ordem_dcim: 'DCIM002',
        capex_mat_pend: 0,
        capex_mat_plan: 3000,
        capex_mo_pend: 0,
        capex_mo_plan: 2000,
        turmas: {
          turma: 'Turma B',
        },
        tipos: {
          grupos: {
            grupo: 'Grupo 1',
          },
        },
      },
    },
    {
      data_prog: moment.utc('2024-11-02').toDate(),
      prog: 100,
      exec: 50,
      equipe_linha_morta: 0,
      equipe_linha_viva: 0,
      equipe_regularizacao: 1,
      obras: {
        ovnota: 'OV003',
        ordem_dci: 'DCI003',
        ordem_dca: 'DCA003',
        ordem_dcd: 'DCD003',
        ordem_dcim: 'DCIM003',
        capex_mat_pend: 0,
        capex_mat_plan: 2000,
        capex_mo_pend: 0,
        capex_mo_plan: 2000,
        turmas: {
          turma: 'Turma C',
        },
        tipos: {
          grupos: {
            grupo: 'Grupo 2',
          },
        },
      },
    },
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
          equipe_linha_morta: true,
          equipe_linha_viva: true,
          equipe_regularizacao: true,
          obras: {
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
          equipe_linha_morta: true,
          equipe_linha_viva: true,
          equipe_regularizacao: true,
          obras: {
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
            },
          },
        },
        orderBy: { data_prog: 'asc' },
      });
    });
  });
});
