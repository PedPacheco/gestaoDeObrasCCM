import { Test, TestingModule } from '@nestjs/testing';
import { FinalizationData } from 'src/domain/repositories/worksService/IWorkServicesExecutionRepository';
import { Prisma } from 'src/generated/prisma/client';
import { WorkServicesExeutionRepository } from 'src/infra/repositories/worksServices/workServicesExecutionRepository';

// ─── Helpers ─────────────────────────────────────────────────────────
const buildTx = () => ({
  programacoes: {
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  programacoes_servicos: {
    findMany: jest.fn(),
    deleteMany: jest.fn(),
    update: jest.fn(),
  },
});

type TxMock = ReturnType<typeof buildTx>;

const asTx = (tx: TxMock) => tx as unknown as Prisma.TransactionClient;

const prismaError = (code: string) =>
  Object.assign(new Error(`Prisma error ${code}`), { code });

describe('WorkServicesExeutionRepository', () => {
  let repository: WorkServicesExeutionRepository;
  let tx: TxMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkServicesExeutionRepository],
    }).compile();

    repository = module.get(WorkServicesExeutionRepository);
    tx = buildTx(); // tx novo em cada teste → sem estado partilhado
  });

  afterEach(jest.clearAllMocks);

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  // ─── Finalização ───────────────────────────────────────────────────
  describe('finalizeServices', () => {
    const data: FinalizationData = {
      id: 3,
      idWork: 2,
      dataProg: new Date('2026-10-13'),
      prog: 100,
      exec: 80,
      idExecutionRestriction: 7,
      responsibility: 'João Silva',
      executionObservation: 'Executado parcialmente',
      userId: 15,
    };

    it('should update the schedule mapping execution fields and return true', async () => {
      tx.programacoes.update.mockResolvedValueOnce({ id: 3 });

      const result = await repository.finalizeServices(data, asTx(tx));

      expect(result).toBe(true);
      expect(tx.programacoes.update).toHaveBeenCalledTimes(1);
      expect(tx.programacoes.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: {
          prog: 100,
          exec: 80,
          id_restricao_execucao: 7,
          nome_responsavel_execucao: 'João Silva',
          observacao_execucao: 'Executado parcialmente',
          id_usuario_ultima_atualizacao: 15,
        },
      });
    });

    it('should NOT write nome_responsavel (belongs to the schedule restriction)', async () => {
      tx.programacoes.update.mockResolvedValueOnce({ id: 3 });

      await repository.finalizeServices(data, asTx(tx));

      const { data: written } = tx.programacoes.update.mock.calls[0][0];
      expect(written).not.toHaveProperty('nome_responsavel');
      expect(written).not.toHaveProperty('observacao');
    });

    it('should pass null/undefined optional values through unchanged', async () => {
      tx.programacoes.update.mockResolvedValueOnce({ id: 3 });
      const partial = {
        ...data,
        idExecutionRestriction: null,
        responsibility: null,
        executionObservation: undefined,
      } as unknown as FinalizationData;

      await repository.finalizeServices(partial, asTx(tx));

      expect(tx.programacoes.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: expect.objectContaining({
          id_restricao_execucao: null,
          nome_responsavel_execucao: null,
          observacao_execucao: undefined,
        }),
      });
    });

    it('should return false when the schedule does not exist (P2025)', async () => {
      tx.programacoes.update.mockRejectedValueOnce(prismaError('P2025'));

      const result = await repository.finalizeServices(data, asTx(tx));

      expect(result).toBe(false);
    });

    it('should rethrow other Prisma errors', async () => {
      const error = prismaError('P2003');
      tx.programacoes.update.mockRejectedValueOnce(error);

      await expect(repository.finalizeServices(data, asTx(tx))).rejects.toBe(
        error,
      );
    });

    it('should rethrow errors without code', async () => {
      tx.programacoes.update.mockRejectedValueOnce(
        new Error('connection lost'),
      );

      await expect(repository.finalizeServices(data, asTx(tx))).rejects.toThrow(
        'connection lost',
      );
    });
  });

  // ─── Reagendamento ─────────────────────────────────────────────────
  describe('findScheduleWork', () => {
    it('should return the work id of the schedule', async () => {
      tx.programacoes.findUnique.mockResolvedValueOnce({ id_obra: 10 });

      const result = await repository.findScheduleWork(3, asTx(tx));

      expect(tx.programacoes.findUnique).toHaveBeenCalledWith({
        where: { id: 3 },
        select: { id_obra: true },
      });
      expect(result).toEqual({ id_obra: 10 });
    });

    it('should return null when the schedule does not exist', async () => {
      tx.programacoes.findUnique.mockResolvedValueOnce(null);

      const result = await repository.findScheduleWork(999, asTx(tx));

      expect(result).toBeNull();
    });
  });

  describe('findScheduleItems', () => {
    it('should return the schedule items with prog and real', async () => {
      const rows = [
        { id: 1, id_servico: 2, prog: 10, real: 5 },
        { id: 2, id_servico: 4, prog: 20, real: null },
      ];
      tx.programacoes_servicos.findMany.mockResolvedValueOnce(rows);

      const result = await repository.findScheduleItems(3, asTx(tx));

      expect(tx.programacoes_servicos.findMany).toHaveBeenCalledWith({
        where: { id_programacao: 3 },
        select: { id: true, id_servico: true, prog: true, real: true },
      });
      expect(result).toEqual(rows);
    });

    it('should return an empty array when the schedule has no items', async () => {
      tx.programacoes_servicos.findMany.mockResolvedValueOnce([]);

      const result = await repository.findScheduleItems(3, asTx(tx));

      expect(result).toEqual([]);
    });
  });

  describe('deleteScheduleItemsByIds', () => {
    it('should delete the items with the given ids', async () => {
      tx.programacoes_servicos.deleteMany.mockResolvedValueOnce({ count: 3 });

      const result = await repository.deleteScheduleItemsByIds(
        [1, 2, 3],
        asTx(tx),
      );

      expect(tx.programacoes_servicos.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2, 3] } },
      });
      expect(result).toBeUndefined(); // não expõe o { count }
    });

    it('should call deleteMany with an empty list when no ids are given', async () => {
      tx.programacoes_servicos.deleteMany.mockResolvedValueOnce({ count: 0 });

      await repository.deleteScheduleItemsByIds([], asTx(tx));

      expect(tx.programacoes_servicos.deleteMany).toHaveBeenCalledWith({
        where: { id: { in: [] } },
      });
    });

    it('should propagate prisma errors', async () => {
      tx.programacoes_servicos.deleteMany.mockRejectedValueOnce(
        new Error('FK violation'),
      );

      await expect(
        repository.deleteScheduleItemsByIds([1], asTx(tx)),
      ).rejects.toThrow('FK violation');
    });
  });

  describe('zeroScheduleProgress', () => {
    it('should set prog and exec to zero', async () => {
      tx.programacoes.update.mockResolvedValueOnce({ id: 3 });

      const result = await repository.zeroScheduleProgress(3, asTx(tx));

      expect(tx.programacoes.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { prog: 0, exec: 0 },
      });
      expect(result).toBeUndefined();
    });

    it('should propagate errors (including P2025, not handled here)', async () => {
      const error = prismaError('P2025');
      tx.programacoes.update.mockRejectedValueOnce(error);

      await expect(repository.zeroScheduleProgress(3, asTx(tx))).rejects.toBe(
        error,
      );
    });
  });

  // ─── Execução ──────────────────────────────────────────────────────
  describe('findExecutionTargets', () => {
    it('should find rows by service and schedule including schedule status', async () => {
      const rows = [{ id: 11, programacoes: { id_status_programacao: 3 } }];
      tx.programacoes_servicos.findMany.mockResolvedValueOnce(rows);

      const result = await repository.findExecutionTargets(2, 3, asTx(tx));

      expect(tx.programacoes_servicos.findMany).toHaveBeenCalledWith({
        where: { id_servico: 2, id_programacao: 3 },
        select: {
          id: true,
          programacoes: { select: { id_status_programacao: true } },
        },
      });
      expect(result).toEqual(rows);
    });

    it('should not swap serviceId and scheduleId', async () => {
      tx.programacoes_servicos.findMany.mockResolvedValueOnce([]);

      await repository.findExecutionTargets(100, 200, asTx(tx));

      const { where } = tx.programacoes_servicos.findMany.mock.calls[0][0];
      expect(where).toEqual({ id_servico: 100, id_programacao: 200 });
    });

    it('should return an empty array when there are no targets', async () => {
      tx.programacoes_servicos.findMany.mockResolvedValueOnce([]);

      const result = await repository.findExecutionTargets(2, 3, asTx(tx));

      expect(result).toEqual([]);
    });
  });

  describe('updateItemsReal', () => {
    it('should update real for each item', async () => {
      tx.programacoes_servicos.update.mockResolvedValue({});
      const items = [
        { rowId: 1, real: 10 },
        { rowId: 2, real: 0 },
        { rowId: 3, real: 7.5 },
      ];

      const result = await repository.updateItemsReal(items, asTx(tx));

      expect(tx.programacoes_servicos.update).toHaveBeenCalledTimes(3);
      expect(tx.programacoes_servicos.update).toHaveBeenNthCalledWith(1, {
        where: { id: 1 },
        data: { real: 10 },
      });
      expect(tx.programacoes_servicos.update).toHaveBeenNthCalledWith(2, {
        where: { id: 2 },
        data: { real: 0 },
      });
      expect(tx.programacoes_servicos.update).toHaveBeenNthCalledWith(3, {
        where: { id: 3 },
        data: { real: 7.5 },
      });
      expect(result).toBeUndefined();
    });

    it('should not call prisma when items list is empty', async () => {
      await repository.updateItemsReal([], asTx(tx));

      expect(tx.programacoes_servicos.update).not.toHaveBeenCalled();
    });

    it('should reject if any update fails', async () => {
      tx.programacoes_servicos.update
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('update failed'))
        .mockResolvedValueOnce({});

      await expect(
        repository.updateItemsReal(
          [
            { rowId: 1, real: 1 },
            { rowId: 2, real: 2 },
            { rowId: 3, real: 3 },
          ],
          asTx(tx),
        ),
      ).rejects.toThrow('update failed');

      // Promise.all dispara todas as chamadas antes de rejeitar
      expect(tx.programacoes_servicos.update).toHaveBeenCalledTimes(3);
    });
  });
});
