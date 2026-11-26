import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { WorkFiltersInput } from 'src/application/types';
import { DbSchema } from 'src/infra/prisma/dbSchema.provider';

import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetWorksInPortfolioRepository } from 'src/infra/repositories/works/management/getWorksInPortfolioRepository';

describe('GetWorksInPortfolioRepository', () => {
  let repository: GetWorksInPortfolioRepository;

  // Schema "falso": garante que o repositório não tem construcao_sp fixo
  const SCHEMA = 'schema_teste';

  function normalizeSQL(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim();
  }

  const mockPrisma = {
    $queryRaw: vi.fn(),
  };

  const mockConfigService = {
    getOrThrow: vi.fn().mockReturnValue(SCHEMA),
  };

  const mockWorks = [{ id: 1 }];
  const mockCountQuery = [{ total_obras: 1 }];

  /** SQL normalizado da n-ésima chamada (0 = lista, 1 = contagem) */
  function sentSQL(callIndex = 0): string {
    const query = mockPrisma.$queryRaw.mock.calls[callIndex][0];
    return normalizeSQL(query.strings.join(''));
  }

  function mockResponses() {
    mockPrisma.$queryRaw
      .mockResolvedValueOnce(mockWorks)
      .mockResolvedValueOnce(mockCountQuery);
  }

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetWorksInPortfolioRepository,
        DbSchema,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    repository = module.get<GetWorksInPortfolioRepository>(
      GetWorksInPortfolioRepository,
    );
  });

  afterEach(() => {
    // clearAllMocks mantém o mockReturnValue do getOrThrow
    vi.clearAllMocks();
  });

  describe('getWorksInPortfolio', () => {
    it('should use the schema from DB_SCHEMA and never the hardcoded one', async () => {
      mockResponses();

      await repository.getWorksInPortfolio({} as WorkFiltersInput);

      for (const sql of [sentSQL(0), sentSQL(1)]) {
        expect(sql).toContain(`FROM ${SCHEMA}.obras`);
        expect(sql).toContain(`INNER JOIN ${SCHEMA}.turmas`);
        expect(sql).toContain(`LEFT JOIN ${SCHEMA}.relatorio`);
        expect(sql).not.toContain('construcao_sp.');
      }
    });

    it('should build query with programacoes join (list query)', async () => {
      mockResponses();

      await repository.getWorksInPortfolio({} as WorkFiltersInput);

      const sql = sentSQL(0);
      expect(sql).toContain(`LEFT JOIN ${SCHEMA}.programacoes`);
      // subquery de contagem também usa o schema configurado
      expect(sql).toContain(
        `FROM ${SCHEMA}.programacoes WHERE data_prog > current_date`,
      );
      expect(sql).toContain('prog_count');
    });

    it('should NOT include programacoes join in count query', async () => {
      mockResponses();

      await repository.getWorksInPortfolio({} as WorkFiltersInput);

      // Sem prefixo de schema: falha seja qual for o schema usado
      expect(sentSQL(1)).not.toContain('programacoes');
    });

    it('should apply corrected WHERE clause', async () => {
      mockResponses();

      await repository.getWorksInPortfolio({} as WorkFiltersInput);

      expect(sentSQL(0)).toContain(
        '((obras.id_status = 2 AND obras.executado < 100) OR obras.id_status NOT IN (2, 3))',
      );
    });

    it('should apply filters correctly', async () => {
      const filters = {
        idRegional: [1],
        idTipo: [2],
        idCircuito: [1],
        idMunicipio: [1],
        idEmpreendimento: [1],
        idGrupo: [1],
        idParceira: [1],
        idStatus: [1],
        idConjunto: [1],
        idStatusSap: [1],
        ovnota: '10',
        insufficientPermission: true,
      } as WorkFiltersInput;

      mockResponses();

      await repository.getWorksInPortfolio(filters);

      const sql = sentSQL(0);
      expect(sql).toContain('municipios.id_regional IN');
      expect(sql).toContain('obras.id_tipo IN');
      expect(sql).toContain('obras.ovnota =');
      expect(sql).toContain('status.id != 42');
      expect(sql).toContain('AND obras.id_turma IN');
      expect(sql).toContain('AND tipos.id_grupo IN');
      expect(sql).toContain('AND municipios.id IN');
      expect(sql).toContain('AND status.id IN');
      expect(sql).toContain('AND obras.id_circuito IN');
      expect(sql).toContain('AND circuitos.id_conjunto IN');
      expect(sql).toContain('AND obras.id_empreendimento IN');
      expect(sql).toContain('AND obras.status_ov_sap IN');
    });

    it('should apply pagination correctly', async () => {
      mockResponses();

      await repository.getWorksInPortfolio({ page: 1 } as WorkFiltersInput);

      const query = mockPrisma.$queryRaw.mock.calls[0][0];
      const sql = sentSQL(0);
      expect(sql).toContain('LIMIT 200');
      expect(sql).toContain('OFFSET');
      // page 1 → OFFSET 200 (último bind parameter)
      expect(query.values.at(-1)).toBe(200);
    });

    it('should return works and totals', async () => {
      mockResponses();

      const result = await repository.getWorksInPortfolio(
        {} as WorkFiltersInput,
      );

      expect(result).toEqual({
        works: mockWorks,
        totals: mockCountQuery,
      });
    });
  });
});
