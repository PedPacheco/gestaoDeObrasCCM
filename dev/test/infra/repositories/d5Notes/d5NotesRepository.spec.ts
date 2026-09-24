import { PrismaService } from 'src/infra/prisma/prisma.service';
import { D5NotesRepository } from 'src/infra/repositories/d5Notes/d5NotesRepository';

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------
const makeNote = (overrides: Record<string, any> = {}) => ({
  id: 1,
  nota_d5: 'D5-001',
  local_instalacao: 'LI-1',
  criado_em: new Date('2026-01-01T00:00:00.000Z'),
  conclusao_nota: null,
  status_sap: 'ABERTA',
  tme_executado: 1,
  tme_abertura: 2,
  validacao_anual: true,
  mo_planejada: { toNumber: () => 12.5 },
  obras: { ovnota: 'OV-1', diagrama: 'DIAG-1' },
  municipios: {
    mun_minusculo: 'Cascais',
    regionais: { regional: 'Sul' },
  },
  status: { status: 'Em curso' },
  tipos: { tipo_obra: 'Ampliação' },
  turmas: { turma: 'Parceira A' },
  novo_tabela_usuarios: { nome: 'Ana' },
  ...overrides,
});

const makeAggregate = (count = 3, sum: unknown) => ({
  _count: { _all: count },
  _sum: { mo_planejada: sum },
});

/** Campos escalares projetados por ambas as consultas. */
const SCALAR_FIELDS = [
  'id',
  'local_instalacao',
  'criado_em',
  'conclusao_nota',
  'status_sap',
  'tme_executado',
  'tme_abertura',
  'validacao_anual',
  'mo_planejada',
  'nota_d5',
];

/** Colunas exigidas pela cadeia de fallback do ordemDiagrama. */
const ORDER_FIELDS = [
  'ovnota',
  'diagrama',
  'ordem_dci',
  'ordem_dca',
  'ordem_dcd',
  'ordem_dcim',
];

describe('D5NotesRepository', () => {
  let repository: D5NotesRepository;

  const notasD5 = {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    aggregate: jest.fn(),
  };

  const prisma = { notas_d5: notasD5 } as unknown as PrismaService;

  /** Acesso à projeção partilhada, para validar o contrato. */
  const baseSelect = () => (repository as any).baseServicesSelect;

  beforeEach(() => {
    repository = new D5NotesRepository(prisma);

    notasD5.findMany.mockResolvedValue([]);
    notasD5.findUnique.mockResolvedValue(null);
    notasD5.aggregate.mockResolvedValue(makeAggregate(null, 150.3));
  });

  afterEach(() => jest.resetAllMocks());

  it('deve estar definido', () => {
    expect(repository).toBeDefined();
  });

  // =========================================================================
  // Projeção partilhada
  // =========================================================================
  describe('baseServicesSelect', () => {
    it.each(SCALAR_FIELDS)('deve incluir o campo escalar %s', (field) => {
      expect(baseSelect()[field]).toBe(true);
    });

    it.each(ORDER_FIELDS)(
      'deve incluir obras.%s (exigido pelo fallback ordemDiagrama)',
      (field) => {
        expect(baseSelect().obras.select[field]).toBe(true);
      },
    );

    it('deve incluir o município e a regional aninhada', () => {
      expect(baseSelect().municipios.select).toEqual({
        mun_minusculo: true,
        regionais: { select: { regional: true } },
      });
    });

    it.each([
      ['status', 'status'],
      ['tipos', 'tipo_obra'],
      ['turmas', 'turma'],
      ['novo_tabela_usuarios', 'nome'],
    ])('deve incluir a relação %s', (relation, field) => {
      expect(baseSelect()[relation].select[field]).toBe(true);
    });

    it('não deve incluir as programações (exclusivas do detalhe)', () => {
      expect(baseSelect()).not.toHaveProperty('programacoes_d5');
    });

    it('deve conter exatamente as chaves do contrato base', () => {
      expect(Object.keys(baseSelect()).sort()).toEqual(
        [
          ...SCALAR_FIELDS,
          'obras',
          'municipios',
          'status',
          'tipos',
          'turmas',
          'novo_tabela_usuarios',
        ].sort(),
      );
    });
  });

  // =========================================================================
  // get
  // =========================================================================
  describe('get', () => {
    const args = () => notasD5.findMany.mock.calls[0][0];

    it('deve devolver as linhas encontradas', async () => {
      const rows = [makeNote({ id: 1 }), makeNote({ id: 2 })];
      notasD5.findMany.mockResolvedValue(rows);

      expect(await repository.get({})).toBe(rows);
    });

    it('deve devolver lista vazia quando não há resultados', async () => {
      expect(await repository.get({})).toEqual([]);
    });

    it('deve repassar a cláusula where sem a modificar', async () => {
      const where = { id_municipio: { in: [1, 2] } };

      await repository.get(where);

      expect(args().where).toBe(where);
      expect(where).toEqual({ id_municipio: { in: [1, 2] } });
    });

    it('deve usar a projeção partilhada', async () => {
      await repository.get({});

      expect(args().select).toBe(baseSelect());
    });

    it('não deve usar include (evita sobre-busca)', async () => {
      await repository.get({});

      expect(args()).not.toHaveProperty('include');
    });

    it('deve chamar o Prisma exatamente uma vez', async () => {
      await repository.get({});

      expect(notasD5.findMany).toHaveBeenCalledTimes(1);
    });

    // -------------------------------------------------------------------
    // Paginação — agora sempre presente, com valor undefined
    // -------------------------------------------------------------------
    describe('paginação', () => {
      it('deve enviar skip e take como undefined quando omitida', async () => {
        await repository.get({});

        expect(args().skip).toBeUndefined();
        expect(args().take).toBeUndefined();
      });

      it('deve aplicar skip e take quando informada', async () => {
        await repository.get({}, { skip: 400, take: 200 });

        expect(args()).toMatchObject({ skip: 400, take: 200 });
      });

      it('deve aceitar skip zero (primeira página)', async () => {
        await repository.get({}, { skip: 0, take: 200 });

        expect(args().skip).toBe(0);
        expect(args().take).toBe(200);
      });

      it('deve tolerar um objeto de paginação parcial', async () => {
        await repository.get({}, { take: 50 } as any);

        expect(args().skip).toBeUndefined();
        expect(args().take).toBe(50);
      });

      it('deve tratar paginação null como ausente (optional chaining)', async () => {
        await repository.get({}, null as any);

        expect(args().skip).toBeUndefined();
        expect(args().take).toBeUndefined();
      });

      it('não deve permitir que a paginação sobreponha where ou select', async () => {
        await repository.get({ id: 1 }, {
          skip: 0,
          take: 10,
          select: { hack: true },
          where: { hack: true },
        } as any);

        expect(args().where).toEqual({ id: 1 });
        expect(args().select).toBe(baseSelect());
      });
    });

    it('deve propagar erros do Prisma', async () => {
      notasD5.findMany.mockRejectedValue(new Error('conexão perdida'));

      await expect(repository.get({})).rejects.toThrow('conexão perdida');
    });
  });

  // =========================================================================
  // getTotals
  // =========================================================================
  describe('getTotals', () => {
    it('deve devolver a contagem e a soma convertidas', async () => {
      notasD5.aggregate.mockResolvedValue(makeAggregate(7, 250.75));

      expect(await repository.getTotals({})).toEqual({
        total: 7,
        totalMoPlanejada: 250.75,
      });
    });

    it('deve repassar a cláusula where', async () => {
      const where = { id_turma: { in: [3] } };

      await repository.getTotals(where);

      expect(notasD5.aggregate.mock.calls[0][0].where).toBe(where);
    });

    it('deve pedir a contagem total e a soma da mão de obra', async () => {
      await repository.getTotals({});

      expect(notasD5.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          _count: { _all: true },
          _sum: { mo_planejada: true },
        }),
      );
    });

    it('não deve projetar colunas numa agregação', async () => {
      await repository.getTotals({});

      expect(notasD5.aggregate.mock.calls[0][0]).not.toHaveProperty('select');
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
    ])(
      'deve devolver 0 quando a soma é %s (conjunto vazio)',
      async (_l, sum) => {
        notasD5.aggregate.mockResolvedValue(makeAggregate(0, sum));

        expect(await repository.getTotals({})).toEqual({
          total: 0,
          totalMoPlanejada: 0,
        });
      },
    );

    it('deve converter um Decimal do Prisma para number', async () => {
      const decimal = { toString: () => '99.99', valueOf: () => 99.99 };
      notasD5.aggregate.mockResolvedValue(makeAggregate(1, decimal));

      expect((await repository.getTotals({})).totalMoPlanejada).toBe(99.99);
    });

    it('deve preservar a soma zero sem a confundir com ausência', async () => {
      notasD5.aggregate.mockResolvedValue(makeAggregate(5, 0));

      expect((await repository.getTotals({})).totalMoPlanejada).toBe(0);
    });

    it('deve devolver sempre um number, não um Decimal', async () => {
      notasD5.aggregate.mockResolvedValue(makeAggregate(1, '123.45'));

      const { totalMoPlanejada } = await repository.getTotals({});

      expect(typeof totalMoPlanejada).toBe('number');
      expect(totalMoPlanejada).toBe(123.45);
    });

    it('deve propagar erros do Prisma', async () => {
      notasD5.aggregate.mockRejectedValue(new Error('timeout'));

      await expect(repository.getTotals({})).rejects.toThrow('timeout');
    });
  });

  // =========================================================================
  // getById
  // =========================================================================
  describe('getById', () => {
    const args = () => notasD5.findUnique.mock.calls[0][0];

    it('deve devolver a nota encontrada', async () => {
      const note = makeNote({ programacoes_d5: [{ prog: 10, exec: 8 }] });
      notasD5.findUnique.mockResolvedValue(note);

      expect(await repository.getById(1)).toBe(note);
    });

    it('deve devolver null quando a nota não existe', async () => {
      expect(await repository.getById(999)).toBeNull();
    });

    it('deve filtrar pelo id recebido', async () => {
      await repository.getById(42);

      expect(args().where).toEqual({ id: 42 });
    });

    it('deve chamar o Prisma exatamente uma vez', async () => {
      await repository.getById(1);

      expect(notasD5.findUnique).toHaveBeenCalledTimes(1);
    });

    // -------------------------------------------------------------------
    // Projeção do detalhe
    // -------------------------------------------------------------------
    describe('projeção', () => {
      it('deve estender a projeção partilhada', async () => {
        await repository.getById(1);

        expect(args().select).toMatchObject(baseSelect());
      });

      it('deve acrescentar as programações com prog e exec', async () => {
        await repository.getById(1);

        expect(args().select.programacoes_d5).toEqual({
          select: { prog: true, exec: true },
        });
      });

      it('deve criar um novo objeto, sem mutar a projeção partilhada', async () => {
        await repository.getById(1);

        expect(args().select).not.toBe(baseSelect());
        expect(baseSelect()).not.toHaveProperty('programacoes_d5');
      });

      it('deve projetar exatamente uma chave a mais do que a listagem', async () => {
        await repository.getById(1);

        expect(Object.keys(args().select)).toHaveLength(
          Object.keys(baseSelect()).length + 1,
        );
      });

      it('não deve contaminar consultas subsequentes da listagem', async () => {
        await repository.getById(1);
        await repository.get({});

        expect(notasD5.findMany.mock.calls[0][0].select).not.toHaveProperty(
          'programacoes_d5',
        );
      });
    });

    it('deve propagar erros do Prisma', async () => {
      const error = new Error('registo bloqueado');
      notasD5.findUnique.mockRejectedValue(error);

      await expect(repository.getById(1)).rejects.toBe(error);
    });

    it('deve preservar o código de erro do Prisma', async () => {
      notasD5.findUnique.mockRejectedValue(
        Object.assign(new Error('P2025'), { code: 'P2025' }),
      );

      await expect(repository.getById(1)).rejects.toMatchObject({
        code: 'P2025',
      });
    });
  });

  // =========================================================================
  // Contrato
  // =========================================================================
  describe('contrato ID5NotesRepository', () => {
    it.each(['get', 'getTotals', 'getById'])(
      'deve implementar o método %s',
      (method) => {
        expect(typeof (repository as any)[method]).toBe('function');
      },
    );

    it('deve partilhar a mesma projeção entre instâncias independentes', () => {
      const outra = new D5NotesRepository(prisma);

      expect((outra as any).baseServicesSelect).toEqual(baseSelect());
    });
  });
});
