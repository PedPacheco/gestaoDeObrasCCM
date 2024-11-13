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

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockPrismaService = {
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
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(getCompletedWorksService).toBeDefined();
  });

  it('should return works from cache if available', async () => {
    const filters: GetWorksDTO = {
      idGrupo: 4,
      idMunicipio: 5,
      idParceira: 3,
      idRegional: 1,
      idStatus: 6,
      idTipo: 2,
      idOvnota: 10,
      idCircuito: 7,
      idConjunto: 8,
      idEmpreendimento: 9,
      data: '09/2024',
      tipoFiltro: 'month',
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
      idGrupo: 4,
      idMunicipio: 5,
      idParceira: 3,
      idRegional: 1,
      idStatus: 6,
      idTipo: 2,
      idOvnota: 10,
      idCircuito: 7,
      idConjunto: 8,
      idEmpreendimento: 9,
      data: '09/2024',
      tipoFiltro: 'month',
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

    const calledQuery = mockPrismaService.$queryRaw.mock.calls[0][0];

    expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    expect(calledQuery.strings[0]).toContain('AND municipios.id_regional = ');
    expect(calledQuery.strings[1]).toContain('AND id_tipo = ');
    expect(calledQuery.strings[2]).toContain('AND id_turma = ');
    expect(calledQuery.strings[3]).toContain('AND tipos.id_grupo = ');
    expect(calledQuery.strings[4]).toContain('AND municipios.id = ');
    expect(calledQuery.strings[5]).toContain('AND status.id = ');
    expect(calledQuery.strings[6]).toContain('AND id_circuito = ');
    expect(calledQuery.strings[7]).toContain('AND circuitos.id_conjunto = ');
    expect(calledQuery.strings[8]).toContain('AND id_empreendimento = ');
    expect(calledQuery.strings[9]).toContain('AND id = ');
    expect(calledQuery.strings[10]).toContain(
      'AND EXTRACT(MONTH FROM data_conclusao) = ',
    );
    expect(result).toEqual(mockResult);
    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, mockQuery, 1800000);
  });

  it('should apply multiple filters correctly and day filter', async () => {
    const filters: GetWorksDTO = {
      idGrupo: 4,
      idMunicipio: 5,
      idParceira: 3,
      idRegional: 1,
      idStatus: 6,
      idTipo: 2,
      idOvnota: 10,
      idCircuito: 7,
      idConjunto: 8,
      idEmpreendimento: 9,
      data: '09/2024',
      tipoFiltro: 'day',
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

    const calledQuery = mockPrismaService.$queryRaw.mock.calls[0][0];

    expect(prismaService.$queryRaw).toHaveBeenCalled();
    expect(calledQuery.strings[0]).toContain('AND municipios.id_regional = ');
    expect(calledQuery.strings[1]).toContain('AND id_tipo = ');
    expect(calledQuery.strings[2]).toContain('AND id_turma = ');
    expect(calledQuery.strings[3]).toContain('AND tipos.id_grupo = ');
    expect(calledQuery.strings[4]).toContain('AND municipios.id = ');
    expect(calledQuery.strings[5]).toContain('AND status.id = ');
    expect(calledQuery.strings[6]).toContain('AND id_circuito = ');
    expect(calledQuery.strings[7]).toContain('AND circuitos.id_conjunto = ');
    expect(calledQuery.strings[8]).toContain('AND id_empreendimento = ');
    expect(calledQuery.strings[9]).toContain('AND id = ');
    expect(calledQuery.strings[10]).toContain('AND data_conclusao = ');

    expect(result).toEqual(mockResult);
    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, mockQuery, 1800000);
  });
});
