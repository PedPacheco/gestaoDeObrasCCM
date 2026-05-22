import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { AdvancePartnerRepository } from 'src/infra/repositories/advancePartnerRepository';

const getSqlString = (query: any): string => {
  if (typeof query === 'string') return query;
  if (query?.sql) return query.sql;
  if (query?.text) return query.text;
  return String(query);
};

describe('AdvancePartnerRepository', () => {
  let repository: AdvancePartnerRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdvancePartnerRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<AdvancePartnerRepository>(AdvancePartnerRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  describe('getRestrictionsAdvancePartner', () => {
    it('should execute query without filters', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.getRestrictionsAdvancePartner({} as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain(
        'FROM construcao_sp.exportacao_programacoes_obras',
      );

      expect(query).toContain(
        'status_programacao IS NULL OR UPPER(TRIM(status_programacao))',
      );

      expect(query).not.toContain('data_prog BETWEEN');
      expect(query).not.toContain('regional IN');
      expect(query).not.toContain('parceira IN');
    });

    it('should apply all filters correctly', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.getRestrictionsAdvancePartner({
        dataInicial: new Date('2024-01-01'),
        dataFinal: new Date('2024-01-31'),
        idRegional: [1],
        idParceira: [2],
      } as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('data_prog BETWEEN');
      expect(query).toContain('regional IN');
      expect(query).toContain('parceira IN');
    });
  });

  describe('getGripPartner', () => {
    it('should execute query without filters', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.getGripPartner({} as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain(
        'FROM construcao_sp.exportacao_programacoes_obras',
      );

      expect(query).toContain('WHEN exec IS NULL');

      expect(query).not.toContain('data_prog BETWEEN');
      expect(query).not.toContain('regional IN');
      expect(query).not.toContain('parceira IN');
    });

    it('should apply all filters correctly', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.getGripPartner({
        dataInicial: new Date('2024-01-01'),
        dataFinal: new Date('2024-01-31'),
        idRegional: [1],
        idParceira: [2],
      } as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('data_prog BETWEEN');
      expect(query).toContain('regional IN');
      expect(query).toContain('parceira IN');
    });

    it('should return query result correctly', async () => {
      const mockResponse = [
        {
          semana: '01/2025',
          total: 10,
        },
      ];

      prismaService.$queryRaw.mockResolvedValueOnce(mockResponse);

      const result = await repository.getGripPartner({} as any);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getReaschedulingReasons', () => {
    it('should execute query without filters', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.getReaschedulingReasons({} as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain(
        'FROM construcao_sp.exportacao_programacoes_obras',
      );

      expect(query).toContain('restricao_execucao AS motivo');

      expect(query).toContain('nome_do_responsavel_execucao AS responsavel');

      expect(query).toContain('status_programacao IS NULL');

      expect(query).not.toContain('data_prog BETWEEN');
      expect(query).not.toContain('regional IN');
      expect(query).not.toContain('parceira IN');
    });

    it('should apply all filters correctly', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.getReaschedulingReasons({
        dataInicial: new Date('2024-01-01'),
        dataFinal: new Date('2024-01-31'),
        idRegional: [1],
        idParceira: [2],
      } as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('data_prog BETWEEN');
      expect(query).toContain('regional IN');
      expect(query).toContain('parceira IN');
    });

    it('should return query result correctly', async () => {
      const mockResponse = [
        {
          ovnota: '123',
          motivo: 'Falta material',
        },
      ];

      prismaService.$queryRaw.mockResolvedValueOnce(mockResponse);

      const result = await repository.getReaschedulingReasons({} as any);

      expect(result).toEqual(mockResponse);
    });
  });

  describe('getSparklinesByPartner', () => {
    it('should execute both queries without filters', async () => {
      prismaService.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await repository.getSparklinesByPartner({} as any);

      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(2);

      const aderenciaQuery = getSqlString(
        prismaService.$queryRaw.mock.calls[0][0],
      );

      const eliminacaoQuery = getSqlString(
        prismaService.$queryRaw.mock.calls[1][0],
      );

      expect(aderenciaQuery).toContain(
        'FROM construcao_sp.exportacao_programacoes_obras',
      );

      expect(aderenciaQuery).toContain('SUM(CASE');
      expect(aderenciaQuery).toContain('executada');

      expect(eliminacaoQuery).toContain('has_restricao');
      expect(eliminacaoQuery).toContain('sem_restricao');

      expect(aderenciaQuery).not.toContain('data_prog BETWEEN');
      expect(aderenciaQuery).not.toContain('regional IN');
      expect(aderenciaQuery).not.toContain('parceira IN');

      expect(eliminacaoQuery).not.toContain('data_prog BETWEEN');
      expect(eliminacaoQuery).not.toContain('regional IN');
      expect(eliminacaoQuery).not.toContain('parceira IN');
    });

    it('should apply all filters correctly to both queries', async () => {
      prismaService.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await repository.getSparklinesByPartner({
        dataInicial: new Date('2024-01-01'),
        dataFinal: new Date('2024-01-31'),
        idRegional: [1],
        idParceira: [2],
      } as any);

      const aderenciaQuery = getSqlString(
        prismaService.$queryRaw.mock.calls[0][0],
      );

      const eliminacaoQuery = getSqlString(
        prismaService.$queryRaw.mock.calls[1][0],
      );

      expect(aderenciaQuery).toContain('data_prog BETWEEN');
      expect(aderenciaQuery).toContain('regional IN');
      expect(aderenciaQuery).toContain('parceira IN');

      expect(eliminacaoQuery).toContain('data_prog BETWEEN');
      expect(eliminacaoQuery).toContain('regional IN');
      expect(eliminacaoQuery).toContain('parceira IN');
    });

    it('should return aderencia and eliminacao query results correctly', async () => {
      const aderenciaMock = [
        {
          parceira: 'Parceira A',
          semana: '18/05/2026',
          total: 10,
          executada: 8,
        },
      ];

      const eliminacaoMock = [
        {
          parceira: 'Parceira A',
          semana: '18/05/2026',
          total: 10,
          sem_restricao: 7,
        },
      ];

      prismaService.$queryRaw
        .mockResolvedValueOnce(aderenciaMock)
        .mockResolvedValueOnce(eliminacaoMock);

      const result = await repository.getSparklinesByPartner({} as any);

      expect(result).toEqual({
        aderencia: aderenciaMock,
        eliminacao: eliminacaoMock,
      });
    });

    it('should contain grouping by partner and week', async () => {
      prismaService.$queryRaw
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await repository.getSparklinesByPartner({} as any);

      const aderenciaQuery = getSqlString(
        prismaService.$queryRaw.mock.calls[0][0],
      );

      expect(aderenciaQuery).toContain('GROUP BY parceira');
      expect(aderenciaQuery).toContain(
        '(data_prog - EXTRACT(DOW FROM data_prog)::integer)',
      );
    });
  });

  describe('getWeeksByPartner', () => {
    it('should execute query without filters', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.getWeeksByPartner({} as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('WITH semana_equipes AS');

      expect(query).toContain('cap_por_mes AS');

      expect(query).toContain('semana_com_cap AS');

      expect(query).toContain('equipes_alocadas');

      expect(query).toContain('equipes_disponiveis');

      expect(query).toContain(
        'equipes_alocadas::float / equipes_disponiveis >= 0.7',
      );

      expect(query).not.toContain('regional IN');
      expect(query).not.toContain('parceira IN');
    });

    it('should apply regional and partner filters correctly', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.getWeeksByPartner({
        idRegional: [1],
        idParceira: [2],
      } as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('regional IN');

      expect(query).toContain('parceira IN');
    });

    it('should return query result correctly', async () => {
      const mockResponse = [
        {
          parceira: 'Parceira A',
          semanas: 5,
        },
      ];

      prismaService.$queryRaw.mockResolvedValueOnce(mockResponse);

      const result = await repository.getWeeksByPartner({} as any);

      expect(result).toEqual(mockResponse);
    });

    it('should contain adjusted week filter logic', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.getWeeksByPartner({} as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain(
        'semana_inicio >= (CURRENT_DATE - EXTRACT(DOW FROM CURRENT_DATE)::integer - 7)::date',
      );
    });
  });
});
