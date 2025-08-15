import { Test } from '@nestjs/testing';
import { obras, programacoes } from '@prisma/client';

import * as moment from 'moment';
import { GET_MONTHLY_SUMMARY_REPOSITORY } from 'src/domain/repositories/schedule/IGetMonthlySummaryRepository';
import { GetMonthlySummaryService } from 'src/application/schedule/getMonthlySummary.service';
import { GetMonthlySummaryDTO } from 'src/interface/dtos/scheduleDTO';

describe('GetMonthlySummaryService', () => {
  let service: GetMonthlySummaryService;

  const filters: GetMonthlySummaryDTO = {
    date: '11/2024',
    idGrupo: [1],
    idParceira: [2],
    idRegional: [3],
    idTipo: [4],
  };

  const mockRepository = {
    getSummary: jest.fn(),
    getSecondSummary: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetMonthlySummaryService,
        { provide: GET_MONTHLY_SUMMARY_REPOSITORY, useValue: mockRepository },
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

    it('should call the method getSummary and format the results correctly', async () => {
      const mockResponse = [
        {
          dataProg: '01/11/2024',
          totalQtde: 1,
          totalMoProg: 3058,
          totalMoExec: 0,
          totalMoPrev: 3058,
        },
        {
          dataProg: '02/11/2024',
          totalQtde: 1,
          totalMoProg: 21882.1269,
          totalMoExec: 10941.06345,
          totalMoPrev: 10941.06345,
        },
      ];

      mockRepository.getSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSummary(filters);

      expect(result).toEqual(mockResponse);
      expect(mockRepository.getSummary).toHaveBeenCalledWith(filters);
    });

    it('should return empty array if no data is found', async () => {
      mockRepository.getSummary.mockResolvedValue([]);

      const result = await service.getSummary(filters);

      expect(result).toEqual([]);
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
            data_prog: moment.utc('2024-11-18').toDate(),
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
            data_prog: moment.utc('2024-11-29').toDate(),
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
            data_prog: moment.utc('2024-11-29').toDate(),
            prog: 100,
            exec: 50,
          },
        ],
      } as unknown as obras,
    ];

    it('should call the method getSecondSummary and format the results correctly', async () => {
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

      mockRepository.getSecondSummary.mockResolvedValue(mockPrismaResponse);

      const result = await service.getSecondSummary(filters);

      const firstItem = result[0];
      const secondItem = result[1];

      expect(result).toEqual(mockResponse);
      expect(firstItem.turma).toBe('START-TAU');
      expect(secondItem.turma).toBe('ENGELMIG');
      expect(mockRepository.getSecondSummary).toHaveBeenCalledWith(filters);
    });

    it('should return empty array if no data is found', async () => {
      mockRepository.getSecondSummary.mockResolvedValue([]);

      const result = await service.getSecondSummary(filters);

      expect(result).toEqual([]);
    });
  });
});
