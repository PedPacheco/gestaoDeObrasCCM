import { MarketWork } from 'src/domain/entities/works.entity';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { AuxiliaryBaseRepository } from 'src/infra/repositories/auxiliaryBaseRepository';

/** Junta as partes de um tagged template ($queryRaw`...`) num único texto. */
const sqlOf = (call: unknown[]): string =>
  (call[0] as TemplateStringsArray).join('?');

/** Valores interpolados num tagged template. */
const valuesOf = (call: unknown[]): unknown[] => call.slice(1);

describe('AuxiliaryBaseRepository', () => {
  let repository: AuxiliaryBaseRepository;

  const mockPrisma = {
    $queryRaw: vi.fn(),
    base_auxiliar: { findMany: vi.fn() },
    base_auxiliar_ov: { findMany: vi.fn() },
  };

  const mockLogger = { warn: vi.fn(), error: vi.fn(), log: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();

    repository = new AuxiliaryBaseRepository(
      mockPrisma as unknown as PrismaService,
    );
    (repository as any).logger = mockLogger;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ============================================================
  // getAuxiliaryBaseNotes
  // ============================================================

  describe('getAuxiliaryBaseNotes', () => {
    it('filtra pela regional quando informada', async () => {
      mockPrisma.base_auxiliar.findMany.mockResolvedValue([]);

      await repository.getAuxiliaryBaseNotes(3);

      expect(mockPrisma.base_auxiliar.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { municipios: { id_regional: 3 } },
        }),
      );
    });

    it.each([undefined, 0])(
      'não filtra pela regional quando recebe %p',
      async (idRegional) => {
        mockPrisma.base_auxiliar.findMany.mockResolvedValue([]);

        await repository.getAuxiliaryBaseNotes(idRegional);

        expect(mockPrisma.base_auxiliar.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { municipios: { id_regional: undefined } },
          }),
        );
      },
    );

    it('seleciona os campos de CAPEX e devolve o resultado do Prisma', async () => {
      const rows = [{ id: 1, obra: 'OB1', capex_mo_plan: 10 }];
      mockPrisma.base_auxiliar.findMany.mockResolvedValue(rows);

      const result = await repository.getAuxiliaryBaseNotes();

      const { select } = mockPrisma.base_auxiliar.findMany.mock.calls[0][0];
      expect(select).toMatchObject({
        id: true,
        obra: true,
        capex_mo_plan: true,
        capex_mat_plan: true,
      });
      expect(result).toBe(rows);
    });
  });

  // ============================================================
  // getAuxiliaryBaseMarket
  // ============================================================

  describe('getAuxiliaryBaseMarket', () => {
    const row = {
      id: BigInt(7),
      obra: 'OB1',
      pep: 'PEP1',
      diagrama: '170000000001',
      prazo_texto: '30 dias',
      entrada: new Date('2026-01-10'),
      status_ov: 'ABERTA',
      status_diagrama: 'LIB',
      status_pep: 'LIB',
      mo_cliente: 100,
      mo_empresa: 200,
      aux_circuito: 4,
      aux_municipio: 5,
      aux_turma: 6,
      aux_tipo_obra: 8,
      equip_num_pedido: 'EQ1',
      observacao: 'obs',
    };

    it('filtra pela regional quando informada', async () => {
      mockPrisma.base_auxiliar_ov.findMany.mockResolvedValue([]);

      await repository.getAuxiliaryBaseMarket(2);

      expect(mockPrisma.base_auxiliar_ov.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { municipios: { id_regional: 2 } },
        }),
      );
    });

    it('mapeia as colunas do banco para MarketWork', async () => {
      const createSpy = vi.spyOn(MarketWork, 'create');
      mockPrisma.base_auxiliar_ov.findMany.mockResolvedValue([row]);

      const result = await repository.getAuxiliaryBaseMarket();

      expect(createSpy).toHaveBeenCalledWith({
        obra: 'OB1',
        pep: 'PEP1',
        entrada: row.entrada,
        prazoTexto: '30 dias',
        equipeNumPedido: 'EQ1',
        idMunicipio: 5,
        idTipo: 8,
        idParceira: 6,
        idCircuito: 4,
        diagrama: '170000000001',
        observacao: 'obs',
        statusOv: 'ABERTA',
        statusDiagrama: 'LIB',
        statusPep: 'LIB',
        moCliente: 100,
        moEmpresa: 200,
        id: 7, // BigInt convertido para number
      });
      expect(result).toHaveLength(1);
      expect(result[0]).toBeInstanceOf(MarketWork);
    });

    it('devolve lista vazia quando não há registos', async () => {
      mockPrisma.base_auxiliar_ov.findMany.mockResolvedValue([]);

      await expect(repository.getAuxiliaryBaseMarket()).resolves.toEqual([]);
    });
  });

  // ============================================================
  // getAuxiliaryBaseCN52N
  // ============================================================

  describe('getAuxiliaryBaseCN52N', () => {
    it('devolve as linhas da consulta', async () => {
      const rows = [{ id_obra: 10, material: '71000460', preco: 3.2 }];
      mockPrisma.$queryRaw.mockResolvedValue(rows);

      await expect(repository.getAuxiliaryBaseCN52N()).resolves.toBe(rows);
    });

    it('junta cn52n com obras pelo id_obra', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await repository.getAuxiliaryBaseCN52N();

      const sql = sqlOf(mockPrisma.$queryRaw.mock.calls[0]);
      expect(sql).toMatch(/from\s+cn52n/i);
      expect(sql).toMatch(
        /inner join\s+obras\s+on\s+obras\.id\s*=\s*cn52n\.id_obra/i,
      );
    });

    it('seleciona todas as colunas usadas no cálculo', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await repository.getAuxiliaryBaseCN52N();

      const sql = sqlOf(mockPrisma.$queryRaw.mock.calls[0]);
      for (const column of [
        'id_obra',
        'diagrama_rede',
        'elemento_pep',
        'def_proj',
        'material',
        'cti',
        'preco',
        'qtd_necessaria',
        'qtd_retirada',
        'qtd_recebida',
        'qtd_falta',
        'reserva',
      ]) {
        expect(sql).toContain(`cn52n.${column}`);
      }
    });
  });

  // ============================================================
  // getFator
  // ============================================================

  describe('getFator', () => {
    it('não consulta o banco quando a lista é vazia', async () => {
      const result = await repository.getFator([]);

      expect(result).toEqual(new Map());
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('ignora pares com material ou pep_ref nulos', async () => {
      const result = await repository.getFator([
        { material: null as any, pep_ref: 'B/000215' },
        { material: '71000460', pep_ref: null as any },
      ]);

      expect(result).toEqual(new Map());
      expect(mockPrisma.$queryRaw).not.toHaveBeenCalled();
    });

    it('envia pares únicos, alinhados por posição, para o unnest', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([]);

      await repository.getFator([
        { material: '71000460', pep_ref: 'B/000215' },
        { material: '71000460', pep_ref: 'B/000215' }, // duplicado
        { material: '71000487', pep_ref: 'B/000300' },
        { material: '71000460', pep_ref: 'B/000300' }, // mesmo material, outro PEP
      ]);

      const call = mockPrisma.$queryRaw.mock.calls[0];
      const [materials, pepRefs] = valuesOf(call);

      expect(materials).toEqual(['71000460', '71000487', '71000460']);
      expect(pepRefs).toEqual(['B/000215', 'B/000300', 'B/000300']);
      expect(sqlOf(call)).toMatch(/unnest/i);
    });

    it('devolve o fator por chave "material|pep_ref"', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { material: '71000460', pep_ref: 'B/000215', fator: 2 },
        { material: '71000487', pep_ref: 'B/000300', fator: 0.5 },
      ]);

      const result = await repository.getFator([
        { material: '71000460', pep_ref: 'B/000215' },
        { material: '71000487', pep_ref: 'B/000300' },
      ]);

      expect(result).toEqual(
        new Map([
          ['71000460|B/000215', 2],
          ['71000487|B/000300', 0.5],
        ]),
      );
    });

    it('converte fatores Decimal/string para number', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { material: 'M1', pep_ref: 'P1', fator: '1.25' },
        { material: 'M2', pep_ref: 'P2', fator: { valueOf: () => 3 } }, // simula Prisma.Decimal
      ]);

      const result = await repository.getFator([
        { material: 'M1', pep_ref: 'P1' },
        { material: 'M2', pep_ref: 'P2' },
      ]);

      expect(result.get('M1|P1')).toBe(1.25);
      expect(result.get('M2|P2')).toBe(3);
    });

    it('ignora fatores nulos', async () => {
      mockPrisma.$queryRaw.mockResolvedValue([
        { material: 'M1', pep_ref: 'P1', fator: null },
      ]);

      const result = await repository.getFator([
        { material: 'M1', pep_ref: 'P1' },
      ]);

      expect(result.has('M1|P1')).toBe(false);
    });
  });

  // ============================================================
  // withRetry (private) — usado pelos métodos de escrita
  // ============================================================

  describe('withRetry', () => {
    const withRetry = <T>(operation: () => Promise<T>): Promise<T> =>
      (repository as any).withRetry(operation);

    const prismaError = (code: string, message = 'erro') =>
      Object.assign(new Error(message), { code });

    beforeEach(() => {
      vi.useFakeTimers();
    });

    it('devolve o resultado sem novas tentativas quando a operação passa', async () => {
      const operation = vi.fn().mockResolvedValue('ok');

      await expect(withRetry(operation)).resolves.toBe('ok');
      expect(operation).toHaveBeenCalledTimes(1);
    });

    it.each(['P1001', 'P1002', 'P1008', 'P1017'])(
      'volta a tentar no código de conexão %s',
      async (code) => {
        const operation = vi
          .fn()
          .mockRejectedValueOnce(prismaError(code))
          .mockResolvedValue('ok');

        const promise = withRetry(operation);
        await vi.advanceTimersByTimeAsync(300);

        await expect(promise).resolves.toBe('ok');
        expect(operation).toHaveBeenCalledTimes(2);
      },
    );

    it.each([
      'Server has closed the connection',
      'connect ECONNRESET',
      'socket hang up',
      'Connection refused',
      'Connection timed out',
    ])('volta a tentar quando a mensagem contém "%s"', async (message) => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(new Error(message))
        .mockResolvedValue('ok');

      const promise = withRetry(operation);
      await vi.advanceTimersByTimeAsync(300);

      await expect(promise).resolves.toBe('ok');
    });

    it('usa backoff exponencial (300 ms, depois 600 ms)', async () => {
      const operation = vi
        .fn()
        .mockRejectedValueOnce(prismaError('P1001'))
        .mockRejectedValueOnce(prismaError('P1001'))
        .mockResolvedValue('ok');

      const promise = withRetry(operation);

      await vi.advanceTimersByTimeAsync(299);
      expect(operation).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(1);
      expect(operation).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(599);
      expect(operation).toHaveBeenCalledTimes(2);

      await vi.advanceTimersByTimeAsync(1);
      await expect(promise).resolves.toBe('ok');
      expect(operation).toHaveBeenCalledTimes(3);
      expect(mockLogger.warn).toHaveBeenCalledTimes(2);
    });

    it('desiste após 3 tentativas e relança o último erro', async () => {
      const error = prismaError('P1001', 'Server has closed the connection');
      const operation = vi.fn().mockRejectedValue(error);

      const assertion = expect(withRetry(operation)).rejects.toBe(error);
      await vi.runAllTimersAsync();
      await assertion;

      expect(operation).toHaveBeenCalledTimes(3);
    });

    it('não volta a tentar erros que não são de conexão (ex.: FK P2003)', async () => {
      const error = prismaError('P2003', 'Foreign key constraint violated');
      const operation = vi.fn().mockRejectedValue(error);

      await expect(withRetry(operation)).rejects.toBe(error);

      expect(operation).toHaveBeenCalledTimes(1);
      expect(mockLogger.warn).not.toHaveBeenCalled();
    });
  });
});
