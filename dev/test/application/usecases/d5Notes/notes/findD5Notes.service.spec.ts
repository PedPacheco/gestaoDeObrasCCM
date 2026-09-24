import { BadRequestException, NotFoundException } from '@nestjs/common';
import moment from 'moment';
import { FindD5NotesService } from 'src/application/usecases/d5Notes/notes/findD5Notes.service';

import { D5NotesFiltersDTO } from 'src/interface/dtos/d5NotesDTO';

// ---------------------------------------------------------------------------
// Factories de linhas de persistência
// ---------------------------------------------------------------------------
const makeRow = (overrides: Record<string, any> = {}) => ({
  id: 1,
  criado_em: new Date('2026-01-01T00:00:00.000Z'),
  obras: { ovnota: 'OV-123', diagrama: 'DIAG-1' },
  municipios: {
    mun_minusculo: 'Cascais',
    regionais: { regional: 'Sul' },
  },
  tipos: { tipo_obra: 'Ampliação' },
  turmas: { turma: 'Parceira A' },
  status: { status: 'Em curso' },
  novo_tabela_usuarios: { nome: 'Ana Silva' },
  ...overrides,
});

const makeDetail = (overrides: Record<string, any> = {}) => ({
  ...makeRow(),
  programacoes_d5: [],
  ...overrides,
});

const makeFilters = (
  overrides: Partial<D5NotesFiltersDTO> = {},
): D5NotesFiltersDTO => ({ ...overrides }) as D5NotesFiltersDTO;

describe('FindD5NotesService', () => {
  let service: FindD5NotesService;

  const repository = {
    get: jest.fn(),
    getTotals: jest.fn(),
    getById: jest.fn(),
  };

  const buildWhere = (filters: D5NotesFiltersDTO) =>
    (service as any).buildWhereClause(filters);

  const buildPagination = (page?: number) =>
    (service as any).buildPagination(page);

  const calculateCost = (data: { prog: number; exec: number }[]) =>
    (service as any).calculateCostPointByPointSchedule(data);

  beforeEach(() => {
    service = new FindD5NotesService(repository as any);

    repository.get.mockResolvedValue([]);
    repository.getTotals.mockResolvedValue({});
    repository.getById.mockResolvedValue(makeDetail());
  });

  afterEach(() => jest.resetAllMocks());

  it('deve estar definido', () => {
    expect(service).toBeDefined();
  });

  // =========================================================================
  // get
  // =========================================================================
  describe('get', () => {
    it('deve devolver a lista achatada com os totais', async () => {
      const totals = { total: 1 };
      repository.get.mockResolvedValue([makeRow()]);
      repository.getTotals.mockResolvedValue(totals);

      const result = await service.get(makeFilters());

      expect(result.totals).toBe(totals);
      expect(result.d5Notes).toHaveLength(1);
      expect(result.d5Notes[0]).toMatchObject({
        id: 1,
        obra: 'OV-123',
        ordemDiagrama: 'DIAG-1',
        municipio: 'Cascais',
        regional: 'Sul',
        parceira: 'Parceira A',
        tipoObra: 'Ampliação',
        status: 'Em curso',
        usuarioModificador: 'Ana Silva',
      });
    });

    it('deve remover as relações cruas do payload de saída', async () => {
      repository.get.mockResolvedValue([makeRow()]);

      const [item] = (await service.get(makeFilters())).d5Notes;

      expect(item).not.toHaveProperty('obras');
      expect(item).not.toHaveProperty('municipios');
      expect(item).not.toHaveProperty('tipos');
      expect(item).not.toHaveProperty('turmas');
      expect(item).not.toHaveProperty('novo_tabela_usuarios');
      // 'status' é reatribuído como string, não removido
      expect(typeof item.status).toBe('string');
    });

    it('deve devolver lista vazia quando não há resultados', async () => {
      repository.get.mockResolvedValue([]);

      expect((await service.get(makeFilters())).d5Notes).toEqual([]);
    });

    it('deve usar a mesma cláusula where nas duas consultas', async () => {
      await service.get(makeFilters({ idTipo: [4] } as any));

      expect(repository.get.mock.calls[0][0]).toEqual(
        repository.getTotals.mock.calls[0][0],
      );
      expect(repository.get.mock.calls[0][0]).toEqual({ id_tipo: { in: [4] } });
    });

    it('deve executar as consultas em paralelo', async () => {
      const ordem: string[] = [];
      repository.get.mockImplementation(async () => {
        ordem.push('get:inicio');
        await new Promise((r) => setTimeout(r, 10));
        ordem.push('get:fim');
        return [];
      });
      repository.getTotals.mockImplementation(async () => {
        ordem.push('totals:inicio');
        return {};
      });

      await service.get(makeFilters());

      expect(ordem).toEqual(['get:inicio', 'totals:inicio', 'get:fim']);
    });

    it('deve propagar a paginação quando a página é informada', async () => {
      await service.get(makeFilters({ page: 3 } as any));

      expect(repository.get).toHaveBeenCalledWith({}, { skip: 600, take: 200 });
    });

    it.each([
      ['dados', 'get'],
      ['totais', 'getTotals'],
    ])('deve propagar erros da consulta de %s', async (_label, method) => {
      repository[method].mockRejectedValue(new Error('falha'));

      await expect(service.get(makeFilters())).rejects.toThrow('falha');
    });

    // ---------------------------------------------------------------------
    // Cadeia de fallbacks do ordemDiagrama
    // ---------------------------------------------------------------------
    describe('ordemDiagrama', () => {
      const cases: Array<[string, Record<string, any>, unknown]> = [
        ['diagrama', { diagrama: 'D', ordem_dci: 'I' }, 'D'],
        ['ordem_dci', { diagrama: null, ordem_dci: 'I' }, 'I'],
        ['ordem_dca', { diagrama: null, ordem_dci: null, ordem_dca: 'A' }, 'A'],
        [
          'ordem_dcd',
          { diagrama: null, ordem_dci: null, ordem_dca: null, ordem_dcd: 'D2' },
          'D2',
        ],
        [
          'ordem_dcim',
          {
            diagrama: null,
            ordem_dci: null,
            ordem_dca: null,
            ordem_dcd: null,
            ordem_dcim: 'IM',
          },
          'IM',
        ],
      ];

      it.each(cases)(
        'deve resolver para %s',
        async (_label, obras, expected) => {
          repository.get.mockResolvedValue([makeRow({ obras })]);

          const [item] = (await service.get(makeFilters())).d5Notes;
          expect(item.ordemDiagrama).toBe(expected);
        },
      );

      it('deve devolver undefined quando obras é null', async () => {
        repository.get.mockResolvedValue([makeRow({ obras: null })]);

        const [item] = (await service.get(makeFilters())).d5Notes;
        expect(item.ordemDiagrama).toBeUndefined();
        expect(item.obra).toBeNull();
      });

      it('deve preservar valores falsy válidos (0 e string vazia)', async () => {
        repository.get.mockResolvedValue([
          makeRow({ obras: { diagrama: 0, ordem_dci: 'I' } }),
        ]);

        const [item] = (await service.get(makeFilters())).d5Notes;
        // ?? só ignora null/undefined — 0 deve prevalecer
        expect(item.ordemDiagrama).toBe(0);
      });
    });

    it('deve devolver null quando não há utilizador modificador', async () => {
      repository.get.mockResolvedValue([
        makeRow({ novo_tabela_usuarios: null }),
      ]);

      const [item] = (await service.get(makeFilters())).d5Notes;
      expect(item.usuarioModificador).toBeNull();
    });

    it('deve devolver null quando obras existe mas ovnota é null', async () => {
      repository.get.mockResolvedValue([
        makeRow({ obras: { ovnota: null, diagrama: 'D' } }),
      ]);

      const [item] = (await service.get(makeFilters())).d5Notes;
      expect(item.obra).toBeNull();
    });
  });

  // =========================================================================
  // getById
  // =========================================================================
  describe('getById', () => {
    it.each([
      ['zero', 0],
      ['undefined', undefined],
      ['null', null],
    ])('deve rejeitar id %s antes de consultar', async (_label, id) => {
      await expect(service.getById(id as any)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.getById(id as any)).rejects.toThrow(
        'Obra não foi enviada',
      );
      expect(repository.getById).not.toHaveBeenCalled();
    });

    it('deve devolver o detalhe achatado com os totais calculados', async () => {
      repository.getById.mockResolvedValue(
        makeDetail({
          programacoes_d5: [
            { prog: 10, exec: 8 },
            { prog: 5, exec: 5 },
          ],
        }),
      );

      const result = await service.getById(1);

      expect(repository.getById).toHaveBeenCalledWith(1);
      expect(result).toMatchObject({
        obra: 'OV-123',
        ordemDiagrama: 'DIAG-1',
        municipio: 'Cascais',
        regional: 'Sul',
        parceira: 'Parceira A',
        tipoObra: 'Ampliação',
        status: 'Em curso',
        usuarioModificador: 'Ana Silva',
        totalProgramado: 15,
        totalExecutado: 13,
      });
    });

    it('deve remover as relações cruas do detalhe', async () => {
      const result = await service.getById(1);

      expect(result).not.toHaveProperty('obras');
      expect(result).not.toHaveProperty('municipios');
      expect(result).not.toHaveProperty('programacoes_d5');
      expect(result).not.toHaveProperty('novo_tabela_usuarios');
    });

    it('deve calcular o prazo como criado_em + 7 dias', async () => {
      const criadoEm = new Date('2026-01-01T10:00:00.000Z');
      repository.getById.mockResolvedValue(makeDetail({ criado_em: criadoEm }));

      const result = await service.getById(1);

      expect(result.prazo).toEqual(moment(criadoEm).add(7, 'days').toDate());
      expect(result.prazo.getTime() - criadoEm.getTime()).toBe(
        7 * 24 * 60 * 60 * 1000,
      );
    });

    it('deve devolver totais a zero quando não há programações', async () => {
      repository.getById.mockResolvedValue(makeDetail({ programacoes_d5: [] }));

      const result = await service.getById(1);

      expect(result.totalProgramado).toBe(0);
      expect(result.totalExecutado).toBe(0);
    });

    it('deve aplicar a mesma cadeia de fallback do ordemDiagrama', async () => {
      repository.getById.mockResolvedValue(
        makeDetail({
          obras: {
            ovnota: 'OV-9',
            diagrama: null,
            ordem_dci: null,
            ordem_dca: null,
            ordem_dcd: null,
            ordem_dcim: 'IM',
          },
        }),
      );

      expect((await service.getById(1)).ordemDiagrama).toBe('IM');
    });

    it('deve tolerar obras e utilizador ausentes', async () => {
      repository.getById.mockResolvedValue(
        makeDetail({ obras: null, novo_tabela_usuarios: null }),
      );

      const result = await service.getById(1);

      expect(result.obra).toBeNull();
      expect(result.ordemDiagrama).toBeUndefined();
      expect(result.usuarioModificador).toBeNull();
    });

    it('deve propagar erros do repositório', async () => {
      repository.getById.mockRejectedValue(new Error('indisponível'));

      await expect(service.getById(1)).rejects.toThrow('indisponível');
    });

    it('deve falhar de forma explícita quando o registo não existe', async () => {
      // o serviço desestrutura diretamente o retorno
      repository.getById.mockResolvedValue(null);

      await expect(service.getById(1)).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================================
  // calculateCostPointByPointSchedule
  // =========================================================================
  describe('calculateCostPointByPointSchedule', () => {
    it('deve somar prog e exec de todas as programações', () => {
      expect(
        calculateCost([
          { prog: 1.5, exec: 1 },
          { prog: 2.5, exec: 2 },
        ]),
      ).toEqual({ totalProgramado: 4, totalExecutado: 3 });
    });

    it('deve devolver zeros para lista vazia', () => {
      expect(calculateCost([])).toEqual({
        totalProgramado: 0,
        totalExecutado: 0,
      });
    });

    it('deve lidar com valores negativos', () => {
      expect(calculateCost([{ prog: -5, exec: -2 }])).toEqual({
        totalProgramado: -5,
        totalExecutado: -2,
      });
    });

    it('deve produzir um acumulador novo a cada chamada', () => {
      const primeiro = calculateCost([{ prog: 1, exec: 1 }]);
      const segundo = calculateCost([{ prog: 1, exec: 1 }]);

      expect(primeiro).toEqual(segundo);
      expect(primeiro).not.toBe(segundo);
    });
  });

  // =========================================================================
  // buildWhereClause
  // =========================================================================
  describe('buildWhereClause', () => {
    it('deve devolver objeto vazio sem filtros', () => {
      expect(buildWhere(makeFilters())).toEqual({});
    });

    it('deve aninhar idRegional sob municipios', () => {
      expect(buildWhere(makeFilters({ idRegional: [1, 2] } as any))).toEqual({
        municipios: { id_regional: { in: [1, 2] } },
      });
    });

    it.each([
      ['idMunicipio', 'id_municipio'],
      ['idGrupo', 'id_turma'],
      ['idTipo', 'id_tipo'],
      ['idParceira', 'id_parceira'],
    ])('deve mapear %s para %s', (filterKey, columnKey) => {
      expect(
        buildWhere(makeFilters({ [filterKey]: [7] } as any))[columnKey],
      ).toEqual({ in: [7] });
    });

    it.each(['idRegional', 'idMunicipio', 'idGrupo', 'idTipo', 'idParceira'])(
      'deve ignorar %s quando é array vazio',
      (key) => {
        expect(buildWhere(makeFilters({ [key]: [] } as any))).toEqual({});
      },
    );

    it.each(['idRegional', 'idMunicipio', 'idGrupo', 'idTipo', 'idParceira'])(
      'deve ignorar %s quando é undefined',
      (key) => {
        expect(buildWhere(makeFilters({ [key]: undefined } as any))).toEqual(
          {},
        );
      },
    );

    it('deve combinar todos os filtros em simultâneo', () => {
      expect(
        buildWhere(
          makeFilters({
            idRegional: [1],
            idMunicipio: [2],
            idGrupo: [3],
            idTipo: [4],
            idParceira: [5],
          } as any),
        ),
      ).toEqual({
        municipios: { id_regional: { in: [1] } },
        id_municipio: { in: [2] },
        id_turma: { in: [3] },
        id_tipo: { in: [4] },
        id_parceira: { in: [5] },
      });
    });
  });

  // =========================================================================
  // buildPagination
  // =========================================================================
  describe('buildPagination', () => {
    it('deve devolver undefined quando a página não é informada', () => {
      expect(buildPagination(undefined)).toBeUndefined();
    });

    it.each([
      [0, { skip: 0, take: 200 }],
      [1, { skip: 200, take: 200 }],
      [4, { skip: 800, take: 200 }],
    ])('deve calcular o offset da página %i', (page, expected) => {
      expect(buildPagination(page as number)).toEqual(expected);
    });

    it('deve tratar a página 0 como válida', () => {
      expect(buildPagination(0)).toEqual({ skip: 0, take: 200 });
    });
  });
});
