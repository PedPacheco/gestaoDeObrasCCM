import { Test, TestingModule } from '@nestjs/testing';
import {
  InsertPublicationRestrictionsDTO,
  UpdatePublicationRestrictionsDTO,
} from 'src/interface/dtos/restrictionsDTO';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { RestrictionsRepository } from 'src/infra/repositories/restrictionsRepository';
import {
  mockInsertPublicationRestrictions,
  mockUpdatePublicationRestrictions,
  mockUpdatePublicationRestrictionsWithResoltuionDate,
} from '../../../test/mocks/mockRestrictions';

const getSqlString = (query: any): string => {
  if (typeof query === 'string') return query;
  if (query?.sql) return query.sql;
  if (query?.text) return query.text;
  return String(query);
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
      findMany: jest.fn(),
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
    jest.resetAllMocks();
  });

  describe('getScheduleRestrictions', () => {
    it('should apply date range filter when provided', async () => {
      await repository.getScheduleRestrictions({
        dataInicial: new Date('2024-01-01'),
        dataFinal: new Date('2024-01-31'),
      } as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('programacoes.data_prog BETWEEN');
    });

    it('should NOT apply date filter when not provided', async () => {
      await repository.getScheduleRestrictions({} as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).not.toContain('programacoes.data_prog BETWEEN');
    });

    it('should filter executado = true', async () => {
      await repository.getScheduleRestrictions({
        filterExecutado: true,
      } as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('programacoes.exec IS NOT NULL');
    });

    it('should filter executado = false', async () => {
      await repository.getScheduleRestrictions({
        filterExecutado: false,
      } as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('programacoes.exec IS NULL');
    });

    it('should NOT apply executado filter when undefined', async () => {
      await repository.getScheduleRestrictions({
        filterExecutado: undefined,
      } as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).not.toContain('programacoes.exec IS NULL');
      expect(query).not.toContain('programacoes.exec IS NOT NULL');
    });

    it('should apply multiple filters simultaneously', async () => {
      await repository.getScheduleRestrictions({
        dataInicial: new Date('2024-01-01'),
        dataFinal: new Date('2024-01-31'),
        filterExecutado: true,
        idRegional: [1],
        idMunicipio: [2],
        idTipo: [3],
        idParceira: [4],
        idRestricao: [1],
        idGrupo: [5],
        ovnota: '123',
      } as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('programacoes.data_prog BETWEEN');
      expect(query).toContain('programacoes.exec IS NOT NULL');
      expect(query).toContain('municipios.id_regional IN');
      expect(query).toContain('municipios.id IN');
      expect(query).toContain('obras.ovnota =');
      expect(query).toContain('AND (restr1.id IN');
    });
  });

  describe('getPublicationRestricion', () => {
    it('should apply date range filter when provided', async () => {
      await repository.getPublicationRestricion({
        dataInicial: new Date('2024-01-01'),
        dataFinal: new Date('2024-01-31'),
      } as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('data_conclusao BETWEEN');
    });

    it('should NOT apply date filter when not provided', async () => {
      await repository.getPublicationRestricion({} as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).not.toContain('data_conclusao BETWEEN');
    });

    it('should filter executado = true', async () => {
      await repository.getPublicationRestricion({
        filterExecutado: true,
      } as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain(
        'restricoes_publicacoes.data_resolucao IS NOT NULL',
      );
    });

    it('should filter executado = false', async () => {
      await repository.getPublicationRestricion({
        filterExecutado: false,
      } as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('restricoes_publicacoes.data_resolucao IS NULL');
    });

    it('should NOT apply executado filter when undefined', async () => {
      await repository.getPublicationRestricion({
        filterExecutado: undefined,
      } as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).not.toContain('data_resolucao IS NULL');
      expect(query).not.toContain('data_resolucao IS NOT NULL');
    });

    it('should apply all filters simultaneously', async () => {
      await repository.getPublicationRestricion({
        dataInicial: new Date('2024-01-01'),
        dataFinal: new Date('2024-01-31'),
        filterExecutado: false,
        idRegional: [1, 2],
        idMunicipio: [3, 4],
        idTipo: [5],
        idRestricao: [6],
        idTurma: [7],
        idGrupo: [8],
        ovnota: '999',
      } as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('data_conclusao BETWEEN');
      expect(query).toContain('restricoes_publicacoes.data_resolucao IS NULL');
      expect(query).toContain('municipios.id_regional IN');
      expect(query).toContain('obras.ovnota =');
    });
  });

  describe('getPublicationRestrictionsByWorkId', () => {
    it('should get publication restriction by work id', async () => {
      const id = 1;

      mockPrismaService.restricoes_publicacoes.findMany.mockResolvedValueOnce(
        {} as any,
      );

      await repository.getPublicationRestrictionByWorkId(id);

      expect(
        mockPrismaService.restricoes_publicacoes.findMany,
      ).toHaveBeenCalledWith({
        where: {
          obras: {
            OR: [
              { id: 1 },
              { ovnota: '1' },
              { ordem_dci: '1' },
              { ordem_dcd: '1' },
              { ordem_dca: '1' },
              { ordem_dcim: '1' },
              { diagrama: '1' },
            ],
          },
        },
        select: {
          restricoes: { select: { restricao: true } },
          usuario: { select: { nome_usuario: true } },
          responsabilidade: true,
          nome_responsavel: true,
          status_restricao: true,
          data_resolucao: true,
          criado_em: true,
          observacao: true,
          observacao_construcao: true,
        },
      });
    });

    it('should get publication restriction by ordem/diagrama', async () => {
      const id = 1234567891;

      mockPrismaService.restricoes_publicacoes.findMany.mockResolvedValueOnce(
        {} as any,
      );

      await repository.getPublicationRestrictionByWorkId(id);

      expect(
        mockPrismaService.restricoes_publicacoes.findMany,
      ).toHaveBeenCalledWith({
        where: {
          obras: {
            OR: [
              { id: undefined },
              { ovnota: '1234567891' },
              { ordem_dci: '1234567891' },
              { ordem_dcd: '1234567891' },
              { ordem_dca: '1234567891' },
              { ordem_dcim: '1234567891' },
              { diagrama: '1234567891' },
            ],
          },
        },
        select: {
          restricoes: { select: { restricao: true } },
          usuario: { select: { nome_usuario: true } },
          responsabilidade: true,
          nome_responsavel: true,
          status_restricao: true,
          data_resolucao: true,
          criado_em: true,
          observacao: true,
          observacao_construcao: true,
        },
      });
    });
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

      expect(query).toContain('FROM construcao_sp.programacoes p');

      expect(query).toContain('WHEN p.exec IS NULL');

      expect(query).not.toContain('p.data_prog BETWEEN');
      expect(query).not.toContain('r.id IN');
      expect(query).not.toContain('t.id IN');
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

      expect(query).toContain('p.data_prog BETWEEN');
      expect(query).toContain('r.id IN');
      expect(query).toContain('t.id IN');
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

  describe('getScheduledWorks', () => {
    it('should execute query without filters', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.getScheduledWorks({} as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('COUNT(*) AS total_programadas');

      expect(query).toContain('has_exec_restricao');

      expect(query).not.toContain('data_prog BETWEEN');
    });

    it('should apply all filters correctly', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.getScheduledWorks({
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

  describe('getReaschedulingReasons', () => {
    it('should execute query without filters', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.getReaschedulingReasons({} as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain("status_programacao IN ('Parcial', 'Cancelado')");

      expect(query).toContain('UNION ALL');

      expect(query).toContain('restricao_programacao2 AS motivo');

      expect(query).not.toContain('data_prog BETWEEN');
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

  describe('getExecutionRestrictions', () => {
    it('should execute query without filters', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.getExecutionRestrictions({} as any);

      const query = getSqlString(prismaService.$queryRaw.mock.calls[0][0]);

      expect(query).toContain('SELECT DISTINCT ovnota');

      expect(query).toContain('restricao_execucao AS restricao');

      expect(query).toContain('restricao_execucao IS NOT NULL');

      expect(query).not.toContain('data_prog BETWEEN');
    });

    it('should apply all filters correctly', async () => {
      prismaService.$queryRaw.mockResolvedValueOnce([]);

      await repository.getExecutionRestrictions({
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
          restricao: 'Sem equipe',
        },
      ];

      prismaService.$queryRaw.mockResolvedValueOnce(mockResponse);

      const result = await repository.getExecutionRestrictions({} as any);

      expect(result).toEqual(mockResponse);
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
