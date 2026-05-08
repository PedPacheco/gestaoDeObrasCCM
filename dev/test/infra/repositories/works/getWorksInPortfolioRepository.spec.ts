import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetWorksInPortfolioRepository } from 'src/infra/repositories/works/getWorksInPortfolioRepository';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';

describe('GetWorksInPortfolioRepository', () => {
  let repository: GetWorksInPortfolioRepository;

  function normalizeSQL(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim();
  }

  const mockPrisma = {
    $queryRaw: jest.fn(),
  };

  const mockWorks = [{ id: 1 }];
  const mockCountQuery = [{ total_obras: 1 }];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetWorksInPortfolioRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<GetWorksInPortfolioRepository>(
      GetWorksInPortfolioRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getWorksInPortfolio', () => {
    it('should build query with programacoes join (list query)', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockWorks)
        .mockResolvedValueOnce(mockCountQuery);

      await repository.getWorksInPortfolio({} as GetWorksDTO);

      const querySent = mockPrisma.$queryRaw.mock.calls[0][0];
      const sql = normalizeSQL(querySent.strings.join(''));

      expect(sql).toContain('LEFT JOIN construcao_sp.programacoes');
      expect(sql).toContain('prog_count');
    });

    it('should NOT include programacoes join in count query', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockWorks)
        .mockResolvedValueOnce(mockCountQuery);

      await repository.getWorksInPortfolio({} as GetWorksDTO);

      const countQuerySent = mockPrisma.$queryRaw.mock.calls[1][0];
      const sql = normalizeSQL(countQuerySent.strings.join(''));

      expect(sql).not.toContain('LEFT JOIN construcao_sp.programacoes');
    });

    it('should apply corrected WHERE clause', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockWorks)
        .mockResolvedValueOnce(mockCountQuery);

      await repository.getWorksInPortfolio({} as GetWorksDTO);

      const querySent = mockPrisma.$queryRaw.mock.calls[0][0];
      const sql = normalizeSQL(querySent.strings.join(''));

      expect(sql).toContain('(obras.id_status = 2 AND obras.executado < 100)');
      expect(sql).toContain('obras.id_status NOT IN (2, 3)');
    });

    it('should apply filters correctly', async () => {
      const filters: GetWorksDTO = {
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
      } as any;

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockWorks)
        .mockResolvedValueOnce(mockCountQuery);

      await repository.getWorksInPortfolio(filters);

      const querySent = mockPrisma.$queryRaw.mock.calls[0][0];
      const sql = normalizeSQL(querySent.strings.join(''));

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
      const filters: GetWorksDTO = {
        page: 1,
      } as any;

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockWorks)
        .mockResolvedValueOnce(mockCountQuery);

      await repository.getWorksInPortfolio(filters);

      const querySent = mockPrisma.$queryRaw.mock.calls[0][0];
      const sql = normalizeSQL(querySent.strings.join(''));

      expect(sql).toContain('LIMIT 200');
      expect(sql).toContain('OFFSET');
    });

    it('should return works and totals', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockWorks)
        .mockResolvedValueOnce(mockCountQuery);

      const result = await repository.getWorksInPortfolio({} as any);

      expect(result).toEqual({
        works: mockWorks,
        totals: mockCountQuery,
      });
    });
  });
});
