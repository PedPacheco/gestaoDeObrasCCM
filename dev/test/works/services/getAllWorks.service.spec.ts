import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { Cache } from 'cache-manager';
import { GetAllWorksDTO } from 'src/config/dto/worksDto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { GetAllWorksService } from 'src/modules/works/services/getAllWorks.service';

describe('GetAllWorksService', () => {
  let getAllWorksService: GetAllWorksService;
  let prismaService: PrismaService;
  let cacheManager: Cache;

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
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetAllWorksService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    getAllWorksService = module.get<GetAllWorksService>(GetAllWorksService);
    prismaService = module.get<PrismaService>(PrismaService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(getAllWorksService).toBeDefined();
  });

  it('should return works from cache if available', async () => {
    const filters: GetAllWorksDTO = {
      idGrupo: [1],
      idMunicipio: [1],
      idParceira: [1],
      idRegional: [1],
      idStatus: [1],
      idTipo: [1],
      limit: 100,
      page: 0,
    };

    const cacheKey = `works-${JSON.stringify(filters)}`;

    mockCacheManager.get.mockResolvedValue({
      totalRecords: 10000,
      works: mockWorks,
    });

    const result = await getAllWorksService.getAllWorks(filters);

    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual({ totalRecords: 10000, works: mockWorks });
    expect(prismaService.$queryRaw).not.toHaveBeenCalled();
    expect(prismaService.obras.count).not.toHaveBeenCalled();
  });

  it('should query database and cache the result if not in cache', async () => {
    const filters: GetAllWorksDTO = {
      idGrupo: [1],
      idMunicipio: [1],
      idParceira: [1],
      idRegional: [1],
      idStatus: [1],
      idTipo: [1],
      limit: 100,
      page: 0,
    };

    const cacheKey = `works-${JSON.stringify(filters)}`;

    mockCacheManager.get.mockResolvedValue(null);
    mockPrismaService.$queryRaw.mockResolvedValue(mockWorks);
    mockPrismaService.obras.count.mockResolvedValue(10000);

    const result = await getAllWorksService.getAllWorks(filters);

    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(prismaService.$queryRaw).toHaveBeenCalled();
    expect(prismaService.obras.count).toHaveBeenCalled();
    expect(cacheManager.set).toHaveBeenCalledWith(
      cacheKey,
      { totalRecords: 10000, works: mockWorks },
      1800000,
    );
    expect(result).toEqual({ totalRecords: 10000, works: mockWorks });
  });

  it('should be called method count with undefined values', async () => {
    const filters: GetAllWorksDTO = {
      idGrupo: undefined,
      idMunicipio: undefined,
      idParceira: undefined,
      idRegional: undefined,
      idStatus: undefined,
      idTipo: undefined,
      limit: 100,
      page: 0,
    };

    const cacheKey = `works-${JSON.stringify(filters)}`;

    mockCacheManager.get.mockResolvedValue(null);
    mockPrismaService.$queryRaw.mockResolvedValue(mockWorks);
    mockPrismaService.obras.count.mockResolvedValue(5000);

    const result = await getAllWorksService.getAllWorks(filters);

    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(prismaService.$queryRaw).toHaveBeenCalled();
    expect(prismaService.obras.count).toHaveBeenCalled();
    expect(cacheManager.set).toHaveBeenCalledWith(
      cacheKey,
      { totalRecords: 5000, works: mockWorks },
      1800000,
    );
    expect(prismaService.obras.count).toHaveBeenCalledWith({
      where: {
        municipios: { id_regional: undefined },
        id_tipo: undefined,
        id_turma: undefined,
        tipos: { id_grupo: undefined },
        id_gpm: undefined,
        id_status: undefined,
      },
    });
    expect(result).toEqual({ totalRecords: 5000, works: mockWorks });
  });
});
