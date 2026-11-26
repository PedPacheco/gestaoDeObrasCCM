import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DbSchema } from 'src/infra/prisma/dbSchema.provider';

import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetAllWorksRepository } from 'src/infra/repositories/works/management/getAllWorksRepository';
import { GetAllWorksDTO } from 'src/interface/dtos/worksDto';

describe('GetAllWorksRepository', () => {
  let repository: GetAllWorksRepository;

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

  const mockWorks = [
    {
      id: 17617,
      ovnota: '15373379',
      ordemdiagrama: '170000015211',
      status_ov_sap: 99,
      pep: 'X/005016',
      status_pep: null,
      diagrama: null,
      status_diagrama: null,
      ordem_dci: '170000015211',
      status_170: 'LIB ',
      status_usuario_170: 'INVE',
      ordem_dcd: '190000016813',
      status_190: 'ENTE',
      status_usuario_190: 'ENTE',
      ordem_dca: '150000001995',
      status_150: 'ENTE',
      status_usuario_150: 'ENTE',
      ordem_dcim: null,
      status_180: null,
      status_usuario_180: null,
      mun: 'SAE',
      tipo_obra: 'RISCO A SEGURANÇA',
      entrada: null,
      prazo_fim: null,
      qtde_planejada: 0,
      mo_planejada: 91105.824,
      mo_final: null,
      turma: 'ENGELMIG',
      executado: 100,
      data_conclusao: '2024-06-14T00:00:00.000Z',
      last_data_prog: null,
      status: 'EXECUTADA',
      observ_obra: null,
      referencia: null,
    },
  ];

  const mockQuery = [{ total_obras: 1 }];

  const baseQuery = `FROM ${SCHEMA}.obras
    INNER JOIN ${SCHEMA}.turmas ON turmas.id = obras.id_turma
    INNER JOIN ${SCHEMA}.municipios ON municipios.id = obras.id_gpm
    INNER JOIN ${SCHEMA}.tipos ON tipos.id = obras.id_tipo
    INNER JOIN ${SCHEMA}.status ON status.id = obras.id_status
    WHERE 1=1`;

  const query = `SELECT
    obras.id, obras.ovnota, COALESCE(diagrama, COALESCE(ordem_dci, ordem_dcim)) AS ordemdiagrama, status_ov_sap, pep, status_pep, diagrama, status_diagrama, ordem_dci, status_170,
    status_usuario_170, ordem_dcd, status_190, status_usuario_190, ordem_dca, status_150, status_usuario_150, ordem_dcim, status_180, status_usuario_180, mun, tipo_obra, entrada,
    entrada + prazo AS prazo_fim, qtde_planejada, mo_planejada, mo_final, turma, executado, data_conclusao, status, observ_obra, referencia
    ${baseQuery}`;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetAllWorksRepository,
        DbSchema,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    repository = module.get<GetAllWorksRepository>(GetAllWorksRepository);
  });

  afterEach(() => {
    // clearAllMocks mantém o mockReturnValue do getOrThrow
    vi.clearAllMocks();
  });

  describe('GetAllWorks', () => {
    it('should use the schema from DB_SCHEMA and never the hardcoded one', async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockWorks)
        .mockResolvedValueOnce(mockQuery);

      await repository.getAllWorks({
        insufficientPermission: false,
      } as GetAllWorksDTO);

      const [querySent] = mockPrisma.$queryRaw.mock.calls[0];
      const [countSent] = mockPrisma.$queryRaw.mock.calls[1];

      for (const sql of [querySent, countSent]) {
        const text = sql.strings.join('');
        expect(text).toContain(`${SCHEMA}.obras`);
        expect(text).not.toContain('construcao_sp.');
      }
    });

    it('should query database with filters and return data', async () => {
      const filters: GetAllWorksDTO = {
        idGrupo: [1],
        idMunicipio: [1],
        idParceira: [1],
        idRegional: [1],
        idStatus: [1],
        idTipo: [1],
        page: 0,
        insufficientPermission: true,
      };

      const expectedQuery = `${query} AND status.id != 42 AND municipios.id_regional IN () AND id_tipo IN () AND id_turma IN () AND tipos.id_grupo IN () AND municipios.id IN ()
        AND status.id IN () ORDER BY entrada DESC LIMIT 200 OFFSET`;

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockWorks)
        .mockResolvedValueOnce(mockQuery);

      const result = await repository.getAllWorks(filters);
      const querySent = mockPrisma.$queryRaw.mock.calls[0][0];

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
      expect(normalizeSQL(querySent.strings.join(''))).toContain(
        normalizeSQL(expectedQuery),
      );
      expect(querySent.values).toEqual([1, 1, 1, 1, 1, 1, 0]);
      expect(result).toEqual({ works: mockWorks, total: mockQuery });
    });

    it('should query database without filters and return data', async () => {
      const filters: GetAllWorksDTO = {
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: undefined,
        idStatus: undefined,
        idTipo: undefined,
        page: null,
        insufficientPermission: false,
      };

      const expectedQuery = `${query} ORDER BY entrada DESC`;

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockWorks)
        .mockResolvedValueOnce(mockQuery);

      const result = await repository.getAllWorks(filters);
      const querySent = mockPrisma.$queryRaw.mock.calls[0][0];

      expect(mockPrisma.$queryRaw).toHaveBeenCalledTimes(2);
      expect(normalizeSQL(querySent.strings.join(''))).toContain(
        normalizeSQL(expectedQuery),
      );
      expect(querySent.values).toEqual([]);
      expect(result).toEqual({ works: mockWorks, total: mockQuery });
    });
  });
});
