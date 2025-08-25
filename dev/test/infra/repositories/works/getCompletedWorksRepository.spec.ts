import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetCompletedWorksRepository } from 'src/infra/repositories/works/getCompletedWorksRepository';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';
import { totalsWorksInPortfolio } from 'src/interface/types/works/getWorksInPortfolioInterface';
import * as moment from 'moment';

describe('GetCompletedWorksRepository', () => {
  let repository: GetCompletedWorksRepository;

  function normalizeSQL(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim();
  }

  const mockPrisma = {
    $queryRaw: jest.fn(),
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

  const mockCountQuery: totalsWorksInPortfolio[] = [
    {
      total_obras: 1,
      total_mo_planejada: 91105.824,
      total_mo_exec: 91105.824,
      total_mo_suspensa: 0,
      total_qtde_planejada: 0,
      total_qtde_pend: 0,
    },
  ];

  const baseQuery = `SELECT obras.id, obras.ovnota, COALESCE(diagrama, ordem_dci, ordem_dcim) AS ordemdiagrama, ordem_dca, ordem_dcd, ordem_dcim, status_ov_sap, pep, executado, 
  mun, CASE WHEN current_date > entrada + prazo THEN 1 ELSE 0 END AS atraso, data_conclusao, tipo_obra, qtde_planejada, qtde_pend,
  circuito, mo_planejada, contagem_ocorrencias, turma, status, conjunto, abrev_regional, observ_obra
  FROM construcao_sp.obras
  INNER JOIN construcao_sp.municipios ON obras.id_gpm = municipios.id
  INNER JOIN construcao_sp.circuitos ON obras.id_circuito = circuitos.id
  INNER JOIN construcao_sp.status ON obras.id_status = status.id
  INNER JOIN construcao_sp.tipos ON obras.id_tipo = tipos.id
  INNER JOIN construcao_sp.conjuntos ON circuitos.id_conjunto = conjuntos.id
  INNER JOIN construcao_sp.regionais ON municipios.id_regional = regionais.id
  INNER JOIN construcao_sp.turmas ON obras.id_turma = turmas.id
  LEFT JOIN (SELECT id_obra, COUNT(*)::int as contagem_ocorrencias FROM construcao_sp.programacoes WHERE programacoes.data_prog > current_date GROUP BY id_obra ) AS programacoes ON programacoes.id_obra = obras.id
  WHERE data_conclusao IS NOT NULL`;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetCompletedWorksRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<GetCompletedWorksRepository>(
      GetCompletedWorksRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GetCompletedWorks', () => {
    it('should apply multiple filters correctly and day filter', async () => {
      const filters: GetWorksDTO = {
        idGrupo: [4],
        idMunicipio: [5],
        idParceira: [3],
        idRegional: [1],
        idStatus: [6],
        idTipo: [2],
        idOvnota: [10],
        idCircuito: [7],
        idConjunto: [8],
        idEmpreendimento: [9],
        data: '17/09/2024',
        tipoFiltro: 'day',
        page: 0,
        insufficientPermission: true,
      };

      const expectedDate = moment(filters.data, 'DD/MM/YYYY', true).toDate();

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockWorks)
        .mockResolvedValueOnce(mockCountQuery);

      const result = await repository.getCompletedWorks(filters);

      const expectedQuery = `${baseQuery} AND status.id != 42 AND municipios.id_regional IN ()
        AND id_tipo IN ()
        AND id_turma IN ()
        AND tipos.id_grupo IN ()
        AND municipios.id IN ()
        AND status.id IN ()
        AND id_circuito IN ()
        AND circuitos.id_conjunto IN ()
        AND id_empreendimento IN ()
        AND obras.id IN () AND data_conclusao = ORDER BY data_conclusao DESC LIMIT 200 OFFSET ;`;

      const querySent = mockPrisma.$queryRaw.mock.calls[0][0];

      expect(result).toEqual({ works: mockWorks, totals: mockCountQuery });
      expect(normalizeSQL(querySent.strings.join(''))).toContain(
        normalizeSQL(expectedQuery),
      );
      expect(querySent.values).toEqual([
        1,
        2,
        3,
        4,
        5,
        6,
        7,
        8,
        9,
        10,
        expectedDate,
        0,
      ]);
    });

    it('should apply multiple filters correctly and month filter', async () => {
      const filters: GetWorksDTO = {
        idGrupo: [4],
        idMunicipio: [5],
        idParceira: [3],
        idRegional: [1],
        idStatus: [6],
        idTipo: [2],
        idOvnota: [10],
        idCircuito: [7],
        idConjunto: [8],
        idEmpreendimento: [9],
        data: '09/2024',
        tipoFiltro: 'month',
        page: 0,
        insufficientPermission: true,
      };

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockWorks)
        .mockResolvedValueOnce(mockCountQuery);

      const result = await repository.getCompletedWorks(filters);

      const expectedQuery = `${baseQuery} AND status.id != 42 AND municipios.id_regional IN ()
        AND id_tipo IN ()
        AND id_turma IN ()
        AND tipos.id_grupo IN ()
        AND municipios.id IN ()
        AND status.id IN ()
        AND id_circuito IN ()
        AND circuitos.id_conjunto IN ()
        AND id_empreendimento IN ()
        AND obras.id IN () 
        AND EXTRACT(MONTH FROM data_conclusao) =  AND EXTRACT(YEAR FROM data_conclusao) = 
        ORDER BY data_conclusao DESC LIMIT 200 OFFSET ;`;

      const querySent = mockPrisma.$queryRaw.mock.calls[0][0];

      expect(result).toEqual({ works: mockWorks, totals: mockCountQuery });
      expect(normalizeSQL(querySent.strings.join(''))).toContain(
        normalizeSQL(expectedQuery),
      );
      expect(querySent.values).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 2024, 0,
      ]);
    });

    it('should not apply filters when values filters are not sent', async () => {
      const filters: GetWorksDTO = {
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: undefined,
        idStatus: undefined,
        idTipo: undefined,
        idOvnota: undefined,
        idCircuito: undefined,
        idConjunto: undefined,
        idEmpreendimento: undefined,
        data: undefined,
        tipoFiltro: undefined,
        page: 0,
        insufficientPermission: false,
      };

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockWorks)
        .mockResolvedValueOnce(mockCountQuery);

      const result = await repository.getCompletedWorks(filters);

      const expectedQuery = `${baseQuery} ORDER BY data_conclusao DESC LIMIT 200 OFFSET ;`;

      const querySent = mockPrisma.$queryRaw.mock.calls[0][0];

      expect(result).toEqual({ works: mockWorks, totals: mockCountQuery });
      expect(normalizeSQL(querySent.strings.join(''))).toContain(
        normalizeSQL(expectedQuery),
      );
      expect(querySent.values).toEqual([0]);
    });
  });
});
