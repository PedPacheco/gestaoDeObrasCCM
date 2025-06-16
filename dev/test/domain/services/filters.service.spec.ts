import { FiltersService } from 'src/domain/services/filters.service';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { FILTERS_REPOSITORY } from 'src/domain/repositories/IFiltersRepository';

describe('FiltersService', () => {
  let cacheManager: Cache;
  let filtersService: FiltersService;

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockRepository = {
    getData: jest.fn(),
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
    jest.clearAllMocks();
  });

  const testCases = [
    {
      name: 'regional',
      dto: { regional: true },
      cacheKey: 'regionais',
      table: 'regionais',
      data: [{ id: 1, regional: 'Regional 1' }],
    },
    {
      name: 'parceira',
      dto: { parceira: true },
      cacheKey: 'parceiras',
      table: 'turmas',
      data: [{ id: 1, turma: 'Turma A' }],
    },
    {
      name: 'tipo',
      dto: { tipo: true },
      cacheKey: 'tiposObra',
      table: 'tipos',
      data: [{ id: 1, tipo_obra: 'Tipo 1', id_grupo: 2 }],
    },
    {
      name: 'municipio',
      dto: { municipio: true },
      cacheKey: 'municipios',
      table: 'municipios',
      data: [{ id: 1, municipio: 'Municipio 1' }],
    },
    {
      name: 'grupo',
      dto: { grupo: true },
      cacheKey: 'grupos',
      table: 'grupos',
      data: [{ id: 1, grupo: 'Grupo 1' }],
    },
    {
      name: 'circuito',
      dto: { circuito: true },
      cacheKey: 'circuitos',
      table: 'circuitos',
      data: [{ id: 1, circuito: 'Circuito 1' }],
    },
    {
      name: 'status',
      dto: { status: true },
      cacheKey: 'status',
      table: 'status',
      data: [{ id: 1, status: 'Status 1' }],
    },
    {
      name: 'conjunto',
      dto: { conjunto: true },
      cacheKey: 'conjunto',
      table: 'conjuntos',
      data: [{ id: 1, conjunto: 'Conjunto 1' }],
    },
    {
      name: 'ovnota',
      dto: { ovnota: true },
      cacheKey: 'ovnota',
      table: 'obras',
      data: [{ id: 1, ovnota: 'Ovnota 1' }],
    },
    {
      name: 'ovnotaExec',
      dto: { ovnotaExec: true },
      cacheKey: 'ovnotaExec',
      table: 'obras',
      data: [{ id: 1, ovnota: 'Ovnota 2' }],
    },
    {
      name: 'empreendimento',
      dto: { empreendimento: true },
      cacheKey: 'empreendimento',
      table: 'empreendimento',
      data: [{ id: 1, empreendimento: 'Empreendimento 1' }],
    },
    {
      name: 'restricao',
      dto: { restricao: true },
      cacheKey: 'restricao',
      table: 'restricoes',
      data: [{ id: 1, restricao: 'restricao 1' }],
    },
    {
      name: 'tecnico',
      dto: { tecnico: true },
      cacheKey: 'tecnicos',
      table: 'tecnicos',
      data: [{ id: 1, tecnico: 'Tecnico 1' }],
    },
  ];

  testCases.forEach(({ name, dto, cacheKey, table, data }) => {
    describe(`getFilters - ${name}`, () => {
      it(`should return cached ${name} data`, async () => {
        jest.spyOn(cacheManager, 'get').mockResolvedValue(data);

        const result = await filtersService.getFilters(dto);

        expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
        expect(result[name]).toEqual(data);
      });

      it(`should fetch ${name} data from database if not cached`, async () => {
        jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
        jest.spyOn(mockRepository, 'getData').mockResolvedValue(data);
        jest.spyOn(cacheManager, 'set').mockResolvedValue(null);

        const result = await filtersService.getFilters(dto);

        expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
        expect(mockRepository.getData).toHaveBeenCalledTimes(1);
        expect(result[name]).toEqual(data);
        expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, data, 120);
      });
    });
  });
});
