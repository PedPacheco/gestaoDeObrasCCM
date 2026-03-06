import { Cache } from 'cache-manager';
import { GetAllWorksService } from 'src/application/services/works/getAllWorks.service';
import { GET_ALL_WORKS_REPOSITORY } from 'src/domain/repositories/works/IGetAllWorksRepository';
import { GetAllWorksDTO } from 'src/interface/dtos/worksDto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';

describe('GetAllWorksService', () => {
  let getAllWorksService: GetAllWorksService;
  let cacheManager: Cache;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockRepository = {
    getAllWorks: jest.fn(),
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

  const mockTotals = [
    {
      total_obras: 1,
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetAllWorksService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: GET_ALL_WORKS_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    getAllWorksService = module.get<GetAllWorksService>(GetAllWorksService);
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
      page: 0,
      insufficientPermission: true,
    };

    const cacheKey = `works-${JSON.stringify(filters)}`;

    mockCacheManager.get.mockResolvedValue({
      totalRecords: mockTotals[0].total_obras,
      works: mockWorks,
    });

    const result = await getAllWorksService.getAllWorks(filters);

    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual({ works: mockWorks, totalRecords: 1 });
    expect(mockRepository.getAllWorks).not.toHaveBeenCalled();
  });

  it('should query database and cache the result if not in cache', async () => {
    const filters: GetAllWorksDTO = {
      idGrupo: [1],
      idMunicipio: [1],
      idParceira: [1],
      idRegional: [1],
      idStatus: [1],
      idTipo: [1],
      page: 0,
      insufficientPermission: false,
    };

    const cacheKey = `works-${JSON.stringify(filters)}`;

    mockCacheManager.get.mockResolvedValue(null);
    mockRepository.getAllWorks.mockResolvedValueOnce({
      works: mockWorks,
      total: mockTotals,
    });

    const result = await getAllWorksService.getAllWorks(filters);

    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(mockRepository.getAllWorks).toHaveBeenCalled();
    expect(cacheManager.set).toHaveBeenCalledWith(
      cacheKey,
      { works: mockWorks, totalRecords: 1 },
      1800000,
    );
    expect(result).toEqual({ works: mockWorks, totalRecords: 1 });
  });

  it('should be called method count with undefined values', async () => {
    const filters: GetAllWorksDTO = {
      idGrupo: undefined,
      idMunicipio: undefined,
      idParceira: undefined,
      idRegional: undefined,
      idStatus: undefined,
      idTipo: undefined,
      page: 0,
      insufficientPermission: true,
    };

    const cacheKey = `works-${JSON.stringify(filters)}`;

    mockCacheManager.get.mockResolvedValue(null);
    mockRepository.getAllWorks.mockResolvedValueOnce({
      works: mockWorks,
      total: mockTotals,
    });

    const result = await getAllWorksService.getAllWorks(filters);

    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(mockRepository.getAllWorks).toHaveBeenCalled();
    expect(cacheManager.set).toHaveBeenCalledWith(
      cacheKey,
      { works: mockWorks, totalRecords: 1 },
      1800000,
    );
    expect(result).toEqual({ totalRecords: 1, works: mockWorks });
  });
});
