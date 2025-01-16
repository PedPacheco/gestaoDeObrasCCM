import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Test } from '@nestjs/testing';
import { GetWorksDTO } from 'src/config/dto/worksDto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { GetCompletedWorksService } from 'src/modules/works/services/getCompletedWorks.service';

describe('GetCompletedWorksService', () => {
  let prismaService: PrismaService;
  let getCompletedWorksService: GetCompletedWorksService;
  let cacheManager: Cache;
  let initialQuery: string;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockPrismaService = {
    $queryRaw: jest.fn(),
    obras: { count: jest.fn() },
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
      total_mo_planejada: 91105.824,
      total_obras: 1,
      total_qtde_planejada: 0,
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetCompletedWorksService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    getCompletedWorksService = module.get<GetCompletedWorksService>(
      GetCompletedWorksService,
    );
    cacheManager = module.get<Cache>(CACHE_MANAGER);

    initialQuery = `SELECT obras.id, obras.ovnota, COALESCE(diagrama, ordem_dci, ordem_dcim) AS ordemdiagrama, ordem_dca, ordem_dcd, ordem_dcim, status_ov_sap, pep, executado, 
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
    WHERE data_conclusao IS NOT NULL
    AND municipios.id_regional IN ()
    AND id_tipo IN ()
    AND id_turma IN ()
    AND tipos.id_grupo IN ()
    AND municipios.id IN ()
    AND status.id IN ()
    AND id_circuito IN ()
    AND circuitos.id_conjunto IN ()
    AND id_empreendimento IN ()
    AND obras.id IN ()`;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(getCompletedWorksService).toBeDefined();
  });

  it('should return works from cache if available', async () => {
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
    };

    const cacheKey = `worksInPortfolio-${JSON.stringify(filters)}`;

    mockCacheManager.get.mockResolvedValue(mockWorks);

    const result = await getCompletedWorksService.getCompletedWorks(filters);

    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual(mockWorks);
    expect(prismaService.$queryRaw).not.toHaveBeenCalled();
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
    };

    const mockQuery = [
      { id: 1, ovnota: '123', mo_planejada: 3454.0, qtde_planejada: 4 },
    ];

    const mockResult = [
      {
        ...mockQuery[0],
        total_mo_planejada: 3454.0,
        total_obras: 1,
        total_qtde_planejada: 4,
      },
    ];

    const cacheKey = `worksInPortfolio-${JSON.stringify(filters)}`;

    mockCacheManager.get.mockResolvedValue(null);
    mockPrismaService.$queryRaw.mockResolvedValue(mockQuery);
    mockPrismaService.obras.count.mockResolvedValue(1);

    const result = await getCompletedWorksService.getCompletedWorks(filters);

    const calledQuery = mockPrismaService.$queryRaw.mock.calls[0][0].strings;

    initialQuery = `${initialQuery} AND EXTRACT(MONTH FROM data_conclusao) =  AND EXTRACT(YEAR FROM data_conclusao) = ORDER BY data_conclusao DESC LIMIT 200 OFFSET ;`;

    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

    const allPartsPresent = normalize(initialQuery).includes(
      normalize(calledQuery.join('')),
    );

    expect(allPartsPresent).toBeTruthy();
    expect(result).toEqual({ works: mockResult, totalRecords: 1 });
    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(cacheManager.set).toHaveBeenCalledWith(
      cacheKey,
      { works: mockResult, totalRecords: 1 },
      1800000,
    );
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
      page: 0,
    };

    const mockQuery = [
      { id: 1, ovnota: '123', mo_planejada: 3454.0, qtde_planejada: 4 },
    ];

    const mockResult = [
      {
        ...mockQuery[0],
        total_mo_planejada: 3454.0,
        total_obras: 1,
        total_qtde_planejada: 4,
      },
    ];

    const cacheKey = `worksInPortfolio-${JSON.stringify(filters)}`;

    mockCacheManager.get.mockResolvedValue(null);
    mockPrismaService.$queryRaw.mockResolvedValue(mockQuery);

    const result = await getCompletedWorksService.getCompletedWorks(filters);

    initialQuery = `${initialQuery} AND data_conclusao = ORDER BY data_conclusao DESC LIMIT 200 OFFSET ;`;

    const calledQuery = mockPrismaService.$queryRaw.mock.calls[0][0].strings;

    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

    const allPartsPresent = normalize(initialQuery).includes(
      normalize(calledQuery.join('')),
    );

    expect(allPartsPresent).toBeTruthy();

    expect(result).toEqual({ works: mockResult, totalRecords: 1 });
    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(cacheManager.set).toHaveBeenCalledWith(
      cacheKey,
      { works: mockResult, totalRecords: 1 },
      1800000,
    );
  });
});
