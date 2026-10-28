import { Prisma } from 'src/infra/generated/prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { D5NotesSchedulesRepository } from 'src/infra/repositories/d5Notes/d5NotesSchedulesRepository';

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------
const makeSchedule = (overrides: Record<string, any> = {}) => ({
  id: 1,
  id_nota_d5: 10,
  data_prog: new Date('2026-02-10T00:00:00.000Z'),
  hora_ini: new Date('2026-02-10T08:00:00.000Z'),
  hora_ter: new Date('2026-02-10T17:00:00.000Z'),
  prog: 50,
  exec: 40,
  caminhos_arquivos: ['a.pdf'],
  ...overrides,
});

const makeCreateData = (overrides: Record<string, any> = {}) => ({
  id_nota_d5: 10,
  data_prog: new Date('2026-02-10T00:00:00.000Z'),
  prog: 50,
  id_usuario_criador: 7,
  id_usuario_modificador: 7,
  ...overrides,
});

const makeUpdateData = (overrides: Record<string, any> = {}) => ({
  prog: 80,
  exec: 60,
  id_usuario_modificador: 20,
  ...overrides,
});

const makeRejectionData = (overrides: Record<string, any> = {}) => ({
  motivo: 'Data incorreta',
  descricao: 'Data de programação errada',
  data_prog: new Date('2026-09-10'),
  prog: 100,
  ...overrides,
});

const makeRejectionList = (
  spec: number | Array<Record<string, any>> = 2,
  shared: Record<string, any> = {},
) => {
  const items = typeof spec === 'number' ? Array(spec).fill({}) : spec;

  return items.map((overrides, index) =>
    makeRejectionData({
      id_nota_d5: 10 + index,
      id_usuario_reprovador: 7,
      ...shared,
      ...overrides,
    }),
  );
};

const makeRejectionIds = (count = 2, start = 1) =>
  Array.from({ length: count }, (_, index) => start + index);

/** Soma de exec usada no recálculo do estado da obra. */
const makeExecSum = (total: number | null) => ({ _sum: { exec: total } });

/** Default que satisfaz ambos os usos de aggregate. */
const makeAggregateDefault = () => ({
  _count: { _all: 0 },
  _sum: { exec: 0 },
});

const makeNoteRow = (
  overrides: Partial<{
    id: number;
    mo_planejada: Prisma.Decimal | number | null;
    programacoes_d5: { prog: number | null }[];
  }> = {},
) => ({
  id: 1,
  mo_planejada: 1000,
  programacoes_d5: [{ prog: 50 }],
  ...overrides,
});

/** Chaves esperadas na projeção partilhada. */
const BASE_SELECT_KEYS = [
  'data_prog',
  'hora_ini',
  'hora_ter',
  'prog',
  'exec',
  'equipe_lm',
  'equipe_lv',
  'equipe_reg',
  'chave_provisoria',
  'chi',
  'num_dp',
  'tipo_servico',
  'observacao_programacao',
];

const ORDER_FIELDS = [
  'ovnota',
  'diagrama',
  'ordem_dci',
  'ordem_dca',
  'ordem_dcd',
  'ordem_dcim',
];

describe('D5NotesSchedulesRepository', () => {
  let repository: D5NotesSchedulesRepository;

  const programacoesD5 = {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    aggregate: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
  };

  const notasD5 = {
    update: vi.fn(),
    findMany: vi.fn(),
  };

  const programacoesD5Reprovacoes = {
    createMany: vi.fn(),
    findMany: vi.fn(),
  };

  /** Cliente transacional entregue ao callback de $transaction. */
  const tx = {
    programacoes_d5: programacoesD5,
    programacoes_d5_reprovacoes: programacoesD5Reprovacoes,
    notas_d5: notasD5,
  };

  const prisma = {
    programacoes_d5: programacoesD5,
    notas_d5: notasD5,
    programacoes_d5_reprovacoes: programacoesD5Reprovacoes,
    $transaction: vi.fn((cb: (client: typeof tx) => Promise<unknown>) =>
      cb(tx),
    ),
  } as unknown as PrismaService;

  /** Acesso à projeção partilhada, para validar o contrato. */
  const baseSelect = () => (repository as any).baseScheduleSelect;

  const mockExecSum = (total: number | null) =>
    programacoesD5.aggregate.mockResolvedValue(makeExecSum(total));

  beforeEach(() => {
    repository = new D5NotesSchedulesRepository(prisma);

    programacoesD5.findMany.mockResolvedValue([]);
    programacoesD5.findUnique.mockResolvedValue(null);
    programacoesD5.aggregate.mockResolvedValue(makeAggregateDefault());
    programacoesD5.create.mockResolvedValue(undefined);
    programacoesD5.update.mockResolvedValue(undefined);
    programacoesD5.updateMany.mockResolvedValue(undefined);
    programacoesD5Reprovacoes.createMany.mockResolvedValue(undefined);
    programacoesD5.delete.mockResolvedValue(undefined);
    notasD5.update.mockResolvedValue(undefined);
    notasD5.findMany.mockResolvedValue([]);
    (prisma as any).$transaction.mockImplementation(
      (cb: (client: typeof tx) => Promise<unknown>) => cb(tx),
    );
  });

  afterEach(() => vi.resetAllMocks());

  it('deve estar definido', () => {
    expect(repository).toBeDefined();
  });

  // =========================================================================
  // Projeção partilhada
  // =========================================================================
  describe('baseScheduleSelect', () => {
    it.each(BASE_SELECT_KEYS)('deve incluir o campo %s', (field) => {
      expect(baseSelect()[field]).toBe(true);
    });

    it('deve conter exatamente as chaves comuns da programação', () => {
      expect(Object.keys(baseSelect()).sort()).toEqual(
        [...BASE_SELECT_KEYS].sort(),
      );
    });

    it('não deve incluir identificadores (variam por consulta)', () => {
      expect(baseSelect()).not.toHaveProperty('id');
      expect(baseSelect()).not.toHaveProperty('id_nota_d5');
    });

    it('não deve incluir relações (variam por consumidor)', () => {
      expect(baseSelect()).not.toHaveProperty('tecnicos');
      expect(baseSelect()).not.toHaveProperty('restricoes');
      expect(baseSelect()).not.toHaveProperty('notas_d5');
    });

    it('não deve incluir os anexos (exclusivos das consultas de detalhe)', () => {
      expect(baseSelect()).not.toHaveProperty('caminhos_arquivos');
    });
  });

  // =========================================================================
  // get
  // =========================================================================
  describe('get', () => {
    const args = () => programacoesD5.findMany.mock.calls[0][0];
    const select = () => args().select;

    it('deve devolver as linhas encontradas', async () => {
      const rows = [makeSchedule({ id: 1 }), makeSchedule({ id: 2 })];
      programacoesD5.findMany.mockResolvedValue(rows);

      expect(await repository.get({})).toBe(rows);
    });

    it('deve devolver lista vazia quando não há resultados', async () => {
      expect(await repository.get({})).toEqual([]);
    });

    it('deve repassar a cláusula where sem a modificar', async () => {
      const where = { id_turma: { in: [3] } };

      await repository.get(where);

      expect(args().where).toBe(where);
      expect(where).toEqual({ id_turma: { in: [3] } });
    });

    it('deve chamar o Prisma exatamente uma vez', async () => {
      await repository.get({});

      expect(programacoesD5.findMany).toHaveBeenCalledTimes(1);
    });

    // -------------------------------------------------------------------
    // Paginação — agora explícita
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
          where: { hack: true },
          select: { hack: true },
        } as any);

        expect(args().where).toEqual({ id: 1 });
        expect(select().prog).toBe(true);
        expect(select()).not.toHaveProperty('hack');
      });
    });

    // -------------------------------------------------------------------
    // Projeção
    // -------------------------------------------------------------------
    describe('projeção', () => {
      it('deve estender a projeção partilhada', async () => {
        await repository.get({});

        expect(select()).toMatchObject(baseSelect());
      });

      it('deve criar um novo objeto, sem mutar a projeção partilhada', async () => {
        await repository.get({});

        expect(select()).not.toBe(baseSelect());
        expect(baseSelect()).not.toHaveProperty('notas_d5');
      });

      it('deve projetar o técnico sem o id (listagem só usa o nome)', async () => {
        await repository.get({});

        expect(select().tecnicos).toEqual({ select: { tecnico: true } });
      });

      it.each([
        'id',
        'local_instalacao',
        'criado_em',
        'conclusao_nota',
        'status_sap',
        'mo_planejada',
        'nota_d5',
      ])('deve projetar notas_d5.%s', async (field) => {
        await repository.get({});

        expect(select().notas_d5.select[field]).toBe(true);
      });

      it.each(ORDER_FIELDS)(
        'deve projetar notas_d5.obras.%s (exigido pelo fallback do mapper)',
        async (field) => {
          await repository.get({});

          expect(select().notas_d5.select.obras.select[field]).toBe(true);
        },
      );

      it('deve projetar o município e a regional aninhada', async () => {
        await repository.get({});

        expect(select().notas_d5.select.municipios.select).toEqual({
          mun_minusculo: true,
          regionais: { select: { regional: true } },
        });
      });

      it.each([
        ['status', 'status'],
        ['tipos', 'tipo_obra'],
        ['turmas', 'turma'],
        ['novo_tabela_usuarios', 'nome'],
      ])('deve projetar notas_d5.%s', async (relation, field) => {
        await repository.get({});

        expect(select().notas_d5.select[relation].select[field]).toBe(true);
      });

      it('não deve projetar os anexos na listagem (performance)', async () => {
        await repository.get({});

        expect(select()).not.toHaveProperty('caminhos_arquivos');
      });

      it('não deve projetar o identificador da programação na listagem', async () => {
        await repository.get({});

        // o mapper substitui o id pelo da nota
        expect(select()).not.toHaveProperty('id');
      });

      it('não deve usar include (evita sobre-busca)', async () => {
        await repository.get({});

        expect(args()).not.toHaveProperty('include');
      });
    });

    it('deve propagar erros do Prisma', async () => {
      programacoesD5.findMany.mockRejectedValue(new Error('conexão perdida'));

      await expect(repository.get({})).rejects.toThrow('conexão perdida');
    });
  });

  // =========================================================================
  // getById
  // =========================================================================
  describe('getById', () => {
    const args = () => programacoesD5.findUnique.mock.calls[0][0];
    const select = () => args().select;

    it('deve devolver a programação encontrada', async () => {
      const row = makeSchedule();
      programacoesD5.findUnique.mockResolvedValue(row);

      expect(await repository.getById(1)).toBe(row);
    });

    it('deve devolver null quando não existe', async () => {
      expect(await repository.getById(999)).toBeNull();
    });

    it('deve filtrar pelo id recebido', async () => {
      await repository.getById(42);

      expect(args().where).toEqual({ id: 42 });
    });

    it('deve chamar o Prisma exatamente uma vez', async () => {
      await repository.getById(1);

      expect(programacoesD5.findUnique).toHaveBeenCalledTimes(1);
    });

    describe('projeção', () => {
      it('deve estender a projeção partilhada', async () => {
        await repository.getById(1);

        expect(select()).toMatchObject(baseSelect());
      });

      it('deve criar um novo objeto, sem mutar a projeção partilhada', async () => {
        await repository.getById(1);

        expect(select()).not.toBe(baseSelect());
        expect(baseSelect()).not.toHaveProperty('caminhos_arquivos');
      });

      it.each([
        'id',
        'id_nota_d5',
        'observacao_execucao',
        'responsavel_restricao',
        'id_usuario_criador',
        'id_usuario_modificador',
        'id_restricao',
        'id_tecnico',
        'caminhos_arquivos',
      ])('deve projetar o campo %s exigido pelo toDomain', async (field) => {
        await repository.getById(1);

        expect(select()[field]).toBe(true);
      });

      it('deve projetar escalares em vez de relações (uso interno do domínio)', async () => {
        await repository.getById(1);

        expect(select()).not.toHaveProperty('tecnicos');
        expect(select()).not.toHaveProperty('restricoes');
        expect(select().id_tecnico).toBe(true);
        expect(select().id_restricao).toBe(true);
      });

      it('deve projetar os anexos (necessários ao diff de ficheiros)', async () => {
        await repository.getById(1);

        expect(select().caminhos_arquivos).toBe(true);
      });

      it('não deve projetar a nota associada', async () => {
        await repository.getById(1);

        expect(select()).not.toHaveProperty('notas_d5');
      });
    });

    it('deve propagar erros do Prisma', async () => {
      const error = Object.assign(new Error('P2025'), { code: 'P2025' });
      programacoesD5.findUnique.mockRejectedValue(error);

      await expect(repository.getById(1)).rejects.toBe(error);
    });
  });

  // =========================================================================
  // getByD5NoteId
  // =========================================================================
  describe('getByD5NoteId', () => {
    const args = () => programacoesD5.findMany.mock.calls[0][0];
    const select = () => args().select;

    it('deve devolver as programações da nota', async () => {
      const rows = [makeSchedule({ id: 1 }), makeSchedule({ id: 2 })];
      programacoesD5.findMany.mockResolvedValue(rows);

      expect(await repository.getByD5NoteId(10)).toBe(rows);
    });

    it('deve devolver lista vazia quando a nota não tem programações', async () => {
      expect(await repository.getByD5NoteId(10)).toEqual([]);
    });

    it('deve filtrar pela nota recebida', async () => {
      await repository.getByD5NoteId(77);

      expect(args().where).toEqual({ id_nota_d5: 77 });
    });

    it('não deve aplicar paginação (todas as programações da nota)', async () => {
      await repository.getByD5NoteId(10);

      expect(args()).not.toHaveProperty('skip');
      expect(args()).not.toHaveProperty('take');
    });

    describe('projeção', () => {
      it('deve estender a projeção partilhada', async () => {
        await repository.getByD5NoteId(10);

        expect(select()).toMatchObject(baseSelect());
      });

      it.each([
        'id',
        'id_nota_d5',
        'criado_em',
        'observacao_execucao',
        'responsavel_restricao',
        'caminhos_arquivos',
      ])('deve projetar o campo %s', async (field) => {
        await repository.getByD5NoteId(10);

        expect(select()[field]).toBe(true);
      });

      it.each([
        ['tecnicos', { id: true, tecnico: true }],
        ['restricoes', { id: true, restricao: true }],
        ['usuario_criador', { nome: true }],
        ['usuario_modificador', { nome: true }],
      ])(
        'deve projetar a relação %s exigida pelo toResponse',
        async (relation, expected) => {
          await repository.getByD5NoteId(10);

          expect(select()[relation]).toEqual({ select: expected });
        },
      );

      it('deve projetar relações em vez de escalares (resposta da API)', async () => {
        await repository.getByD5NoteId(10);

        expect(select()).not.toHaveProperty('id_tecnico');
        expect(select()).not.toHaveProperty('id_restricao');
      });

      it('deve projetar o técnico com id, ao contrário da listagem', async () => {
        await repository.getByD5NoteId(10);

        expect(select().tecnicos.select.id).toBe(true);
      });

      it('não deve projetar a nota associada (já conhecida pelo chamador)', async () => {
        await repository.getByD5NoteId(10);

        expect(select()).not.toHaveProperty('notas_d5');
      });
    });

    it('deve propagar erros do Prisma', async () => {
      programacoesD5.findMany.mockRejectedValue(new Error('timeout'));

      await expect(repository.getByD5NoteId(10)).rejects.toThrow('timeout');
    });
  });

  // =========================================================================
  // getTotals
  // =========================================================================
  describe('getTotals', () => {
    describe('consulta', () => {
      it('deve consultar as notas com pelo menos uma programação que cumpre o filtro', async () => {
        const where = { id_municipio: { in: [1] } };

        await repository.getTotals(where);

        expect(notasD5.findMany.mock.calls[0][0].where).toEqual({
          programacoes_d5: { some: where },
        });
      });

      it('deve aplicar o mesmo filtro às programações incluídas', async () => {
        const where = { id_municipio: { in: [1] } };

        await repository.getTotals(where);

        const args = notasD5.findMany.mock.calls[0][0];
        expect(args.where.programacoes_d5.some).toBe(where);
        expect(args.select.programacoes_d5.where).toBe(where);
      });

      it('deve pedir apenas id, mo_planejada e prog', async () => {
        await repository.getTotals({});

        expect(notasD5.findMany).toHaveBeenCalledWith({
          where: { programacoes_d5: { some: {} } },
          select: {
            id: true,
            mo_planejada: true,
            programacoes_d5: { where: {}, select: { prog: true } },
          },
        });
      });
    });

    describe('mapeamento', () => {
      it('deve devolver a MO e as percentagens programadas de cada nota', async () => {
        notasD5.findMany.mockResolvedValue([
          makeNoteRow({
            id: 2,
            mo_planejada: 5245,
            programacoes_d5: [{ prog: 50 }, { prog: 50 }],
          }),
        ]);

        expect(await repository.getTotals({})).toEqual([
          { noteId: 2, moRetida: 5245, progs: [50, 50] },
        ]);
      });

      it('deve converter mo_planejada do tipo Decimal para number', async () => {
        notasD5.findMany.mockResolvedValue([
          makeNoteRow({ mo_planejada: new Prisma.Decimal('5245.50') }),
        ]);

        const [note] = await repository.getTotals({});

        expect(note.moRetida).toBe(5245.5);
        expect(typeof note.moRetida).toBe('number');
      });

      it('deve usar zero quando mo_planejada é nula', async () => {
        notasD5.findMany.mockResolvedValue([
          makeNoteRow({ mo_planejada: null }),
        ]);

        const [note] = await repository.getTotals({});

        expect(note.moRetida).toBe(0);
      });

      it('deve usar zero quando prog é nulo', async () => {
        notasD5.findMany.mockResolvedValue([
          makeNoteRow({ programacoes_d5: [{ prog: null }, { prog: 30 }] }),
        ]);

        const [note] = await repository.getTotals({});

        expect(note.progs).toEqual([0, 30]);
      });

      it('deve devolver progs vazio quando a nota não tem programações incluídas', async () => {
        notasD5.findMany.mockResolvedValue([
          makeNoteRow({ programacoes_d5: [] }),
        ]);

        const [note] = await repository.getTotals({});

        expect(note.progs).toEqual([]);
      });

      it('deve preservar a ordem das notas', async () => {
        notasD5.findMany.mockResolvedValue([
          makeNoteRow({ id: 9 }),
          makeNoteRow({ id: 3 }),
        ]);

        const result = await repository.getTotals({});

        expect(result.map((n) => n.noteId)).toEqual([9, 3]);
      });

      it('deve devolver apenas as chaves noteId, moRetida e progs', async () => {
        notasD5.findMany.mockResolvedValue([makeNoteRow()]);

        const [note] = await repository.getTotals({});

        expect(Object.keys(note).sort()).toEqual([
          'moRetida',
          'noteId',
          'progs',
        ]);
      });
    });

    describe('casos limite', () => {
      it('deve devolver uma lista vazia quando não há notas', async () => {
        notasD5.findMany.mockResolvedValue([]);

        expect(await repository.getTotals({})).toEqual([]);
      });

      it('deve propagar erros do Prisma', async () => {
        notasD5.findMany.mockRejectedValue(new Error('falha'));

        await expect(repository.getTotals({})).rejects.toThrow('falha');
      });
    });
  });

  describe('findRejections', () => {
    describe('consulta', () => {
      it('deve consultar as reprovações de determinada Nota D5', async () => {
        const D5_NOTE_ID = 5;

        await repository.findRejections(D5_NOTE_ID);

        expect(
          programacoesD5Reprovacoes.findMany.mock.calls[0][0].where,
        ).toEqual({ id_nota_d5: 5 });
      });

      it('deve buscar os campos e relacionamentos corretos para retorno dos dados', async () => {
        await repository.findRejections(5);

        expect(programacoesD5Reprovacoes.findMany).toHaveBeenCalledWith({
          where: { id_nota_d5: 5 },
          select: {
            id: true,
            data_reprovacao: true,
            data_prog: true,
            hora_ini: true,
            hora_ter: true,
            prog: true,
            descricao: true,
            equipe_lm: true,
            equipe_lv: true,
            equipe_reg: true,
            tipo_servico: true,
            chave_provisoria: true,
            chi: true,
            num_dp: true,
            observacao_programacao: true,
            restricoes: { select: { restricao: true } },
            novo_tabela_usuarios: { select: { nome: true } },
          },
        });
      });
    });

    describe('casos limite', () => {
      it('deve devolver uma lista vazia quando não há notas', async () => {
        programacoesD5Reprovacoes.findMany.mockResolvedValue([]);

        expect(await repository.findRejections(1)).toEqual([]);
      });

      it('deve propagar erros do Prisma', async () => {
        programacoesD5Reprovacoes.findMany.mockRejectedValue(
          new Error('falha'),
        );

        await expect(repository.findRejections(1)).rejects.toThrow('falha');
      });
    });
  });

  // =========================================================================
  // create
  // =========================================================================
  describe('create', () => {
    const D5_NOTE_ID = 10;

    const run = (
      id = D5_NOTE_ID,
      data: Record<string, any> = makeCreateData(),
    ) => repository.create(id, data as any);

    describe('criação da programação', () => {
      it('deve criar a programação com os dados recebidos', async () => {
        const data = makeCreateData();

        await run(D5_NOTE_ID, data);

        expect(programacoesD5.create).toHaveBeenCalledWith({ data });
      });

      it('não deve modificar o objeto recebido', async () => {
        const data = makeCreateData();
        const snapshot = { ...data };

        await run(D5_NOTE_ID, data);

        expect(data).toEqual(snapshot);
      });

      it('não deve projetar colunas no retorno (void)', async () => {
        await run();

        expect(programacoesD5.create.mock.calls[0][0]).not.toHaveProperty(
          'select',
        );
      });

      it('deve descartar o retorno do Prisma', async () => {
        programacoesD5.create.mockResolvedValue({ id: 99 });

        expect(await run()).toBeUndefined();
      });
    });

    describe('sincronização do estado da nota', () => {
      it('deve marcar a nota como em programação', async () => {
        await run();

        expect(notasD5.update).toHaveBeenCalledWith({
          where: { id: D5_NOTE_ID },
          data: { id_status: 35 },
        });
      });

      it('não deve alterar o status_sap da nota', async () => {
        await run();

        expect(notasD5.update.mock.calls[0][0].data).not.toHaveProperty(
          'status_sap',
        );
      });

      it('deve usar o id recebido para localizar a nota', async () => {
        await run(77);

        expect(notasD5.update).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: 77 } }),
        );
      });

      it('deve atualizar a nota antes de criar a programação', async () => {
        const order: string[] = [];
        notasD5.update.mockImplementation(async () => {
          order.push('nota');
        });
        programacoesD5.create.mockImplementation(async () => {
          order.push('programacao');
        });

        await run();

        expect(order).toEqual(['nota', 'programacao']);
      });
    });

    describe('transação', () => {
      it('deve executar ambas as operações numa única transação', async () => {
        await run();

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(notasD5.update).toHaveBeenCalledTimes(1);
        expect(programacoesD5.create).toHaveBeenCalledTimes(1);
      });
    });

    describe('propagação de erros', () => {
      it('deve propagar violações de chave estrangeira', async () => {
        const error = Object.assign(new Error('FK'), { code: 'P2003' });
        programacoesD5.create.mockRejectedValue(error);

        await expect(run()).rejects.toBe(error);
      });

      it('deve propagar P2025 quando a nota D5 não existe', async () => {
        const error = Object.assign(new Error('nota inexistente'), {
          code: 'P2025',
        });
        notasD5.update.mockRejectedValue(error);

        await expect(run(999)).rejects.toMatchObject({ code: 'P2025' });
      });

      it('não deve criar a programação quando a nota falha', async () => {
        notasD5.update.mockRejectedValue(new Error('falha na nota'));

        await expect(run()).rejects.toThrow('falha na nota');

        expect(programacoesD5.create).not.toHaveBeenCalled();
      });
    });
  });

  // =========================================================================
  // update
  // =========================================================================
  describe('updateAndSyncWorkStatus', () => {
    const SCHEDULE_ID = 5;
    const D5_NOTE_ID = 10;

    const run = (
      id = SCHEDULE_ID,
      data: Record<string, any> = makeUpdateData(),
      noteId = D5_NOTE_ID,
      isRejectedD5Note = false,
    ) =>
      repository.updateAndSyncWorkStatus(
        id,
        data as any,
        noteId,
        isRejectedD5Note,
      );

    describe('atualização da programação', () => {
      it('deve atualizar a programação indicada', async () => {
        const data = makeUpdateData();

        await run(SCHEDULE_ID, data);

        expect(programacoesD5.update).toHaveBeenCalledWith({
          where: { id: SCHEDULE_ID },
          data: { reprovada: false, ...data },
        });
      });

      it('não deve modificar o objeto recebido', async () => {
        const data = makeUpdateData();
        const snapshot = { ...data };

        await run(SCHEDULE_ID, data);

        expect(data).toEqual(snapshot);
      });

      it('deve resolver sem valor de retorno', async () => {
        await expect(run()).resolves.toBeUndefined();
      });

      it('deve aceitar um objeto de alterações vazio', async () => {
        await run(SCHEDULE_ID, {});

        expect(programacoesD5.update).toHaveBeenCalledWith({
          where: { id: SCHEDULE_ID },
          data: { reprovada: false },
        });
      });

      it('deve executar todas as operações numa única transação', async () => {
        mockExecSum(100);
        const data = makeUpdateData();

        await run(SCHEDULE_ID, data, D5_NOTE_ID, true);

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(programacoesD5.update).toHaveBeenCalledTimes(1);
        expect(notasD5.update).toHaveBeenCalledTimes(2);
      });
    });

    describe('recálculo do total executado', () => {
      it('deve somar o exec de todas as programações da nota', async () => {
        await run();

        expect(programacoesD5.aggregate).toHaveBeenCalledWith({
          where: { id_nota_d5: D5_NOTE_ID },
          _sum: { exec: true },
        });
      });

      it('deve agregar apenas após gravar a atualização', async () => {
        const order: string[] = [];
        programacoesD5.update.mockImplementation(async () => {
          order.push('update');
        });
        programacoesD5.aggregate.mockImplementation(async () => {
          order.push('aggregate');
          return makeExecSum(0);
        });

        await run();

        expect(order).toEqual(['update', 'aggregate']);
      });

      it('deve usar o d5NoteId recebido e não o id da programação', async () => {
        await run(SCHEDULE_ID, makeUpdateData(), 99);

        expect(programacoesD5.aggregate).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id_nota_d5: 99 } }),
        );
      });
    });

    describe('sincronização do estado da nota', () => {
      it.each([
        ['nulo', null],
        ['zero', 0],
        ['abaixo do limiar', 99],
        ['imediatamente abaixo', 99.99],
      ])('não deve concluir a nota com total %s', async (_label, total) => {
        mockExecSum(total);

        await run();

        expect(notasD5.update).not.toHaveBeenCalled();
      });

      it.each([
        ['exatamente no limiar', 100],
        ['acima do limiar', 150],
      ])('deve concluir a nota com total %s', async (_label, total) => {
        mockExecSum(total);

        await run();

        expect(notasD5.update).toHaveBeenCalledWith({
          where: { id: D5_NOTE_ID },
          data: { id_status: 2 },
        });
      });

      it('deve tratar _sum.exec ausente como zero', async () => {
        programacoesD5.aggregate.mockResolvedValue({ _sum: {} });

        await run();

        expect(notasD5.update).not.toHaveBeenCalled();
      });

      it('deve concluir a nota indicada pelo d5NoteId', async () => {
        mockExecSum(100);

        await run(SCHEDULE_ID, makeUpdateData(), 42);

        expect(notasD5.update).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: 42 } }),
        );
      });
    });

    describe('propagação de erros', () => {
      it('deve propagar P2025 quando a programação não existe', async () => {
        const error = Object.assign(new Error('não encontrado'), {
          code: 'P2025',
        });
        programacoesD5.update.mockRejectedValue(error);

        await expect(run(999)).rejects.toMatchObject({ code: 'P2025' });
      });

      it('não deve agregar nem concluir quando a atualização falha', async () => {
        programacoesD5.update.mockRejectedValue(new Error('falha na gravação'));

        await expect(run()).rejects.toThrow('falha na gravação');

        expect(programacoesD5.aggregate).not.toHaveBeenCalled();
        expect(notasD5.update).not.toHaveBeenCalled();
      });

      it('não deve concluir a nota quando a agregação falha', async () => {
        programacoesD5.aggregate.mockRejectedValue(
          new Error('falha no cálculo'),
        );

        await expect(run()).rejects.toThrow('falha no cálculo');

        expect(notasD5.update).not.toHaveBeenCalled();
      });

      it('deve propagar P2025 quando a nota D5 não existe', async () => {
        mockExecSum(100);
        const error = Object.assign(new Error('nota inexistente'), {
          code: 'P2025',
        });
        notasD5.update.mockRejectedValue(error);

        await expect(
          run(SCHEDULE_ID, makeUpdateData(), 999),
        ).rejects.toMatchObject({ code: 'P2025' });
      });
    });
  });

  // =========================================================================
  // delete
  // =========================================================================
  describe('delete', () => {
    it('deve eliminar a programação indicada', async () => {
      await repository.delete(5);

      expect(programacoesD5.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    });

    it('deve resolver sem valor de retorno', async () => {
      await expect(repository.delete(5)).resolves.toBeUndefined();
    });

    it('deve chamar o Prisma exatamente uma vez', async () => {
      await repository.delete(5);

      expect(programacoesD5.delete).toHaveBeenCalledTimes(1);
    });

    it('deve propagar P2025 quando o registo não existe', async () => {
      const error = Object.assign(new Error('não encontrado'), {
        code: 'P2025',
      });
      programacoesD5.delete.mockRejectedValue(error);

      await expect(repository.delete(999)).rejects.toMatchObject({
        code: 'P2025',
      });
    });
  });

  // =========================================================================
  // reject
  // =========================================================================
  describe('rejectMany', () => {
    const run = (
      ids: number[] = makeRejectionIds(),
      rejections: Record<string, any>[] = makeRejectionList(),
    ) => repository.rejectMany(ids, rejections as any, 5);

    describe('registo das reprovações', () => {
      it('deve inserir todas as reprovações recebidas', async () => {
        const rejections = makeRejectionList(3);

        await run(makeRejectionIds(3), rejections);

        expect(programacoesD5Reprovacoes.createMany).toHaveBeenCalledWith({
          data: rejections,
        });
      });

      it('não deve modificar a lista recebida', async () => {
        const rejections = makeRejectionList(2);
        const snapshot = rejections.map((r) => ({ ...r }));

        await run(makeRejectionIds(2), rejections);

        expect(rejections).toEqual(snapshot);
      });

      it('não deve projetar colunas no retorno (void)', async () => {
        await run();

        expect(
          programacoesD5Reprovacoes.createMany.mock.calls[0][0],
        ).not.toHaveProperty('select');
      });

      it('deve descartar o retorno do Prisma', async () => {
        programacoesD5Reprovacoes.createMany.mockResolvedValue({ count: 3 });
        programacoesD5.updateMany.mockResolvedValue({ count: 3 });

        expect(await run()).toBeUndefined();
      });

      it('deve preservar a ordem dos registos', async () => {
        const rejections = makeRejectionList([
          { motivo: 'Primeiro' },
          { motivo: 'Segundo' },
        ]);

        await run(makeRejectionIds(2), rejections);

        const sent = programacoesD5Reprovacoes.createMany.mock.calls[0][0].data;
        expect(sent.map((r: any) => r.motivo)).toEqual(['Primeiro', 'Segundo']);
      });
    });

    describe('estado da nota D5', () => {
      it('deve repor o estado da nota indicada para 1', async () => {
        await run();

        expect(notasD5.update).toHaveBeenCalledWith({
          where: { id: 5 },
          data: { id_status: 1 },
        });
      });

      it('não deve alterar outros campos da nota além de id_status', async () => {
        await run();

        expect(Object.keys(notasD5.update.mock.calls[0][0].data)).toEqual([
          'id_status',
        ]);
      });

      it('deve atualizar a nota apenas depois de inserir e marcar', async () => {
        const order: string[] = [];
        programacoesD5Reprovacoes.createMany.mockImplementation(async () => {
          order.push('reprovacoes');
          return { count: 0 };
        });
        programacoesD5.updateMany.mockImplementation(async () => {
          order.push('programacoes');
          return { count: 0 };
        });
        notasD5.update.mockImplementation(async () => {
          order.push('nota');
          return {};
        });

        await run();

        expect(order).toEqual(['reprovacoes', 'programacoes', 'nota']);
      });
    });

    describe('marcação das programações', () => {
      it('deve marcar como reprovadas apenas os ids indicados', async () => {
        await run([3, 7, 11]);

        expect(programacoesD5.updateMany).toHaveBeenCalledWith({
          where: { id: { in: [3, 7, 11] } },
          data: { reprovada: true },
        });
      });

      it('não deve alterar outros campos além de reprovada', async () => {
        await run();

        expect(
          Object.keys(programacoesD5.updateMany.mock.calls[0][0].data),
        ).toEqual(['reprovada']);
      });

      it('deve inserir as reprovações antes de marcar as programações', async () => {
        const order: string[] = [];
        programacoesD5Reprovacoes.createMany.mockImplementation(async () => {
          order.push('reprovacoes');
          return { count: 0 };
        });
        programacoesD5.updateMany.mockImplementation(async () => {
          order.push('programacoes');
          return { count: 0 };
        });

        await run();

        expect(order).toEqual(['reprovacoes', 'programacoes']);
      });
    });

    describe('transação', () => {
      it('deve executar as três operações numa única transação', async () => {
        await run();

        expect(prisma.$transaction).toHaveBeenCalledTimes(1);
        expect(programacoesD5Reprovacoes.createMany).toHaveBeenCalledTimes(1);
        expect(programacoesD5.updateMany).toHaveBeenCalledTimes(1);
        expect(notasD5.update).toHaveBeenCalledTimes(1);
      });
    });

    describe('casos limite', () => {
      it('deve resolver sem valor de retorno', async () => {
        await expect(run()).resolves.toBeUndefined();
      });

      it('deve aceitar listas vazias', async () => {
        await run([], []);

        expect(programacoesD5Reprovacoes.createMany).toHaveBeenCalledWith({
          data: [],
        });
        expect(programacoesD5.updateMany).toHaveBeenCalledWith({
          where: { id: { in: [] } },
          data: { reprovada: true },
        });
      });

      it('deve repassar ids duplicados sem os normalizar', async () => {
        await run([5, 5, 8]);

        expect(programacoesD5.updateMany).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: { in: [5, 5, 8] } } }),
        );
      });
    });

    describe('propagação de erros', () => {
      it('deve propagar violações de chave estrangeira', async () => {
        const error = Object.assign(new Error('FK'), { code: 'P2003' });
        programacoesD5Reprovacoes.createMany.mockRejectedValue(error);

        await expect(run()).rejects.toBe(error);
      });

      it('não deve marcar as programações quando a inserção falha', async () => {
        programacoesD5Reprovacoes.createMany.mockRejectedValue(
          new Error('falha na inserção'),
        );

        await expect(run()).rejects.toThrow('falha na inserção');

        expect(programacoesD5.updateMany).not.toHaveBeenCalled();
      });

      it('deve propagar erros da marcação', async () => {
        programacoesD5.updateMany.mockRejectedValue(
          new Error('falha na marcação'),
        );

        await expect(run()).rejects.toThrow('falha na marcação');
      });
    });
  });

  // =========================================================================
  // Coerência entre projeções
  // =========================================================================
  describe('coerência entre projeções', () => {
    it('os três métodos de leitura devem partilhar os campos comuns', async () => {
      await repository.getById(1);
      await repository.getByD5NoteId(10);

      const byId = programacoesD5.findUnique.mock.calls[0][0].select;
      const byNote = programacoesD5.findMany.mock.calls[0][0].select;

      BASE_SELECT_KEYS.forEach((field) => {
        expect(byId[field]).toBe(true);
        expect(byNote[field]).toBe(true);
      });
    });

    it('nenhuma consulta deve contaminar a projeção partilhada', async () => {
      await repository.get({});
      await repository.getById(1);
      await repository.getByD5NoteId(10);

      expect(Object.keys(baseSelect()).sort()).toEqual(
        [...BASE_SELECT_KEYS].sort(),
      );
    });

    it('apenas as consultas de detalhe devem projetar os anexos', async () => {
      await repository.get({});
      await repository.getById(1);

      expect(
        programacoesD5.findMany.mock.calls[0][0].select,
      ).not.toHaveProperty('caminhos_arquivos');
      expect(
        programacoesD5.findUnique.mock.calls[0][0].select.caminhos_arquivos,
      ).toBe(true);
    });
  });

  // =========================================================================
  // Contrato
  // =========================================================================
  describe('contrato ID5NotesSchedulesRepository', () => {
    it.each([
      'get',
      'getById',
      'getByD5NoteId',
      'getTotals',
      'create',
      'updateAndSyncWorkStatus',
      'delete',
    ])('deve implementar o método %s', (method) => {
      expect(typeof (repository as any)[method]).toBe('function');
    });

    it('deve partilhar a mesma projeção entre instâncias independentes', () => {
      const outra = new D5NotesSchedulesRepository(prisma);

      expect((outra as any).baseScheduleSelect).toEqual(baseSelect());
    });
  });
});
