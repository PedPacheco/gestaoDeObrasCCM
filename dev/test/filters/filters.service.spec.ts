import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { FiltersService } from 'src/modules/filters/filters.service';
import { PrismaService } from 'src/config/prisma/prisma.service';

describe('FiltersService', () => {
  let cacheManager: Cache;
  let filtersService: FiltersService;
  let prismaService: PrismaService;

  const mockPrismaFindMany = jest.fn();

  const mockCacheManager = {
    get: jest.fn(),
    set: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FiltersService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: PrismaService,
          useValue: {
            regionais: { findMany: mockPrismaFindMany },
            turmas: { findMany: mockPrismaFindMany },
            tipos: { findMany: mockPrismaFindMany },
            municipios: { findMany: mockPrismaFindMany },
            grupos: { findMany: mockPrismaFindMany },
            circuitos: { findMany: mockPrismaFindMany },
            status: { findMany: mockPrismaFindMany },
            conjuntos: { findMany: mockPrismaFindMany },
            obras: { findMany: mockPrismaFindMany },
            empreendimento: { findMany: mockPrismaFindMany },
          },
        },
      ],
    }).compile();

    filtersService = module.get<FiltersService>(FiltersService);
    cacheManager = module.get<Cache>(CACHE_MANAGER);
    prismaService = module.get<PrismaService>(PrismaService);
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
        jest.spyOn(prismaService[table], 'findMany').mockResolvedValue(data);
        jest.spyOn(cacheManager, 'set').mockResolvedValue(null);

        const result = await filtersService.getFilters(dto);

        expect(cacheManager.get).toHaveBeenCalledWith(cacheKey);
        expect(prismaService[table].findMany).toHaveBeenCalledTimes(1);
        expect(result[name]).toEqual(data);
        expect(cacheManager.set).toHaveBeenCalledWith(cacheKey, data, 3600000);
      });
    });
  });
});
