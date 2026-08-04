import { Cache } from 'cache-manager';
import { GetWorksInPortfolioService } from 'src/application/usecases/works/getWorksInPortfolio.service';
import { GET_WORKS_IN_PORTFOLIO_REPOSITORY } from 'src/domain/contracts/works/IGetWorksInPortfolioRepository';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';

describe('GetWorksInPortfolioService', () => {
  let getWorksInPortfolioService: GetWorksInPortfolioService;
  let cacheManager: Cache;

  const mockRepository = {
    getWorksInPortfolio: jest.fn(),
  };

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
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
      status_prazo: undefined,
    },
  ];

  const mockCountQuery = [
    {
      total_obras: 1,
      total_mo_planejada: 91105.824,
      total_mo_exec: 91105.824,
      total_mo_pend: 0,
      total_qtde_planejada: 0,
      total_qtde_pend: 0,
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetWorksInPortfolioService,
        DeadlineStatusService,
        {
          provide: GET_WORKS_IN_PORTFOLIO_REPOSITORY,
          useValue: mockRepository,
        },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    getWorksInPortfolioService = module.get<GetWorksInPortfolioService>(
      GetWorksInPortfolioService,
    );
    cacheManager = module.get<Cache>(CACHE_MANAGER);

    jest.useFakeTimers().setSystemTime(new Date('2024-01-01T00:00:00.000Z'));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(getWorksInPortfolioService).toBeDefined();
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
      page: 1,
      insufficientPermission: true,
      dataInicial: null,
      dataFinal: null,
    };

    const cacheKey = `worksInPortfolio-${JSON.stringify(filters)}`;

    mockCacheManager.get.mockResolvedValue({
      works: mockWorks,
      totals: mockCountQuery[0],
    });

    const result =
      await getWorksInPortfolioService.getWorksInPortfolio(filters);

    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(result).toEqual({
      works: mockWorks,
      totals: mockCountQuery[0],
    });
    expect(mockRepository.getWorksInPortfolio).not.toHaveBeenCalled();
  });

  it('Should return data formatted and set cache', async () => {
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
      page: 1,
      insufficientPermission: true,
      dataInicial: null,
      dataFinal: null,
    };

    const cacheKey = `worksInPortfolio-${JSON.stringify(filters)}`;

    mockCacheManager.get.mockResolvedValue(null);
    mockRepository.getWorksInPortfolio.mockResolvedValue({
      works: mockWorks,
      totals: mockCountQuery,
    });

    const result =
      await getWorksInPortfolioService.getWorksInPortfolio(filters);

    expect(mockRepository.getWorksInPortfolio).toHaveBeenCalled();
    expect(result).toEqual({ works: mockWorks, totals: mockCountQuery[0] });

    expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
    expect(cacheManager.set).toHaveBeenCalledWith(
      cacheKey,
      { works: mockWorks, totals: mockCountQuery[0] },
      1800000,
    );
  });

  it('Should correctly format the totals property if totals values are not returned', async () => {
    const filters: GetWorksDTO = {
      page: 1,
      idRegional: [],
      idMunicipio: [],
      idGrupo: [],
      idTipo: [],
      idParceira: [],
      idStatus: [],
      idConjunto: [],
      idCircuito: [],
      idEmpreendimento: [],
      ovnota: undefined,
      insufficientPermission: false,
      dataFinal: null,
      dataInicial: null,
    };

    mockRepository.getWorksInPortfolio.mockResolvedValue({
      works: [],
      totals: [
        {
          total_obras: 0,
          total_mo_planejada: null,
          total_mo_exec: null,
          total_mo_pend: null,
          total_qtde_planejada: null,
          total_qtde_pend: null,
        },
      ],
    });

    const result =
      await getWorksInPortfolioService.getWorksInPortfolio(filters);

    expect(result).toEqual({
      works: [],
      totals: {
        total_obras: 0,
        total_mo_planejada: 0,
        total_mo_exec: 0,
        total_mo_pend: 0,
        total_qtde_planejada: 0,
        total_qtde_pend: 0,
      },
    });
  });

  it('should return "Prazo vencido" when prazo_fim is in the past', async () => {
    const mockWork = {
      id_grupo: 1,
      prazo_fim: '2023-12-20T00:00:00.000Z', // 11 dias no passado
    };

    mockRepository.getWorksInPortfolio.mockResolvedValueOnce({
      works: [mockWork],
      totals: mockCountQuery,
    });

    const { works } = await getWorksInPortfolioService.getWorksInPortfolio(
      {} as any,
    );

    expect(works[0].status_prazo).toBe('Prazo vencido');
  });

  it('should return "Crítico" when 0 <= daysRemaining <= 16', async () => {
    const mockWork = {
      id_grupo: 1,
      prazo_fim: '2024-01-10T00:00:00.000Z', // 9 dias restantes
    };

    mockRepository.getWorksInPortfolio.mockResolvedValueOnce({
      works: [mockWork],
      totals: mockCountQuery,
    });

    const { works } = await getWorksInPortfolioService.getWorksInPortfolio(
      {} as any,
    );

    expect(works[0].status_prazo).toBe('Crítico: 9 dia(s) restante(s)');
  });

  it('should return "Atenção" when 17 <= daysRemaining <= 30', async () => {
    const mockWork = {
      id_grupo: 1,
      prazo_fim: '2024-01-25T00:00:00.000Z', // 24 dias restantes
    };

    mockRepository.getWorksInPortfolio.mockResolvedValueOnce({
      works: [mockWork],
      totals: mockCountQuery,
    });

    const { works } = await getWorksInPortfolioService.getWorksInPortfolio(
      {} as any,
    );

    expect(works[0].status_prazo).toBe('Atenção: 24 dias restantes');
  });

  it('should return "No prazo" when daysRemaining > 30', async () => {
    const mockWork = {
      id_grupo: 1,
      prazo_fim: '2024-03-01T00:00:00.000Z', // 60 dias restantes
    };

    mockRepository.getWorksInPortfolio.mockResolvedValueOnce({
      works: [mockWork],
      totals: mockCountQuery,
    });

    const { works } = await getWorksInPortfolioService.getWorksInPortfolio(
      {} as any,
    );

    expect(works[0].status_prazo).toBe('No prazo: (60 dias restantes)');
  });

  it('should not set status_prazo if id_grupo !== 1', async () => {
    const mockWork = {
      id_grupo: 2, // Não deve calcular status_prazo
      prazo_fim: '2024-02-01T00:00:00.000Z',
    };

    mockRepository.getWorksInPortfolio.mockResolvedValueOnce({
      works: [mockWork],
      totals: mockCountQuery,
    });

    const { works } = await getWorksInPortfolioService.getWorksInPortfolio(
      {} as any,
    );

    expect(works[0].status_prazo).toBeUndefined();
  });
});
