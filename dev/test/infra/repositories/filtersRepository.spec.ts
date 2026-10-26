import type { Mock } from 'vitest';
import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { FiltersRepository } from 'src/infra/repositories/filtersRepository';

describe('FiltersRepository', () => {
  let filtersRepository: FiltersRepository;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FiltersRepository,
        {
          provide: PrismaService,
          useValue: {
            regionais: { findMany: vi.fn() },
            turmas: { findMany: vi.fn() },
            tipos: { findMany: vi.fn() },
            municipios: { findMany: vi.fn() },
            grupos: { findMany: vi.fn() },
            circuitos: { findMany: vi.fn() },
            status: { findMany: vi.fn() },
            conjuntos: { findMany: vi.fn() },
            obras: { findMany: vi.fn() },
            empreendimento: { findMany: vi.fn() },
          },
        },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    filtersRepository = module.get<FiltersRepository>(FiltersRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  const testCases = [
    {
      fields: ['id', 'regional'],
      table: 'regionais',
      data: [{ id: 1, regional: 'Regional 1' }],
      condition: { id: 1 },
    },
    {
      fields: ['id', 'turma'],
      table: 'turmas',
      data: [{ id: 1, turma: 'Turma A' }],
      condition: { id_regional: 1 },
    },
    {
      fields: ['id', 'tipo_obra', 'id_grupo'],
      table: 'tipos',
      data: [{ id: 1, tipo_obra: 'Tipo 1', id_grupo: 2 }],
    },
    {
      fields: ['id', 'municipio'],
      table: 'municipios',
      data: [{ id: 1, municipio: 'Municipio 1' }],
      condition: { id_regional: 1 },
    },
    {
      fields: ['id', 'grupo'],
      table: 'grupos',
      data: [{ id: 1, grupo: 'Grupo 1' }],
    },
    {
      fields: ['id', 'circuito'],
      table: 'circuitos',
      data: [{ id: 1, circuito: 'Circuito 1' }],
    },
    {
      fields: ['id', 'status'],
      table: 'status',
      data: [{ id: 1, status: 'Status 1' }],
    },
    {
      fields: ['id', 'conjunto'],
      table: 'conjuntos',
      data: [{ id: 1, conjunto: 'Conjunto 1' }],
    },
    {
      fields: ['id', 'ovnota'],
      table: 'obras',
      data: [{ id: 1, ovnota: 'Ovnota 1' }],
      condition: {
        data_conclusao: null,
        municipios: { id_regional: 1 },
      },
    },
    {
      fields: ['id', 'ovnota'],
      table: 'obras',
      data: [{ id: 1, ovnota: 'Ovnota 2' }],
      condition: {
        data_conclusao: { not: null },
        municipios: { id_regional: 1 },
      },
    },
    {
      fields: ['id', 'empreendimento'],
      table: 'empreendimento',
      data: [{ id: 1, empreendimento: 'Empreendimento 1' }],
      condition: { id_regional: 1 },
    },
  ];
  testCases.forEach(({ fields, table, data, condition }) => {
    describe('GetData', () => {
      it(`should fetch ${table} data from database `, async () => {
        const findManyMock = prisma[table].findMany as Mock;
        findManyMock.mockResolvedValue(data);
        const orderField = fields[1];

        const result = await filtersRepository.getData(
          table,
          fields,
          condition,
        );

        expect(findManyMock).toHaveBeenCalledWith({
          where: condition,
          select: fields.reduce(
            (acc, field) => ({ ...acc, [field]: true }),
            {},
          ),
          orderBy: orderField ? { [orderField]: 'asc' } : undefined,
        });
        expect(result).toEqual(data);
      });
    });
  });
});
