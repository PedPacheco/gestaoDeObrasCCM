import { FiltersService } from 'src/application/usecases/filters.service';
import { FILTERS_REPOSITORY } from 'src/domain/repositories/IFiltersRepository';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';

describe('FiltersService', () => {
  let cacheManager: Cache;
  let filtersService: FiltersService;

  const mockCacheManager = {
    get: vi.fn(),
    set: vi.fn(),
  };

  const mockRepository = {
    getData: vi.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FiltersService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        { provide: FILTERS_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    filtersService = module.get<FiltersService>(FiltersService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const testCases = [
    {
      name: 'regional',
      dto: { regional: true },
      cacheKey: 'regionais',
      data: [{ id: 1, regional: 'Regional 1' }],
    },
    {
      name: 'parceira',
      dto: { parceira: true },
      cacheKey: 'parceiras',
      data: [{ id: 1, turma: 'Turma A' }],
    },
    {
      name: 'tipo',
      dto: { tipo: true },
      cacheKey: 'tiposObra',
      data: [{ id: 1, tipo_obra: 'Tipo 1', id_grupo: 2 }],
    },
    {
      name: 'municipio',
      dto: { municipio: true },
      cacheKey: 'municipios',
      data: [{ id: 1, municipio: 'Municipio 1' }],
    },
    {
      name: 'grupo',
      dto: { grupo: true },
      cacheKey: 'grupos',
      data: [{ id: 1, grupo: 'Grupo 1' }],
    },
    {
      name: 'circuito',
      dto: { circuito: true },
      cacheKey: 'circuitos',
      data: [{ id: 1, circuito: 'Circuito 1' }],
    },
    {
      name: 'statusProgramacao',
      dto: { statusProgramacao: true },
      cacheKey: 'status_programacao',
      data: [{ id: 1, status_programacao: 'Status 1' }],
    },
    {
      name: 'status',
      dto: { status: true },
      cacheKey: 'status',
      data: [{ id: 1, status: 'Status 1' }],
    },
    {
      name: 'conjunto',
      dto: { conjunto: true },
      cacheKey: 'conjunto',
      data: [{ id: 1, conjunto: 'Conjunto 1' }],
    },
    {
      name: 'equipes',
      dto: { equipes: true },
      cacheKey: 'equipes',
      data: [{ id: 1, equipe: 'LM01', id_turma: 2 }],
    },

    {
      name: 'notaD5',
      dto: { notaD5: true },
      cacheKey: 'notaD5',
      data: [{ id: 1, nota_d5: 'Nota 1' }],
    },
    {
      name: 'empreendimento',
      dto: { empreendimento: true },
      cacheKey: 'empreendimento',
      data: [{ id: 1, empreendimento: 'Empreendimento 1' }],
    },
    {
      name: 'restricao',
      dto: { restricao: true },
      cacheKey: 'restricao',
      data: [{ id: 1, restricao: 'restricao 1' }],
    },
    {
      name: 'tecnico',
      dto: { tecnico: true },
      cacheKey: 'tecnicos',
      data: [{ id: 1, tecnico: 'Tecnico 1' }],
    },
    {
      name: 'statusSap',
      dto: { statusSap: true },
      cacheKey: 'status_sap',
      data: [{ id: 1, codigo_sap: 51 }],
    },
  ];

  testCases.forEach(({ name, dto, cacheKey, data }) => {
    describe(`getFilters - ${name}`, () => {
      it(`should return cached ${name} data`, async () => {
        vi.spyOn(cacheManager, 'get').mockResolvedValue(data);

        const result = await filtersService.getFilters(dto);

        expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
        expect(result[name]).toEqual(data);
      });

      it(`should fetch ${name} data from database if not cached`, async () => {
        vi.spyOn(cacheManager, 'get').mockResolvedValue(null);
        vi.spyOn(mockRepository, 'getData').mockResolvedValue(data);
        vi.spyOn(cacheManager, 'set').mockResolvedValue(null);

        const result = await filtersService.getFilters(dto);

        expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
        expect(mockRepository.getData).toHaveBeenCalledTimes(1);
        expect(result[name]).toEqual(data);
        expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, data, 120);
      });
    });
  });

  describe('getFilters - ovnota', () => {
    const dto = { ovnota: true };
    const cacheKey = 'ovnota';

    const repositoryRows = [
      {
        id: 1,
        ovnota: 'OV-1',
        data_conclusao: new Date('2026-10-31T00:00:00Z'),
        diagrama: 'DIAG-1',
        ordem_dci: 'DCI-1',
        ordem_dca: null,
        ordem_dcd: null,
        ordem_dcim: null,
      },
      {
        id: 2,
        ovnota: 'OV-2',
        data_conclusao: null,
        diagrama: null,
        ordem_dci: null,
        ordem_dca: 'DCA-2',
        ordem_dcd: null,
        ordem_dcim: null,
      },
      {
        id: 3,
        ovnota: 'OV-3',
        data_conclusao: null,
        diagrama: null,
        ordem_dci: null,
        ordem_dca: null,
        ordem_dcd: null,
        ordem_dcim: null,
      },
    ];

    const expected = [
      { id: 1, ovnota: 'OV-1', concluida: true, ordemDiagrama: 'DIAG-1' },
      { id: 2, ovnota: 'OV-2', concluida: false, ordemDiagrama: 'DCA-2' },
      { id: 3, ovnota: 'OV-3', concluida: false, ordemDiagrama: null },
    ];

    it('should return cached ovnota data without querying the database', async () => {
      mockCacheManager.get.mockResolvedValue(expected);

      const result = await filtersService.getFilters(dto);

      expect(mockCacheManager.get).toHaveBeenCalledWith(cacheKey);
      expect(mockRepository.getData).not.toHaveBeenCalled();
      expect(result.ovnota).toEqual(expected);
    });

    it('should fetch all works (finished and in progress) with order columns', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.getData.mockResolvedValue(repositoryRows);

      await filtersService.getFilters(dto);

      expect(mockRepository.getData).toHaveBeenCalledTimes(1);

      const [table, columns, where] = mockRepository.getData.mock.calls[0];

      expect(table).toBe('obras');
      expect(columns).toEqual(
        expect.arrayContaining([
          'id',
          'ovnota',
          'data_conclusao',
          'diagrama',
          'ordem_dci',
          'ordem_dca',
          'ordem_dcd',
          'ordem_dcim',
        ]),
      );
      expect(where).toHaveProperty('municipios');
      expect(where).not.toHaveProperty('data_conclusao');
    });

    it('should map works to id, ovnota, concluida and ordemDiagrama', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.getData.mockResolvedValue(repositoryRows);

      const result = await filtersService.getFilters(dto);

      expect(result.ovnota).toEqual(expected);
    });

    it('should not expose raw date and order columns', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.getData.mockResolvedValue(repositoryRows);

      const result = await filtersService.getFilters(dto);

      result.ovnota.forEach((work: Record<string, unknown>) => {
        expect(work).not.toHaveProperty('data_conclusao');
        expect(work).not.toHaveProperty('diagrama');
        expect(work).not.toHaveProperty('ordem_dci');
        expect(work).not.toHaveProperty('ordem_dca');
        expect(work).not.toHaveProperty('ordem_dcd');
        expect(work).not.toHaveProperty('ordem_dcim');
      });
    });

    it('should cache the mapped data, not the raw rows', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockRepository.getData.mockResolvedValue(repositoryRows);

      await filtersService.getFilters(dto);

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        cacheKey,
        expected,
        120,
      );
    });
  });
});
