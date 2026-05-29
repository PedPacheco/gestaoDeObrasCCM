import { Cache } from 'cache-manager';
import { GetCompletedWorksService } from 'src/application/usecases/works/getCompletedWorks.service';
import { GET_COMPLETED_WORKS_REPOSITORY } from 'src/domain/repositories/works/IGetCompletedWorksRepository';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';

describe('GetCompletedWorksService', () => {
  let getCompletedWorksService: GetCompletedWorksService;
  let cacheManager: Cache;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockRepository = {
    getCompletedWorks: jest.fn(),
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
      mo_pend: 0,
      turma: 'ENGELMIG',
      executado: 100,
      data_conclusao: '2024-06-14T00:00:00.000Z',
      last_data_prog: null,
      status: 'EXECUTADA',
      observ_obra: null,
      referencia: null,
    },
  ];

  const mockCountQuery = [
    {
      total_obras: 1,
      total_mo_planejada: 91105.824,
      total_mo_exec: 91105.824,
      total_qtde_planejada: 0,
      total_qtde_pend: 0,
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetCompletedWorksService,
        { provide: GET_COMPLETED_WORKS_REPOSITORY, useValue: mockRepository },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

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
      idGrupo: [4],
      idMunicipio: [5],
      idParceira: [3],
      idRegional: [1],
      idStatus: [6],
      idTipo: [2],
      ovnota: '10',
      idCircuito: [7],
      idConjunto: [8],
      idEmpreendimento: [9],
      page: 0,
      insufficientPermission: true,
      dataInicial: '01/10/2024',
      dataFinal: '02/10/2024',
    };

    const cacheKey = `completedWorks-${JSON.stringify(filters)}`;

    mockCacheManager.get.mockResolvedValue({
      works: mockWorks,
      totals: mockCountQuery[0],
    });

    const result = await getCompletedWorksService.getCompletedWorks(filters);

    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual({
      works: mockWorks,
      totals: mockCountQuery[0],
    });
    expect(mockRepository.getCompletedWorks).not.toHaveBeenCalled();
  });

  it('should apply multiple filters correctly', async () => {
    const filters: GetWorksDTO = {
      idGrupo: [4],
      idMunicipio: [5],
      idParceira: [3],
      idRegional: [1],
      idStatus: [6],
      idTipo: [2],
      ovnota: '10',
      idCircuito: [7],
      idConjunto: [8],
      idEmpreendimento: [9],
      page: 0,
      insufficientPermission: false,
      dataInicial: '01/10/2024',
      dataFinal: '02/10/2024',
    };

    const cacheKey = `completedWorks-${JSON.stringify(filters)}`;

    mockCacheManager.get.mockResolvedValue(null);
    mockRepository.getCompletedWorks.mockResolvedValue({
      works: mockWorks,
      totals: mockCountQuery,
    });

    const result = await getCompletedWorksService.getCompletedWorks(filters);

    expect(result).toEqual({ works: mockWorks, totals: mockCountQuery[0] });
    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(cacheManager.set).toHaveBeenCalledWith(
      cacheKey,
      { works: mockWorks, totals: mockCountQuery[0] },
      1800000,
    );
  });

  it('should correctly format the data if no data is returned from the database query', async () => {
    const filters: GetWorksDTO = {
      idGrupo: [4],
      idMunicipio: [5],
      idParceira: [3],
      idRegional: [1],
      idStatus: [6],
      idTipo: [2],
      ovnota: '10',
      idCircuito: [7],
      idConjunto: [8],
      idEmpreendimento: [9],
      page: 0,
      insufficientPermission: true,
      dataInicial: '01/10/2024',
      dataFinal: '02/10/2024',
    };

    mockRepository.getCompletedWorks.mockResolvedValue({
      works: [],
      totals: [
        {
          total_obras: 0,
          total_mo_planejada: null,
          total_mo_exec: null,
          total_qtde_planejada: null,
          total_qtde_pend: null,
        },
      ],
    });

    const result = await getCompletedWorksService.getCompletedWorks(filters);

    expect(result).toEqual({
      works: [],
      totals: {
        total_obras: 0,
        total_mo_planejada: 0,
        total_mo_exec: 0,
        total_qtde_planejada: 0,
        total_qtde_pend: 0,
      },
    });
  });
});
