import { Test, TestingModule } from '@nestjs/testing';
import { AdvancePartnerService } from 'src/application/usecases/advancePartner/advancePartner.service';
import { ADVANCE_PARTNER_REPOSITORY } from 'src/domain/repositories/IAdvancePartnerRepository';

describe('AdvancePartnerService', () => {
  let service: AdvancePartnerService;

  const mockRepository = {
    getRestrictionsAdvancePartner: jest.fn(),
    getGripPartner: jest.fn(),
    getReaschedulingReasons: jest.fn(),
    getSparklinesByPartner: jest.fn(),
    getWeeksByPartner: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvancePartnerService,
        { provide: ADVANCE_PARTNER_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<AdvancePartnerService>(AdvancePartnerService);

    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getRestrictionsAdvancePartner', () => {
    it('should return restrictions for partner advancement and correctly format totals from repository response', async () => {
      mockRepository.getRestrictionsAdvancePartner.mockResolvedValue([
        {
          mes: '05/2026',
          total: 50,
          sem_restricao: 25,
        },
      ]);

      const response = await service.getRestrictionsAdvancePartner({
        dataInicial: '2026-05-12',
        dataFinal: '2026-05-12',
      });

      expect(response).toEqual([
        {
          month: '05/2026',
          total: 50,
          withoutRestriction: 25,
          withRestriction: 25,
          pct: 50,
        },
      ]);
    });

    it('should return restrictions for partner advancement with total 0 and correctly format totals from repository response', async () => {
      mockRepository.getRestrictionsAdvancePartner.mockResolvedValue([
        {
          mes: '05/2026',
          total: 0,
          sem_restricao: 0,
        },
      ]);

      const response = await service.getRestrictionsAdvancePartner({
        dataInicial: '2026-05-12',
        dataFinal: '2026-05-12',
      });

      expect(response).toEqual([
        {
          month: '05/2026',
          total: 0,
          withoutRestriction: 0,
          withRestriction: 0,
          pct: 0,
        },
      ]);
    });
  });

  describe('getGripPower', () => {
    it('should return mapped partner grip data with numeric conversions and calculated percentage', async () => {
      const returnedData = [
        {
          semana: '18/2026',
          total: 50,
          executada: 25,
          executada_parcial: 10,
          nao_executada: 10,
          nao_informada: 15,
        },
      ];

      mockRepository.getGripPartner.mockResolvedValue(returnedData);

      const response = await service.getGripPartner({
        dataInicial: '2026-05-12',
        dataFinal: '2026-05-12',
      });

      expect(response).toEqual([
        {
          week: '18/2026',
          total: 50,
          executed: 25,
          partialExecuted: 10,
          notExecuted: 10,
          notInformed: 15,
          pct: 50,
        },
      ]);
    });

    it('should return percentage as 0 when total restrictions is zero', async () => {
      const returnedData = [
        {
          semana: '18/2026',
          total: 0,
          executada: 0,
          executada_parcial: 0,
          nao_executada: 0,
          nao_informada: 0,
        },
      ];

      mockRepository.getGripPartner.mockResolvedValue(returnedData);

      const response = await service.getGripPartner({});

      expect(response).toEqual([
        {
          week: '18/2026',
          total: 0,
          executed: 0,
          partialExecuted: 0,
          notExecuted: 0,
          notInformed: 0,
          pct: 0,
        },
      ]);
    });
  });

  describe('getReaschedulingReasons', () => {
    it('should return rescheduling reasons data with ovnota and motivo fields', async () => {
      const returnedData = [
        {
          ovnota: '12342545',
          motivo: 'Trânsito',
        },
      ];

      mockRepository.getReaschedulingReasons.mockResolvedValue(returnedData);

      const response = await service.getReaschedulingReasons({
        dataInicial: '2026-05-12',
        dataFinal: '2026-05-12',
      });

      expect(response).toEqual(returnedData);
    });
  });

  describe('getSparklinesByPartner', () => {
    it('should group sparkline data by partner and calculate percentages correctly', async () => {
      jest.spyOn(service as any, 'parseEliminationFilters').mockReturnValue({});

      mockRepository.getSparklinesByPartner.mockResolvedValue({
        aderencia: [
          {
            parceira: 'Parceira A',
            semana: '18/2026',
            total: 100,
            executada: 80,
          },
          {
            parceira: 'Parceira A',
            semana: '19/2026',
            total: 50,
            executada: 25,
          },
        ],
        eliminacao: [
          {
            parceira: 'Parceira A',
            semana: '18/2026',
            total: 100,
            sem_restricao: 60,
          },
          {
            parceira: 'Parceira B',
            semana: '18/2026',
            total: 100,
            sem_restricao: 60,
          },
        ],
      });

      const response = await service.getSparklinesByPartner({
        dataInicial: '2026-05-01',
        dataFinal: '2026-05-31',
      });

      expect(response).toEqual([
        {
          parceira: 'Parceira A',
          aderencia: [
            {
              semana: '18/2026',
              pct: 80,
            },
            {
              semana: '19/2026',
              pct: 50,
            },
          ],
          eliminacao: [
            {
              semana: '18/2026',
              pct: 60,
            },
          ],
        },
        {
          parceira: 'Parceira B',
          aderencia: [],
          eliminacao: [
            {
              semana: '18/2026',
              pct: 60,
            },
          ],
        },
      ]);

      expect(mockRepository.getSparklinesByPartner).toHaveBeenCalledWith({});
    });

    it('should return 0 percentage when total is zero', async () => {
      jest.spyOn(service as any, 'parseEliminationFilters').mockReturnValue({});

      mockRepository.getSparklinesByPartner.mockResolvedValue({
        aderencia: [
          {
            parceira: 'Parceira B',
            semana: '18/2026',
            total: 0,
            executada: 0,
          },
        ],
        eliminacao: [
          {
            parceira: 'Parceira B',
            semana: '18/2026',
            total: 0,
            sem_restricao: 0,
          },
        ],
      });

      const response = await service.getSparklinesByPartner({});

      expect(response).toEqual([
        {
          parceira: 'Parceira B',
          aderencia: [
            {
              semana: '18/2026',
              pct: 0,
            },
          ],
          eliminacao: [
            {
              semana: '18/2026',
              pct: 0,
            },
          ],
        },
      ]);
    });

    it('should create separate groups for different partners', async () => {
      jest.spyOn(service as any, 'parseEliminationFilters').mockReturnValue({});

      mockRepository.getSparklinesByPartner.mockResolvedValue({
        aderencia: [
          {
            parceira: 'Parceira A',
            semana: '18/2026',
            total: 100,
            executada: 50,
          },
          {
            parceira: 'Parceira B',
            semana: '18/2026',
            total: 200,
            executada: 100,
          },
        ],
        eliminacao: [],
      });

      const response = await service.getSparklinesByPartner({});

      expect(response).toEqual([
        {
          parceira: 'Parceira A',
          aderencia: [
            {
              semana: '18/2026',
              pct: 50,
            },
          ],
          eliminacao: [],
        },
        {
          parceira: 'Parceira B',
          aderencia: [
            {
              semana: '18/2026',
              pct: 50,
            },
          ],
          eliminacao: [],
        },
      ]);
    });
  });

  describe('getWeeksByPartner', () => {
    it('should return mapped weeks by partner with numeric conversion', async () => {
      jest.spyOn(service as any, 'parseEliminationFilters').mockReturnValue({});

      mockRepository.getWeeksByPartner.mockResolvedValue([
        {
          parceira: 'Parceira A',
          semanas: '12',
        },
        {
          parceira: 'Parceira B',
          semanas: '8',
        },
      ]);

      const response = await service.getWeeksByPartner({
        dataInicial: '2026-05-01',
        dataFinal: '2026-05-31',
      });

      expect(response).toEqual([
        {
          parceira: 'Parceira A',
          semanas: 12,
        },
        {
          parceira: 'Parceira B',
          semanas: 8,
        },
      ]);

      expect(mockRepository.getWeeksByPartner).toHaveBeenCalledWith({});
    });

    it('should return empty array when repository returns no data', async () => {
      jest.spyOn(service as any, 'parseEliminationFilters').mockReturnValue({});

      mockRepository.getWeeksByPartner.mockResolvedValue([]);

      const response = await service.getWeeksByPartner({});

      expect(response).toEqual([]);
    });
  });
});
