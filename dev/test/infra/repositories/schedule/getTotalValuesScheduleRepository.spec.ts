import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { DbSchema } from 'src/infra/prisma/dbSchema.provider';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetTotalValueScheduleRepository } from 'src/infra/repositories/works/schedule/getTotalValuesScheduleRepository';

describe('GetTotalValuesSchedule', () => {
  let repository: GetTotalValueScheduleRepository;

  // Schema "falso": garante que o repositório não tem construcao_sp fixo
  const SCHEMA = 'schema_teste';

  function normalizeSQL(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim();
  }

  const mockPrisma = {
    $queryRaw: vi.fn(),
  };

  // Colunas mensais (prog/exec) geradas para os 12 meses
  const MONTHS = [
    'jan',
    'fev',
    'mar',
    'abr',
    'mai',
    'jun',
    'jul',
    'ago',
    'set',
    'out',
    'nov',
    'dez',
  ];

  const monthColumns = MONTHS.map((month, i) => {
    const n = i + 1;
    return (
      `SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = ${n} THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS ${month}_prog, ` +
      `SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = ${n} THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS ${month}_exec`
    );
  }).join(', ');

  const initialQuery = `SELECT turma, ${monthColumns},
    SUM(COALESCE(mo_final, mo_planejada)*prog/100) AS total_prog,
    SUM(COALESCE(mo_final, mo_planejada)*exec/100) AS total_exec,
    EXTRACT(YEAR FROM data_prog) AS ano
    FROM ${SCHEMA}.obras
    INNER JOIN ${SCHEMA}.programacoes ON programacoes.id_obra = obras.id
    INNER JOIN ${SCHEMA}.municipios ON municipios.id = obras.id_gpm
    INNER JOIN ${SCHEMA}.turmas ON turmas.id = obras.id_turma
    INNER JOIN ${SCHEMA}.tipos ON tipos.id = obras.id_tipo
    INNER JOIN ${SCHEMA}.grupos ON grupos.id = tipos.id_grupo
    WHERE 1=1`;

  const mockResponseQuery = [
    {
      turma: 'COMPEL',
      jan_prog: 1391543.3200890007,
      jan_exec: 888399.434949,
      fev_prog: 1055475.1537599994,
      fev_exec: 915527.9687599996,
      mar_prog: 1138471.1047400003,
      mar_exec: 825064.4695300002,
      abr_prog: 920539.8466199996,
      abr_exec: 827996.7924,
      mai_prog: 1221554.39156,
      mai_exec: 705520.8621000001,
      jun_prog: 1098224.7013000003,
      jun_exec: 778519.4827,
      jul_prog: 0,
      jul_exec: 0,
      ago_prog: 0,
      ago_exec: 0,
      set_prog: 0,
      set_exec: 0,
      out_prog: 0,
      out_exec: 0,
      nov_prog: 0,
      nov_exec: 0,
      dez_prog: 0,
      dez_exec: 0,
      total_prog: 6825808.518069001,
      total_exec: 4941029.010438991,
      ano: 2024,
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetTotalValueScheduleRepository,
        DbSchema,
        { provide: PrismaService, useValue: mockPrisma },
        // Função normal (não vi.fn) para resistir a clear/resetAllMocks
        { provide: ConfigService, useValue: { getOrThrow: () => SCHEMA } },
      ],
    }).compile();

    repository = module.get<GetTotalValueScheduleRepository>(
      GetTotalValueScheduleRepository,
    );
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('GetTotalValues', () => {
    it('should use the schema from DB_SCHEMA and never the hardcoded one', async () => {
      mockPrisma.$queryRaw.mockResolvedValue(mockResponseQuery);

      await repository.getTotalValues({} as any);

      const sql = mockPrisma.$queryRaw.mock.calls[0][0].strings.join('');
      expect(sql).toContain(`${SCHEMA}.obras`);
      expect(sql).not.toContain('construcao_sp.');
    });

    it('should return the correct values without filters', async () => {
      const filters = {
        idRegional: undefined,
        idTipo: undefined,
        idParceira: undefined,
        idMunicipio: undefined,
        idCircuito: undefined,
        idGrupo: undefined,
        idTecnico: undefined,
        ano: undefined,
      };

      mockPrisma.$queryRaw.mockResolvedValue(mockResponseQuery);

      const expectedQuery = `${initialQuery} GROUP BY turma, EXTRACT(YEAR FROM data_prog) ORDER BY turma;`;

      const result = await repository.getTotalValues(filters);
      const querySent = mockPrisma.$queryRaw.mock.calls[0][0];

      expect(result).toEqual(mockResponseQuery);
      expect(querySent.values).toStrictEqual([]);
      expect(normalizeSQL(querySent.strings.join(''))).toContain(
        normalizeSQL(expectedQuery),
      );
    });

    it('should return the correct values with filters', async () => {
      const filters = {
        idRegional: [1],
        idTipo: [1],
        idParceira: [1],
        idMunicipio: [1],
        idCircuito: [1],
        idGrupo: [1],
        idTecnico: [1],
        ano: 2024,
      };

      mockPrisma.$queryRaw.mockResolvedValue(mockResponseQuery);

      const expectedQuery = `${initialQuery} AND municipios.id_regional IN ()
        AND id_tipo IN ()
        AND id_turma IN ()
        AND tipos.id_grupo IN ()
        AND municipios.id IN ()
        AND id_circuito IN ()
        AND EXTRACT(YEAR FROM data_prog) =
        GROUP BY turma, EXTRACT(YEAR FROM data_prog) ORDER BY turma;`;

      const result = await repository.getTotalValues(filters);
      const querySent = mockPrisma.$queryRaw.mock.calls[0][0];

      expect(result).toEqual(mockResponseQuery);
      expect(querySent.values).toStrictEqual([1, 1, 1, 1, 1, 1, 2024]);
      expect(normalizeSQL(querySent.strings.join(''))).toContain(
        normalizeSQL(expectedQuery),
      );
    });
  });
});
