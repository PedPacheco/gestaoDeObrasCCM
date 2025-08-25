import { Test } from '@nestjs/testing';
import * as moment from 'moment';
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

  const mockWorks = [
    {
      id: 5773,
      ovnota: '12791121',
      ordemdiagrama: '170000004644',
      ordem_dca: null,
      ordem_dcd: '190000005626',
      ordem_dcim: null,
      status_ov_sap: 20,
      pep: 'X/004604',
      executado: 45,
      mun: 'SJC',
      id_status: 35,
      entrada: '2023-04-11T00:00:00.000Z',
      prazo: 90,
      prazo_fim: new Date('2023-07-10'),
      abrev_regional: 'SJC',
      tipo_obra: 'SPACER CABLE',
      qtde_planejada: 0.732,
      contagem_ocorrencias: 1,
      qtde_pend: 0.73161,
      circuito: 'CAC-1302',
      mo_planejada: 68339.6952,
      first_data_prog: '2024-09-19T00:00:00.000Z',
      status: 'PROGRAMADO',
      hora_ini: '1970-01-01T08:00:00.000Z',
      hora_ter: '1970-01-01T17:00:00.000Z',
      tipo_servico: 'OBRA LIVRE',
      chi: 0,
      conjunto: 'CAÇAPAVA',
      equipe_linha_morta: 12,
      equipe_linha_viva: 3,
      equipe_regularizacao: 0,
      data_empreitamento: '2024-08-06T00:00:00.000Z',
      empreendimento: null,
      turma: 'ENGELMIG',
    },
  ];

  const mockCountQuery = [
    {
      total_obras: 1,
      total_mo_planejada: 91105.824,
      total_mo_exec: 91105.824,
      total_mo_suspensa: 0,
      total_qtde_planejada: 0,
      total_qtde_pend: 0,
    },
  ];

  const baseQuery = `SELECT obras.id, obras.ovnota, COALESCE(diagrama, COALESCE(ordem_dci, ordem_dcim)) AS ordemdiagrama, ordem_dca, ordem_dcd, ordem_dcim, status_ov_sap, pep, 
        executado, mun, id_status, entrada, prazo, entrada + prazo AS prazo_fim, abrev_regional, tipo_obra, qtde_planejada, contagem_ocorrencias,
        qtde_pend, circuito, mo_planejada, first_data_prog, status.status, hora_ini, hora_ter, tipo_servico, datas_programacao.chi,
        conjuntos.conjunto, equipe_linha_morta, equipe_linha_viva, equipe_regularizacao, data_empreitamento, empreendimento, turma
        FROM construcao_sp.obras 
        INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma 
        INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm 
        INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo 
        INNER JOIN construcao_sp.status ON status.id = obras.id_status 
        INNER JOIN construcao_sp.circuitos ON obras.id_circuito = circuitos.id
        INNER JOIN construcao_sp.empreendimento ON obras.id_empreendimento = empreendimento.id
        INNER JOIN construcao_sp.conjuntos ON circuitos.id_conjunto = conjuntos.id
        INNER JOIN construcao_sp.regionais ON municipios.id_regional = regionais.id
        LEFT JOIN construcao_sp.datas_programacao ON datas_programacao.id = obras.id
        LEFT JOIN (SELECT id_obra, COUNT(*)::int as contagem_ocorrencias FROM construcao_sp.programacoes WHERE programacoes.data_prog > current_date GROUP BY id_obra ) AS programacoes ON programacoes.id_obra = obras.id 
        WHERE data_conclusao IS NULL`;

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

  describe('GetWorksInPortfolio', () => {
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
        page: 1,
        insufficientPermission: false,
      };

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockWorks)
        .mockResolvedValueOnce(mockCountQuery);

      const result = await repository.getWorksInPortfolio(filters);

      const expectedQuery = `${baseQuery} AND municipios.id_regional IN () AND id_tipo IN () AND id_turma IN () AND tipos.id_grupo IN () AND municipios.id IN ()
      AND status.id IN () AND id_circuito IN () AND circuitos.id_conjunto IN () AND id_empreendimento IN () AND obras.id IN () 
      AND EXTRACT(MONTH FROM first_data_prog) = AND EXTRACT(YEAR FROM first_data_prog) = 
      ORDER BY first_data_prog, status DESC, entrada + prazo LIMIT 200 OFFSET`;

      const querySent = mockPrisma.$queryRaw.mock.calls[0][0];

      expect(result).toEqual({ works: mockWorks, totals: mockCountQuery });
      expect(normalizeSQL(querySent.strings.join(''))).toContain(
        normalizeSQL(expectedQuery),
      );
      expect(querySent.values).toEqual([
        1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 9, 2024, 200,
      ]);
    });

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
        page: 1,
        insufficientPermission: true,
      };

      const expectedDate = moment(filters.data, 'DD/MM/YYYY', true).toDate();

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockWorks)
        .mockResolvedValueOnce(mockCountQuery);

      const result = await repository.getWorksInPortfolio(filters);

      const expectedQuery = `${baseQuery} AND status.id != 42 AND municipios.id_regional IN () AND id_tipo IN () AND id_turma IN () AND tipos.id_grupo IN () AND municipios.id IN ()
        AND status.id IN () AND id_circuito IN () AND circuitos.id_conjunto IN () AND id_empreendimento IN () AND obras.id IN () 
        AND first_data_prog = 
        ORDER BY first_data_prog, status DESC, entrada + prazo LIMIT 200 OFFSET`;

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
        200,
      ]);
    });

    it('should not apply filters when values filters are not sent', async () => {
      const filters: GetWorksDTO = {
        data: null,
        tipoFiltro: null,
        idRegional: null,
        idMunicipio: null,
        idGrupo: null,
        idTipo: null,
        idParceira: null,
        idStatus: null,
        idConjunto: null,
        idCircuito: null,
        idEmpreendimento: null,
        idOvnota: null,
        page: 1,
        insufficientPermission: false,
      };

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockWorks)
        .mockResolvedValueOnce(mockCountQuery);

      const result = await repository.getWorksInPortfolio(filters);

      const expectedQuery = `${baseQuery} ORDER BY first_data_prog, status DESC, entrada + prazo LIMIT 200 OFFSET`;

      const querySent = mockPrisma.$queryRaw.mock.calls[0][0];

      expect(result).toEqual({ works: mockWorks, totals: mockCountQuery });
      expect(normalizeSQL(querySent.strings.join(''))).toContain(
        normalizeSQL(expectedQuery),
      );
      expect(querySent.values).toEqual([200]);
    });
  });
});
