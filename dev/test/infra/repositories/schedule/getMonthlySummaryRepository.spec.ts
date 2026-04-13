import moment from 'moment';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetMonthlySummaryRepository } from 'src/infra/repositories/schedule/getMonthlySummaryRepository';

import { Test } from '@nestjs/testing';
import { programacoes } from '@prisma/client';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';

describe('GetMonthlySummary', () => {
  let prisma: PrismaService;
  let getMonthlySummaryRepository: GetMonthlySummaryRepository;

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

  const mockGetSummaryResponse = [
    {
      data_prog: moment.utc('2024-11-01').toDate(),
      prog: 100,
      exec: null,
      obras: {
        mo_final: null,
        mo_planejada: 3058,
      },
    } as unknown as programacoes,
    {
      data_prog: moment.utc('2024-11-02').toDate(),
      prog: 100,
      exec: 50,
      obras: {
        mo_final: null,
        mo_planejada: 21882.1269,
      },
    } as unknown as programacoes,
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        { provide: PrismaService, useValue: prismaMock },
        GetMonthlySummaryRepository,
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    getMonthlySummaryRepository = module.get<GetMonthlySummaryRepository>(
      GetMonthlySummaryRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GetSummary', () => {
    it('should call the method getSummary without filters and return data correctly', async () => {
      const spyPrisma = jest
        .spyOn(prisma.programacoes, 'findMany')
        .mockResolvedValue(mockGetSummaryResponse);

      const result =
        await getMonthlySummaryRepository.getSummary(filtersNotDefined);

      expect(result).toEqual(mockGetSummaryResponse);
      expect(spyPrisma).toHaveBeenCalledWith({
        where: {
          id_status_programacao: { not: 7 },
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
              mo_planejada: true,
              mo_pend: true,
              executado: true,
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
        .mockResolvedValue(mockGetSummaryResponse);

      await getMonthlySummaryRepository.getSummary(filters);

      expect(spyPrisma).toHaveBeenCalledWith({
        where: {
          id_status_programacao: { not: 7 },
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
              mo_planejada: true,
              mo_pend: true,
              executado: true,
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
