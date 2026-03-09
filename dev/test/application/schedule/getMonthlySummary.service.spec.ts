import * as moment from 'moment';
import { GetMonthlySummaryService } from 'src/application/services/schedule/getMonthlySummary.service';
import { EXECUTION_CAPACITY_REPOSITORY } from 'src/domain/repositories/IExecutionCapacityRepository';
import { GET_MONTHLY_SUMMARY_REPOSITORY } from 'src/domain/repositories/schedule/IGetMonthlySummaryRepository';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';

import { Test } from '@nestjs/testing';
import { obras, programacoes } from '@prisma/client';

describe('GetMonthlySummaryService', () => {
  let service: GetMonthlySummaryService;

  const filters: GetMonthlySummaryDTO = {
    dataFinal: '30/11/2024',
    dataInicial: '01/11/2024',
    idGrupo: [1],
    idParceira: [2],
    idRegional: [3],
    idTipo: [4],
  };

  const mockExecutionCapacity: unknown[] = [];

  const mockRepository = {
    getSummary: jest.fn(),
    getSecondSummary: jest.fn(),
  };

  const mockExecutionCapacityRepository = {
    getFinancialValue: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    mockExecutionCapacityRepository.getFinancialValue.mockResolvedValue(
      mockExecutionCapacity,
    );

    const module = await Test.createTestingModule({
      providers: [
        GetMonthlySummaryService,
        { provide: GET_MONTHLY_SUMMARY_REPOSITORY, useValue: mockRepository },
        {
          provide: EXECUTION_CAPACITY_REPOSITORY,
          useValue: mockExecutionCapacityRepository,
        },
      ],
    }).compile();

    service = module.get<GetMonthlySummaryService>(GetMonthlySummaryService);
  });

  describe('getSummary', () => {
    const mockPrismaResponse = [
      {
        data_prog: moment.utc('2024-11-01').toDate(),
        prog: 100,
        exec: null,
        obras: {
          mo_planejada: 3000,
        },
      } as unknown as programacoes,
      {
        data_prog: moment.utc('2024-11-02').toDate(),
        prog: 100,
        exec: 50,
        obras: {
          mo_planejada: 3000,
        },
      } as unknown as programacoes,
      {
        data_prog: moment.utc('2024-11-02').toDate(),
        prog: 100,
        exec: 50,
        obras: {
          mo_planejada: 3000,
        },
      } as unknown as programacoes,
    ];

    it('should call getSummary on both repositories with the correct arguments', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      await service.getSummary(filters);

      expect(mockRepository.getSummary).toHaveBeenCalledWith(filters);
      expect(
        mockExecutionCapacityRepository.getFinancialValue,
      ).toHaveBeenCalledWith('2024');
    });

    it('should group records by date and accumulate totals correctly', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSummary(filters);
      expect(result).toHaveLength(2);

      const nov01 = result.find((e) => e.dataProg === '01/11/2024');
      const nov02 = result.find((e) => e.dataProg === '02/11/2024');

      expect(nov01).toBeDefined();
      expect(nov02).toBeDefined();

      expect(nov01!.totalQtde).toBe(1);
      expect(nov01!.totalMoProg).toBe(3000);
      expect(nov01!.totalMoExec).toBe(0);

      expect(nov02!.totalQtde).toBe(2);
      expect(nov02!.totalMoProg).toBe(6000);
      expect(nov02!.totalMoExec).toBe(3000);
    });

    it('should return an empty array when the repository returns no data', async () => {
      mockRepository.getSummary.mockResolvedValue([]);

      const result = await service.getSummary(filters);

      expect(result).toEqual([]);
    });

    it('should use the capacity cache and call aggregateCapacityByMonth only once per month', async () => {
      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSummary(filters);

      expect(result[0].totalMoProg).toBe(3000);
    });
  });

  describe('getSecondSummary', () => {
    const mockPrismaResponse = [
      {
        ovnota: '13906734',
        ordem_dci: '0',
        ordem_dca: '0',
        ordem_dcd: '0',
        ordem_dcim: '0',
        mo_final: null,
        mo_planejada: 40243.45360000001,
        turmas: { turma: 'START-TAU' },
        tipos: { grupos: { grupo: 'BT ZERO' } },
        programacoes: [
          {
            data_prog: moment.utc('2024-11-18').toDate(),
            prog: 100,
            exec: 0,
          },
        ],
      } as unknown as obras,
      {
        ovnota: '14032497',
        ordem_dci: '0',
        ordem_dca: '0',
        ordem_dcd: '0',
        ordem_dcim: '0',
        mo_final: null,
        mo_planejada: 3000,
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
        mo_final: null,
        mo_planejada: 4000,
        turmas: { turma: 'ENGELMIG' },
        tipos: { grupos: { grupo: 'RECOMPOSIÇÃO' } },
        programacoes: [
          {
            data_prog: moment.utc('2024-11-29').toDate(),
            prog: 100,
            exec: 50,
          },
        ],
      } as unknown as obras,
    ];

    it('should call getSecondSummary with the correct filters', async () => {
      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      await service.getSecondSummary(filters);

      expect(mockRepository.getSecondSummary).toHaveBeenCalledWith(filters);
    });

    it('should group records by grupo+turma key and accumulate totals', async () => {
      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSecondSummary(filters);

      expect(result).toHaveLength(2);

      const btZero = result.find((e) => e.grupo === 'BT ZERO');
      const recomposicao = result.find((e) => e.grupo === 'RECOMPOSIÇÃO');

      expect(btZero).toBeDefined();
      expect(recomposicao).toBeDefined();

      expect(btZero!.turma).toBe('START-TAU');
      expect(recomposicao!.turma).toBe('ENGELMIG');
    });

    it('should count unique work orders (qtdeObras) via _obrasContabilizadas deduplication', async () => {
      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSecondSummary(filters);

      const btZero = result.find((e) => e.grupo === 'BT ZERO')!;
      const recomposicao = result.find((e) => e.grupo === 'RECOMPOSIÇÃO')!;

      expect(btZero.qtdeObras).toBe(1);
      expect(recomposicao.qtdeObras).toBe(2);
    });

    it('should deduplicate the same obra when it appears twice in the dataset', async () => {
      const withDuplicate = [
        mockPrismaResponse[0],
        mockPrismaResponse[0],
      ] as unknown as obras[];

      mockRepository.getSecondSummary.mockResolvedValue(withDuplicate);

      const result = await service.getSecondSummary(filters);

      expect(result).toHaveLength(1);
      expect(result[0].qtdeObras).toBe(1);
    });

    it('should accumulate moProg and moExec across all programacoes', async () => {
      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSecondSummary(filters);

      const recomposicao = result.find((e) => e.grupo === 'RECOMPOSIÇÃO')!;

      expect(recomposicao.totalMoProg).toBe(7000);
      expect(recomposicao.totalMoExec).toBe(2000);
    });

    it('should calculate diff as (totalMoExec / totalMoProg) * 100', async () => {
      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSecondSummary(filters);

      const recomposicao = result.find((e) => e.grupo === 'RECOMPOSIÇÃO')!;
      expect(recomposicao.diff).toBeCloseTo((2000 / 7000) * 100, 5);
    });

    it('should set diff to 0 when totalMoProg is 0 (no division by zero)', async () => {
      const zeroProg = [
        {
          ...mockPrismaResponse[0],
          programacoes: [{ data_prog: new Date(), prog: 0, exec: 0 }],
        },
      ] as unknown as obras[];

      mockRepository.getSecondSummary.mockResolvedValue(zeroProg);

      const result = await service.getSecondSummary(filters);

      expect(result[0].diff).toBe(0);
    });

    it('should strip _obrasContabilizadas from the returned objects', async () => {
      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSecondSummary(filters);

      result.forEach((entry) => {
        expect(entry).not.toHaveProperty('_obrasContabilizadas');
      });
    });

    it('should return an empty array when the repository returns no data', async () => {
      mockRepository.getSecondSummary.mockResolvedValue([]);

      const result = await service.getSecondSummary(filters);

      expect(result).toEqual([]);
    });
  });
});
