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

/** Sem valor por omissão: permite testar 0 explicitamente. */
const makeAggregate = (count: number) => ({ _count: { _all: count } });

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
    findMany: jest.fn(),
    findUnique: jest.fn(),
    aggregate: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  };

  const prisma = {
    programacoes_d5: programacoesD5,
  } as unknown as PrismaService;

  /** Acesso à projeção partilhada, para validar o contrato. */
  const baseSelect = () => (repository as any).baseScheduleSelect;

  beforeEach(() => {
    repository = new D5NotesSchedulesRepository(prisma);

    programacoesD5.findMany.mockResolvedValue([]);
    programacoesD5.findUnique.mockResolvedValue(null);
    programacoesD5.aggregate.mockResolvedValue(makeAggregate(0));
    programacoesD5.create.mockResolvedValue(undefined);
    programacoesD5.update.mockResolvedValue(undefined);
    programacoesD5.delete.mockResolvedValue(undefined);
  });

  afterEach(() => jest.resetAllMocks());

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
        'tme_executado',
        'tme_abertura',
        'validacao_anual',
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
    it('deve devolver a contagem sob a chave total', async () => {
      programacoesD5.aggregate.mockResolvedValue(makeAggregate(12));

      expect(await repository.getTotals({})).toEqual({ total: 12 });
    });

    it('deve devolver zero quando não há registos', async () => {
      programacoesD5.aggregate.mockResolvedValue(makeAggregate(0));

      expect(await repository.getTotals({})).toEqual({ total: 0 });
    });

    it('deve repassar a cláusula where', async () => {
      const where = { id_municipio: { in: [1] } };

      await repository.getTotals(where);

      expect(programacoesD5.aggregate.mock.calls[0][0].where).toBe(where);
    });

    it('deve pedir apenas a contagem total', async () => {
      await repository.getTotals({});

      expect(programacoesD5.aggregate).toHaveBeenCalledWith({
        where: {},
        _count: { _all: true },
      });
    });

    it('não deve agregar somas nem projetar colunas', async () => {
      await repository.getTotals({});

      const callArgs = programacoesD5.aggregate.mock.calls[0][0];
      expect(callArgs).not.toHaveProperty('_sum');
      expect(callArgs).not.toHaveProperty('select');
    });

    it('deve devolver exatamente uma chave', async () => {
      programacoesD5.aggregate.mockResolvedValue(makeAggregate(5));

      expect(Object.keys(await repository.getTotals({}))).toEqual(['total']);
    });

    it('deve propagar erros do Prisma', async () => {
      programacoesD5.aggregate.mockRejectedValue(new Error('falha'));

      await expect(repository.getTotals({})).rejects.toThrow('falha');
    });
  });

  // =========================================================================
  // create
  // =========================================================================
  describe('create', () => {
    it('deve criar a programação com os dados recebidos', async () => {
      const data = makeCreateData();

      await repository.create(data as any);

      expect(programacoesD5.create).toHaveBeenCalledWith({ data });
    });

    it('não deve modificar o objeto recebido', async () => {
      const data = makeCreateData();
      const snapshot = { ...data };

      await repository.create(data as any);

      expect(data).toEqual(snapshot);
    });

    it('não deve projetar colunas no retorno (void)', async () => {
      await repository.create(makeCreateData() as any);

      expect(programacoesD5.create.mock.calls[0][0]).not.toHaveProperty(
        'select',
      );
    });

    it('deve descartar o retorno do Prisma', async () => {
      programacoesD5.create.mockResolvedValue({ id: 99 });

      expect(await repository.create(makeCreateData() as any)).toBeUndefined();
    });

    it('deve propagar violações de chave estrangeira', async () => {
      const error = Object.assign(new Error('FK'), { code: 'P2003' });
      programacoesD5.create.mockRejectedValue(error);

      await expect(repository.create(makeCreateData() as any)).rejects.toBe(
        error,
      );
    });
  });

  // =========================================================================
  // update
  // =========================================================================
  describe('update', () => {
    it('deve atualizar a programação indicada', async () => {
      const data = makeUpdateData();

      await repository.update(5, data as any);

      expect(programacoesD5.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data,
      });
    });

    it('não deve modificar o objeto recebido', async () => {
      const data = makeUpdateData();
      const snapshot = { ...data };

      await repository.update(5, data as any);

      expect(data).toEqual(snapshot);
    });

    it('deve resolver sem valor de retorno', async () => {
      await expect(
        repository.update(5, makeUpdateData() as any),
      ).resolves.toBeUndefined();
    });

    it('deve aceitar um objeto de alterações vazio', async () => {
      await repository.update(5, {} as any);

      expect(programacoesD5.update).toHaveBeenCalledWith({
        where: { id: 5 },
        data: {},
      });
    });

    it('deve propagar P2025 quando o registo não existe', async () => {
      const error = Object.assign(new Error('não encontrado'), {
        code: 'P2025',
      });
      programacoesD5.update.mockRejectedValue(error);

      await expect(
        repository.update(999, makeUpdateData() as any),
      ).rejects.toMatchObject({ code: 'P2025' });
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
      'update',
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
