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
      idGrupo: 1,
      idMunicipio: 1,
      idParceira: 1,
      idRegional: 1,
      idStatus: 1,
      idTipo: 1,
    };

    const cacheKey = `works-${JSON.stringify(filters)}`;

    mockCacheManager.get.mockResolvedValue(mockWorks);

    const result = await getAllWorksService.getAllWorks(filters);

    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual(mockWorks);
    expect(prismaService.$queryRaw).not.toHaveBeenCalled();
  });

  it('should query database and cache the result if not in cache', async () => {
    const filters: GetAllWorksDTO = {
      idGrupo: 1,
      idMunicipio: 1,
      idParceira: 1,
      idRegional: 1,
      idStatus: 1,
      idTipo: 1,
    };

    const cacheKey = `works-${JSON.stringify(filters)}`;

    mockCacheManager.get.mockResolvedValue(null);
    mockPrismaService.$queryRaw.mockResolvedValue(mockWorks);

    const result = await getAllWorksService.getAllWorks(filters);

    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(prismaService.$queryRaw).toHaveBeenCalled();
    expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, mockWorks, 1800000);
    expect(result).toEqual(mockWorks);
  });
});
