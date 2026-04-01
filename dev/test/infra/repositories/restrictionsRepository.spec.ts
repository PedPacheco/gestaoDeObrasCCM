import { Test, TestingModule } from '@nestjs/testing';
import {
  GetRestrictionsDTO,
  InsertPublicationRestrictionsDTO,
  UpdatePublicationRestrictionsDTO,
} from 'src/interface/dtos/restrictionsDTO';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { RestrictionsRepository } from 'src/infra/repositories/restrictionsRepository';
import {
  mockGetScheduleRestrictions,
  mockInsertPublicationRestrictions,
  mockUpdatePublicationRestrictions,
  mockUpdatePublicationRestrictionsWithResoltuionDate,
} from '../../../test/mocks/mockRestrictions';

const getSqlString = (query: any): string => {
  if (typeof query === 'string') return query;
  if (query?.sql) return query.sql;
  if (query?.strings) return query.strings.join('');
  if (Array.isArray(query)) return query.join('');
  return '';
};

describe('RestrictionsRepository', () => {
  let repository: RestrictionsRepository;
  let prismaService: jest.Mocked<PrismaService>;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
    $transaction: jest.fn(),
    restricoes_publicacoes: {
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestrictionsRepository,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    repository = module.get<RestrictionsRepository>(RestrictionsRepository);
    prismaService = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getScheduleRestrictions', () => {
    const mockScheduleRestrictions = [
      {
        id: 1,
        ovnota: 'OV001',
        diagrama: 'DG001',
        ordem_dci: 1,
        ordem_dcim: 1,
        executado: null,
        mun: 'São Paulo',
        tipo_obra: 'Construção',
        parceira: 'Turma A',
        prog_id: 1,
        data_prog: new Date('2025-01-15'),
        prog: 100,
        exec: null,
        observacao_restricao: 'Obs',
        id_restricao_prog1: 1,
        restricao1: 'Restrição 1',
        responsabilidade1: 'Empresa A',
        nome_responsavel: 'João',
        area_responsavel1: 'Engenharia',
        status_restricao1: 'Pendente',
        data_resolucao1: null,
        id_restricao_prog2: 2,
        restricao2: 'Restrição 2',
        responsabilidade2: 'Empresa B',
        nome_responsavel2: 'Maria',
        area_responsavel2: 'Qualidade',
        status_restricao2: 'Resolvido',
        data_resolucao2: new Date('2025-01-10'),
      },
    ];

    const mockTotals = [{ total_obras: 1 }];

    it('should return schedule restrictions with pagination', async () => {
      const filters = { page: 0, executado: false };

      prismaService.$queryRaw
        .mockResolvedValueOnce(mockScheduleRestrictions)
        .mockResolvedValueOnce(mockTotals);

      const result = await repository.getScheduleRestrictions(filters);

      expect(result).toEqual({
        works: mockScheduleRestrictions,
        totals: mockTotals,
      });
      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('should apply date range filter for schedule restrictions', async () => {
      const filters: GetRestrictionsDTO = {
        page: 0,
        dataInicial: '01/01/2025',
        dataFinal: '31/01/2025',
        executado: false,
      };

      prismaService.$queryRaw
        .mockResolvedValueOnce(mockScheduleRestrictions)
        .mockResolvedValueOnce(mockTotals);

      await repository.getScheduleRestrictions(filters);

      expect(prismaService.$queryRaw).toHaveBeenCalledTimes(2);
      const firstCall = prismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain('programacoes.data_prog BETWEEN');
    });

    it('should filter by executado when true', async () => {
      const filters: GetRestrictionsDTO = {
        page: 0,
        executado: true,
      };

      prismaService.$queryRaw
        .mockResolvedValueOnce(mockScheduleRestrictions)
        .mockResolvedValueOnce(mockTotals);

      await repository.getScheduleRestrictions(filters);

      const firstCall = prismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain('programacoes.exec IS NOT NULL');
    });

    it('should filter by executado when false', async () => {
      const filters: GetRestrictionsDTO = {
        page: 0,
        executado: false,
      };

      prismaService.$queryRaw
        .mockResolvedValueOnce(mockScheduleRestrictions)
        .mockResolvedValueOnce(mockTotals);

      await repository.getScheduleRestrictions(filters);

      const firstCall = prismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain('programacoes.exec IS NULL');
    });

    it('should filter by idRegional', async () => {
      const filters: GetRestrictionsDTO = {
        page: 0,
        idRegional: [1, 2, 3],
        executado: false,
      };

      prismaService.$queryRaw
        .mockResolvedValueOnce(mockScheduleRestrictions)
        .mockResolvedValueOnce(mockTotals);

      await repository.getScheduleRestrictions(filters);

      const firstCall = prismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain('municipios.id_regional IN');
    });

    it('should filter by idMunicipio', async () => {
      const filters: GetRestrictionsDTO = {
        page: 0,
        idMunicipio: [10, 20],
        executado: false,
      };

      prismaService.$queryRaw
        .mockResolvedValueOnce(mockScheduleRestrictions)
        .mockResolvedValueOnce(mockTotals);

      await repository.getScheduleRestrictions(filters);

      const firstCall = prismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain('municipios.id IN');
    });

    it('should filter by idTipo', async () => {
      const filters: GetRestrictionsDTO = {
        page: 0,
        idTipo: [5, 6],
        executado: false,
      };

      prismaService.$queryRaw
        .mockResolvedValueOnce(mockScheduleRestrictions)
        .mockResolvedValueOnce(mockTotals);

      await repository.getScheduleRestrictions(filters);

      const firstCall = prismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain('obras.id_tipo IN');
    });

    it('should filter by idRestricao', async () => {
      const filters: GetRestrictionsDTO = {
        page: 0,
        idRestricao: [5, 6],
        executado: false,
      };

      prismaService.$queryRaw
        .mockResolvedValueOnce(mockScheduleRestrictions)
        .mockResolvedValueOnce(mockTotals);

      await repository.getScheduleRestrictions(filters);

      const firstCall = prismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain('restr1.id IN');
      expect(queryString).toContain('restr2.id IN');
    });

    it('should filter by idParceira', async () => {
      const filters: GetRestrictionsDTO = {
        page: 0,
        idParceira: [7, 8],
        executado: false,
      };

      prismaService.$queryRaw
        .mockResolvedValueOnce(mockScheduleRestrictions)
        .mockResolvedValueOnce(mockTotals);

      await repository.getScheduleRestrictions(filters);

      const firstCall = prismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain('obras.id_turma IN');
    });

    it('should filter by idGrupo', async () => {
      const filters: GetRestrictionsDTO = {
        page: 0,
        idGrupo: [11, 12],
        executado: false,
      };

      prismaService.$queryRaw
        .mockResolvedValueOnce(mockScheduleRestrictions)
        .mockResolvedValueOnce(mockTotals);

      await repository.getScheduleRestrictions(filters);

      const firstCall = prismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain('tipos.id_grupo IN');
    });

    it('should filter by ovnota', async () => {
      const filters: GetRestrictionsDTO = {
        page: 0,
        ovnota: 'OV001',
        executado: false,
      };

      prismaService.$queryRaw
        .mockResolvedValueOnce(mockScheduleRestrictions)
        .mockResolvedValueOnce(mockTotals);

      await repository.getScheduleRestrictions(filters);

      const firstCall = prismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain('obras.ovnota =');
    });

    it('should apply multiple filters simultaneously', async () => {
      const filters: GetRestrictionsDTO = {
        page: 1,
        dataInicial: '01/01/2025',
        dataFinal: '31/01/2025',
        executado: true,
        idRegional: [1],
        idMunicipio: [10],
        idTipo: [5],
        idParceira: [7],
        idGrupo: [11],
        ovnota: 'OV001',
      };

      prismaService.$queryRaw
        .mockResolvedValueOnce(mockScheduleRestrictions)
        .mockResolvedValueOnce(mockTotals);

      await repository.getScheduleRestrictions(filters);

      const firstCall = prismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain('programacoes.data_prog BETWEEN');
      expect(queryString).toContain('programacoes.exec IS NOT NULL');
      expect(queryString).toContain('municipios.id_regional IN');
      expect(queryString).toContain('municipios.id IN');
      expect(queryString).toContain('obras.ovnota =');
    });

    it('should apply correct pagination offset', async () => {
      const filters: GetRestrictionsDTO = { page: 2, executado: false };

      prismaService.$queryRaw
        .mockResolvedValueOnce(mockScheduleRestrictions)
        .mockResolvedValueOnce(mockTotals);

      await repository.getScheduleRestrictions(filters);

      const firstCall = prismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain('LIMIT');
      expect(queryString).toContain('OFFSET');
    });

    it('should order results by data_prog and ovnota', async () => {
      const filters: GetRestrictionsDTO = { page: 0, executado: false };

      prismaService.$queryRaw
        .mockResolvedValueOnce(mockScheduleRestrictions)
        .mockResolvedValueOnce(mockTotals);

      await repository.getScheduleRestrictions(filters);

      const firstCall = prismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain(
        'ORDER BY programacoes.data_prog, obras.ovnota',
      );
    });
  });

  describe('getPublicationRestricion', () => {
    const mockPublicationRestrictions = [
      {
        id: 1,
        ovnota: 'OV001',
        diagrama: 'DG001',
        ordem_dci: 1,
        ordem_dcim: 1,
        executado: null,
        status: 'Em andamento',
        data_conclusao: new Date('2025-02-01'),
        mun: 'São Paulo',
        regional: 'Regional Sul',
        tipo_obra: 'Construção',
        parceira: 'Turma A',
        id_restricao_publicacao: 1,
        restricao: 'Restrição Publicação',
        id_restricao: 1,
        responsabilidade: 'Empresa X',
        nome_responsavel: 'Pedro',
        status_restricao: 'Pendente',
        data_resolucao: null,
      },
    ];

    it('should return publication restrictions', async () => {
      const filters = { page: 0, executado: false };

      mockPrismaService.$queryRaw.mockResolvedValueOnce(
        mockPublicationRestrictions,
      );

      const result = await repository.getPublicationRestricion(filters);

      expect(result).toEqual({ works: mockPublicationRestrictions });
      expect(mockPrismaService.$queryRaw).toHaveBeenCalledTimes(1);
    });

    it('should apply date range filter for publication restrictions', async () => {
      const filters: GetRestrictionsDTO = {
        page: 0,
        dataInicial: '01/01/2025',
        dataFinal: '28/02/2025',
        executado: false,
      };

      mockPrismaService.$queryRaw.mockResolvedValueOnce(
        mockPublicationRestrictions,
      );

      await repository.getPublicationRestricion(filters);

      const firstCall = mockPrismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain('data_conclusao BETWEEN');
    });

    it('should filter by executado when true for publication', async () => {
      const filters = {
        page: 0,
        executado: true,
      };

      mockPrismaService.$queryRaw.mockResolvedValueOnce(
        mockPublicationRestrictions,
      );

      await repository.getPublicationRestricion(filters);

      const firstCall = mockPrismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain(
        'restricoes_publicacoes.data_resolucao IS NOT NULL',
      );
    });

    it('should return schedule restrictions with pagination', async () => {
      const filters: GetRestrictionsDTO = { page: 0, executado: true };

      mockPrismaService.$queryRaw
        .mockResolvedValueOnce(mockGetScheduleRestrictions)
        .mockResolvedValueOnce({ totals: [{ total_obras: 1 }] });

      const result = await repository.getScheduleRestrictions(filters);

      expect(result).toEqual({
        works: mockGetScheduleRestrictions,
        totals: { totals: [{ total_obras: 1 }] },
      });
      expect(mockPrismaService.$queryRaw).toHaveBeenCalledTimes(2);
    });

    it('should order results by data_conclusao DESC', async () => {
      const filters = { page: 0, executado: false };

      mockPrismaService.$queryRaw.mockResolvedValueOnce(
        mockPublicationRestrictions,
      );
      await repository.getPublicationRestricion(filters);

      const firstCall = mockPrismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain('ORDER BY obras.data_conclusao DESC');
    });

    it('should apply all filters for publication restrictions', async () => {
      const filters = {
        page: 0,
        dataInicial: '01/01/2025',
        dataFinal: '28/02/2025',
        executado: false,
        idRegional: [1, 2],
        idMunicipio: [10, 20],
        idTipo: [5],
        idRestricao: [36],
        idParceira: [7],
        idGrupo: [11],
        ovnota: 'OV002',
      };

      mockPrismaService.$queryRaw.mockResolvedValueOnce(
        mockPublicationRestrictions,
      );

      await repository.getPublicationRestricion(filters);

      const firstCall = mockPrismaService.$queryRaw.mock.calls[0][0];
      const queryString = getSqlString(firstCall);
      expect(queryString).toContain('data_conclusao BETWEEN');
      expect(queryString).toContain(
        'restricoes_publicacoes.data_resolucao IS NULL',
      );
      expect(queryString).toContain('municipios.id_regional IN');
    });

    it('should throw error when query fails', async () => {
      const filters = { page: 0, executado: false };
      const error = new Error('Database error');

      mockPrismaService.$queryRaw.mockRejectedValueOnce(error);

      await expect(
        repository.getPublicationRestricion(filters),
      ).rejects.toThrow(error);
    });
  });

  describe('insertPublicationRestriction', () => {
    it('should insert multiple publication restrictions', async () => {
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        return callback({
          restricoes_publicacoes: {
            createMany: jest.fn().mockResolvedValue({ count: 2 }),
          },
        });
      });

      mockPrismaService.$transaction = mockTransaction;

      await repository.insertPublicationRestriction(
        mockInsertPublicationRestrictions,
      );

      expect(mockTransaction).toHaveBeenCalledTimes(1);
      expect(mockTransaction).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should map data correctly when inserting', async () => {
      const data: InsertPublicationRestrictionsDTO[] = [
        {
          id: 1,
          idRestriction: 10,
          responsibility: 'Test Company',
          responsibleName: 'Test User',
          restrictionStatus: 'Active',
          idUser: 1,
        },
      ];

      let capturedData: any;
      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        return callback({
          restricoes_publicacoes: {
            createMany: jest.fn().mockImplementation((params) => {
              capturedData = params.data;
              return Promise.resolve({ count: 1 });
            }),
          },
        });
      });

      mockPrismaService.$transaction = mockTransaction;

      await repository.insertPublicationRestriction(data);

      expect(capturedData).toEqual([
        {
          id_obra: 1,
          id_restricao: 10,
          responsabilidade: 'Test Company',
          nome_responsavel: 'Test User',
          status_restricao: 'Active',
          criado_por: 1,
        },
      ]);
    });

    it('should handle empty array', async () => {
      const data: InsertPublicationRestrictionsDTO[] = [];

      const mockTransaction = jest.fn().mockImplementation(async (callback) => {
        return callback({
          restricoes_publicacoes: {
            createMany: jest.fn().mockResolvedValue({ count: 0 }),
          },
        });
      });

      prismaService.$transaction = mockTransaction;

      await repository.insertPublicationRestriction(data);

      expect(mockTransaction).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePublicationRestriction', () => {
    it('should update publication restriction with all fields', async () => {
      mockPrismaService.restricoes_publicacoes.update.mockResolvedValueOnce(
        {} as any,
      );

      await repository.updatePublicationRestriction(
        mockUpdatePublicationRestrictionsWithResoltuionDate,
      );

      expect(prismaService.restricoes_publicacoes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          id_restricao: 10,
          responsabilidade: 'ENGENHARIA',
          nome_responsavel: 'Carlos Oliveira',
          status_restricao: 'ABERTA',
          data_resolucao: '17-12-2025',
        },
      });
    });

    it('should update publication restriction with null resolutionDate', async () => {
      mockPrismaService.restricoes_publicacoes.update.mockResolvedValueOnce(
        {} as any,
      );

      await repository.updatePublicationRestriction(
        mockUpdatePublicationRestrictions,
      );

      expect(prismaService.restricoes_publicacoes.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: {
          id_restricao: 10,
          responsabilidade: 'ENGENHARIA',
          nome_responsavel: 'Carlos Oliveira',
          status_restricao: 'ABERTA',
          data_resolucao: undefined,
        },
      });
    });

    it('should throw error when update fails', async () => {
      const data: UpdatePublicationRestrictionsDTO = {
        id: 999,
        idRestriction: 10,
        responsibility: 'Company',
        responsibleName: 'User',
        restrictionStatus: 'Pendente',
        idUser: 1,
      };

      const error = new Error('Record not found');
      mockPrismaService.restricoes_publicacoes.update.mockRejectedValueOnce(
        error,
      );

      await expect(
        repository.updatePublicationRestriction(data),
      ).rejects.toThrow(error);
    });
  });

  describe('deletePublicationRestriction', () => {
    it('should delete publication restriction by id', async () => {
      const id = 1;

      mockPrismaService.restricoes_publicacoes.delete.mockResolvedValueOnce(
        {} as any,
      );

      await repository.deletePublicationRestriction(id);

      expect(
        mockPrismaService.restricoes_publicacoes.delete,
      ).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should delete publication restriction with different id', async () => {
      const id = 999;

      mockPrismaService.restricoes_publicacoes.delete.mockResolvedValueOnce(
        {} as any,
      );

      await repository.deletePublicationRestriction(id);

      expect(
        mockPrismaService.restricoes_publicacoes.delete,
      ).toHaveBeenCalledWith({
        where: { id: 999 },
      });
    });

    it('should throw error when delete fails', async () => {
      const id = 999;
      const error = new Error('Record not found');

      mockPrismaService.restricoes_publicacoes.delete.mockRejectedValueOnce(
        error,
      );

      await expect(repository.deletePublicationRestriction(id)).rejects.toThrow(
        error,
      );
    });
  });
});
