import { Test, TestingModule } from '@nestjs/testing';
import { FinalizationData } from 'src/domain/repositories/worksService/IWorkServicesExecutionRepository';
import { ServiceExecutionStatus } from 'src/domain/services/pointByPointRules.service';
import { Prisma } from 'src/infra/generated/prisma/client';
import { WorkServicesExeutionRepository } from 'src/infra/repositories/worksServices/workServicesExecutionRepository';

// ─── Helpers ─────────────────────────────────────────────────────────
const buildTx = () => ({
  programacoes: {
    update: jest.fn(),
  },
  programacoes_servicos: {
    findMany: jest.fn(),
    updateMany: jest.fn(),
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

  it('should no longer expose removed methods', () => {
    const repo = repository as unknown as Record<string, unknown>;

    expect(repo.findScheduleWork).toBeUndefined();
    expect(repo.deleteScheduleItemsByIds).toBeUndefined();
    expect(repo.zeroScheduleProgress).toBeUndefined();
    expect(repo.resetScheduleExecution).toBeUndefined();
    expect(repo.updateItemsReal).toBeUndefined();
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

  // ─── Reagendamento / finalização ───────────────────────────────────
  describe('findScheduleItems', () => {
    it('should return the schedule items with prog, real and status', async () => {
      const rows = [
        { id: 1, id_servico: 2, prog: 10, real: 5, status: 'EXECUTADO' },
        { id: 2, id_servico: 4, prog: 20, real: null, status: null },
        { id: 3, id_servico: 5, prog: 8, real: null, status: 'REPROGRAMADO' },
        { id: 4, id_servico: 6, prog: 4, real: 0, status: 'NAO_EXECUTADO' },
      ];
      tx.programacoes_servicos.findMany.mockResolvedValueOnce(rows);

      const result = await repository.findScheduleItems(3, asTx(tx));

      expect(tx.programacoes_servicos.findMany).toHaveBeenCalledWith({
        where: { id_programacao: 3 },
        select: {
          id: true,
          id_servico: true,
          prog: true,
          real: true,
          status: true,
        },
      });
      expect(result).toEqual(rows);
    });

    it('should not filter rows by status (the domain decides)', async () => {
      tx.programacoes_servicos.findMany.mockResolvedValueOnce([]);

      await repository.findScheduleItems(3, asTx(tx));

      const { where } = tx.programacoes_servicos.findMany.mock.calls[0][0];
      expect(where).toEqual({ id_programacao: 3 });
    });

    it('should return an empty array when the schedule has no items', async () => {
      tx.programacoes_servicos.findMany.mockResolvedValueOnce([]);

      const result = await repository.findScheduleItems(3, asTx(tx));

      expect(result).toEqual([]);
    });
  });

  describe('markScheduleItemsAsRescheduled', () => {
    it('should mark rows without report and partial EXECUTADO rows as REPROGRAMADO', async () => {
      tx.programacoes_servicos.updateMany.mockResolvedValueOnce({ count: 3 });

      const result = await repository.markScheduleItemsAsRescheduled(
        [1, 2, 3],
        asTx(tx),
      );

      expect(tx.programacoes_servicos.updateMany).toHaveBeenCalledWith({
        where: {
          id: { in: [1, 2, 3] },
          OR: [
            { status: null, real: null }, // sem apontamento
            { status: ServiceExecutionStatus.EXECUTADO }, // parcial
          ],
        },
        data: { status: ServiceExecutionStatus.REPROGRAMADO },
      });
      expect(result).toBe(3);
    });

    it('should never target discarded (NAO_EXECUTADO) or already REPROGRAMADO rows', async () => {
      tx.programacoes_servicos.updateMany.mockResolvedValueOnce({ count: 0 });

      await repository.markScheduleItemsAsRescheduled([1], asTx(tx));

      const { where } = tx.programacoes_servicos.updateMany.mock.calls[0][0];
      const targetedStatuses = where.OR.map(
        (condition: { status: unknown }) => condition.status,
      );

      expect(targetedStatuses).not.toContain(
        ServiceExecutionStatus.NAO_EXECUTADO,
      );
      expect(targetedStatuses).not.toContain(
        ServiceExecutionStatus.REPROGRAMADO,
      );
    });

    it('should return the real number of updated rows (may be lower than ids)', async () => {
      tx.programacoes_servicos.updateMany.mockResolvedValueOnce({ count: 1 });

      const result = await repository.markScheduleItemsAsRescheduled(
        [1, 2],
        asTx(tx),
      );

      expect(result).toBe(1);
    });

    it('should return 0 without calling prisma when no ids are given', async () => {
      const result = await repository.markScheduleItemsAsRescheduled(
        [],
        asTx(tx),
      );

      expect(result).toBe(0);
      expect(tx.programacoes_servicos.updateMany).not.toHaveBeenCalled();
    });

    it('should never delete rows nor change prog/real', async () => {
      tx.programacoes_servicos.updateMany.mockResolvedValueOnce({ count: 1 });

      await repository.markScheduleItemsAsRescheduled([1], asTx(tx));

      const { data } = tx.programacoes_servicos.updateMany.mock.calls[0][0];
      expect(Object.keys(data)).toEqual(['status']);
    });

    it('should propagate prisma errors', async () => {
      tx.programacoes_servicos.updateMany.mockRejectedValueOnce(
        new Error('db down'),
      );

      await expect(
        repository.markScheduleItemsAsRescheduled([1], asTx(tx)),
      ).rejects.toThrow('db down');
    });
  });

  // ─── Execução ──────────────────────────────────────────────────────
  describe('findExecutionTargets', () => {
    it('should find rows by service and schedule including schedule status', async () => {
      const rows = [
        { id: 11, status: null, programacoes: { id_status_programacao: 3 } },
      ];
      tx.programacoes_servicos.findMany.mockResolvedValueOnce(rows);

      const result = await repository.findExecutionTargets(2, 3, asTx(tx));

      expect(tx.programacoes_servicos.findMany).toHaveBeenCalledWith({
        where: { id_servico: 2, id_programacao: 3 },
        select: {
          id: true,
          status: true,
          programacoes: { select: { id_status_programacao: true } },
        },
      });
      expect(result).toEqual(rows);
    });

    it('should not filter by status, so REPROGRAMADO rows can still be corrected', async () => {
      const rows = [
        {
          id: 12,
          status: ServiceExecutionStatus.REPROGRAMADO,
          programacoes: { id_status_programacao: 3 },
        },
      ];
      tx.programacoes_servicos.findMany.mockResolvedValueOnce(rows);

      const result = await repository.findExecutionTargets(2, 3, asTx(tx));

      const { where } = tx.programacoes_servicos.findMany.mock.calls[0][0];
      expect(where).not.toHaveProperty('status');
      expect(where).not.toHaveProperty('OR');
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

  describe('updateItemsExecution', () => {
    it('should write real and the derived status for each item', async () => {
      tx.programacoes_servicos.update.mockResolvedValue({});
      const items = [
        { rowId: 1, real: 10 },
        { rowId: 2, real: 0 },
        { rowId: 3, real: 7.5 },
        { rowId: 4, real: null },
      ];

      const result = await repository.updateItemsExecution(items, asTx(tx));

      expect(tx.programacoes_servicos.update).toHaveBeenCalledTimes(4);
      expect(tx.programacoes_servicos.update).toHaveBeenNthCalledWith(1, {
        where: { id: 1 },
        data: { real: 10, status: ServiceExecutionStatus.EXECUTADO },
      });
      expect(tx.programacoes_servicos.update).toHaveBeenNthCalledWith(2, {
        where: { id: 2 },
        data: { real: 0, status: ServiceExecutionStatus.NAO_EXECUTADO },
      });
      expect(tx.programacoes_servicos.update).toHaveBeenNthCalledWith(3, {
        where: { id: 3 },
        data: { real: 7.5, status: ServiceExecutionStatus.EXECUTADO },
      });
      expect(tx.programacoes_servicos.update).toHaveBeenNthCalledWith(4, {
        where: { id: 4 },
        data: { real: null, status: ServiceExecutionStatus.REPROGRAMADO },
      });
      expect(result).toBeUndefined();
    });

    it('should mark real = null as REPROGRAMADO, never as NAO_EXECUTADO', async () => {
      tx.programacoes_servicos.update.mockResolvedValue({});

      await repository.updateItemsExecution(
        [{ rowId: 1, real: null }],
        asTx(tx),
      );

      const { data } = tx.programacoes_servicos.update.mock.calls[0][0];
      expect(data.status).toBe(ServiceExecutionStatus.REPROGRAMADO);
      expect(data.status).not.toBe(ServiceExecutionStatus.NAO_EXECUTADO);
    });

    it('should only write real and status (never prog)', async () => {
      tx.programacoes_servicos.update.mockResolvedValue({});

      await repository.updateItemsExecution([{ rowId: 1, real: 5 }], asTx(tx));

      const { data } = tx.programacoes_servicos.update.mock.calls[0][0];
      expect(Object.keys(data).sort()).toEqual(['real', 'status']);
    });

    it('should not call prisma when items list is empty', async () => {
      await repository.updateItemsExecution([], asTx(tx));

      expect(tx.programacoes_servicos.update).not.toHaveBeenCalled();
    });

    it('should reject if any update fails', async () => {
      tx.programacoes_servicos.update
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('update failed'))
        .mockResolvedValueOnce({});

      await expect(
        repository.updateItemsExecution(
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
