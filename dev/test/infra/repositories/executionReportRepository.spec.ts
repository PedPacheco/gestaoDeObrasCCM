import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ExecutionReportRepository } from 'src/infra/repositories/executionReportRepository';

import { Test, TestingModule } from '@nestjs/testing';

import { Prisma } from 'src/generated/prisma/client';
import {
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';
import {
  mockExecutionReportPersistenceObject,
  mockExecutionReportRepository,
} from '../../../test/mocks/mocksExecutionReport';

describe('ExecutionReportRepository', () => {
  let repository: ExecutionReportRepository;

  const mockPrisma = {
    $transaction: vi.fn(),
    relatorio_execucao: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    programacoes: {
      update: vi.fn(),
    },
  };

  const mockTransaction = {
    relatorio_execucao: {
      create: vi.fn(),
      findFirst: vi.fn(),
      delete: vi.fn(), // deleteReport
    },
    programacoes: {
      findUnique: vi.fn(), // findScheduleWorkMode
      update: vi.fn(), // resetScheduleExecution
      aggregate: vi.fn(), // sumWorkSchedulesExec
    },
    programacoes_servicos: {
      findMany: vi.fn(), // findScheduledServiceIds
      updateMany: vi.fn(), // resetScheduleExecution
    },
    servicos: {
      updateMany: vi.fn(), // clearServicesReal
    },
    obras: {
      update: vi.fn(), // updateWorkStatusAfterReset
    },
  } as any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionReportRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<ExecutionReportRepository>(
      ExecutionReportRepository,
    );
  });

  afterEach(vi.clearAllMocks);

  describe('create', () => {
    it('call method create and create a new register in table', async () => {
      await repository.create(mockExecutionReportRepository, mockTransaction);

      expect(mockTransaction.relatorio_execucao.create).toHaveBeenCalledWith({
        data: mockExecutionReportRepository,
      });
    });
  });

  describe('findByScheduleId', () => {
    it('should return the report found by schedule id', async () => {
      const expected = { id: 123, id_programacao: 1 };
      mockTransaction.relatorio_execucao.findFirst.mockResolvedValue(expected);

      const result = await repository.findByScheduleId(1, mockTransaction);

      expect(mockTransaction.relatorio_execucao.findFirst).toHaveBeenCalledWith(
        {
          where: { id_programacao: 1 },
        },
      );

      expect(result).toEqual(expected);
    });
  });

  describe('findByWorkId', () => {
    it('should return the report found by work id', async () => {
      const expected = { id: 123, ovnota: 1 };
      mockPrisma.relatorio_execucao.findMany.mockResolvedValue(expected);

      const result = await repository.findByWorkId(1);

      expect(mockPrisma.relatorio_execucao.findMany).toHaveBeenCalledWith({
        where: {
          obras: {
            OR: [
              { id: 1 },
              { ovnota: '1' },
              { ordem_dci: '1' },
              { ordem_dcd: '1' },
              { ordem_dca: '1' },
              { ordem_dcim: '1' },
              { diagrama: '1' },
            ],
          },
        },
        select: {
          id: true,
          id_usuario: true,
          criado_em: true,
          supervisor: true,
          liberado_ligacao_parcial: true,
          hora_inicio: true,
          hora_conclusao: true,
          contato_inicio: true,
          contato_termino: true,
          atraso: true,
          justificativa_atraso: true,
          possui_equipamentos_instalados: true,
          equipamentos_aplicados: true,
          potencia_equipamento_aplicado: true,
          patrimonio_equipamento_aplicado: true,
          instalacao_equipamento_aplicado: true,
          possui_equipamentos_retirados: true,
          equipamentos_retirados: true,
          potencia_equipamento_retirado: true,
          patrimonio_equipamento_retirado: true,
          instalacao_equipamento_retirado: true,
          alteracoes_execucao: true,
          observacoes_gerais: true,
          chave_provisoria_instalada: true,
          referencia_chave_provisoria: true,
          chave_provisoria_retirada: true,
          referencia_chave_provisoria_retirada: true,
          motivo: true,
          caminho_arquivo: true,
          usuario: { select: { nome: true } },
          obras: {
            select: {
              ovnota: true,
              ordem_dci: true,
              tipos: { select: { tipo_obra: true } },
              status: { select: { status: true } },
            },
          },
          programacoes: {
            select: {
              data_prog: true,
              prog: true,
              exec: true,
              num_dp: true,
              hora_ini: true,
              hora_ter: true,
              chave_provisoria: true,
            },
          },
        },
      });

      expect(result).toEqual(expected);
    });

    it('should return the report found by order', async () => {
      const expected = { id: 123, ovnota: 1 };
      mockPrisma.relatorio_execucao.findMany.mockResolvedValue(expected);

      const result = await repository.findByWorkId(11111111111);

      expect(mockPrisma.relatorio_execucao.findMany).toHaveBeenCalledWith({
        where: {
          obras: {
            OR: [
              { id: undefined },
              { ovnota: '11111111111' },
              { ordem_dci: '11111111111' },
              { ordem_dcd: '11111111111' },
              { ordem_dca: '11111111111' },
              { ordem_dcim: '11111111111' },
              { diagrama: '11111111111' },
            ],
          },
        },
        select: {
          id: true,
          id_usuario: true,
          criado_em: true,
          supervisor: true,
          liberado_ligacao_parcial: true,
          hora_inicio: true,
          hora_conclusao: true,
          contato_inicio: true,
          contato_termino: true,
          atraso: true,
          justificativa_atraso: true,
          possui_equipamentos_instalados: true,
          equipamentos_aplicados: true,
          potencia_equipamento_aplicado: true,
          patrimonio_equipamento_aplicado: true,
          instalacao_equipamento_aplicado: true,
          possui_equipamentos_retirados: true,
          equipamentos_retirados: true,
          potencia_equipamento_retirado: true,
          patrimonio_equipamento_retirado: true,
          instalacao_equipamento_retirado: true,
          alteracoes_execucao: true,
          observacoes_gerais: true,
          chave_provisoria_instalada: true,
          referencia_chave_provisoria: true,
          chave_provisoria_retirada: true,
          referencia_chave_provisoria_retirada: true,
          motivo: true,
          caminho_arquivo: true,
          usuario: { select: { nome: true } },
          obras: {
            select: {
              ovnota: true,
              ordem_dci: true,
              tipos: { select: { tipo_obra: true } },
              status: { select: { status: true } },
            },
          },
          programacoes: {
            select: {
              data_prog: true,
              prog: true,
              exec: true,
              num_dp: true,
              hora_ini: true,
              hora_ter: true,
              chave_provisoria: true,
            },
          },
        },
      });

      expect(result).toEqual(expected);
    });
  });

  describe('findById', () => {
    it('should find execution report by id and return data', async () => {
      mockPrisma.relatorio_execucao.findFirst.mockResolvedValue({
        id: 1,
        id_obra: 234,
      });

      const result = await repository.findById(1);

      expect(mockPrisma.relatorio_execucao.findFirst).toHaveBeenCalledWith({
        select: { id: true, id_programacao: true, caminho_arquivo: true },
        where: { id: 1 },
      });

      expect(result).toEqual({ id: 1, id_obra: 234 });
    });
  });

  describe('update', () => {
    it('should call prisma update with correct id and data', async () => {
      await repository.update(1, mockExecutionReportPersistenceObject);

      expect(mockPrisma.relatorio_execucao.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: mockExecutionReportPersistenceObject,
      });
    });
  });

  describe('deleteReport', () => {
    const buildTx = () => ({
      relatorio_execucao: {
        delete: vi.fn().mockResolvedValue({ id: 1 }),
      },
    });

    it('should delete the report using the transaction client', async () => {
      const tx = buildTx();

      await repository.deleteReport(
        1,
        tx as unknown as Prisma.TransactionClient,
      );

      expect(tx.relatorio_execucao.delete).toHaveBeenCalledTimes(1);
      expect(tx.relatorio_execucao.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      // o repositório não abre transação própria
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should propagate errors from prisma', async () => {
      const tx = buildTx();
      tx.relatorio_execucao.delete.mockRejectedValueOnce(
        new Error('Record not found'),
      );

      await expect(
        repository.deleteReport(1, tx as unknown as Prisma.TransactionClient),
      ).rejects.toThrow('Record not found');
    });
  });

  // ─── Fluxo de exclusão do relatório ──────────────────────────────────
  describe('findScheduleWorkMode', () => {
    it('should find the schedule with its work id and work mode', async () => {
      const schedule = {
        id_obra: 10,
        obras: { programacao_ponto_a_ponto: true },
      };
      mockTransaction.programacoes.findUnique.mockResolvedValueOnce(schedule);

      const result = await repository.findScheduleWorkMode(3, mockTransaction);

      expect(mockTransaction.programacoes.findUnique).toHaveBeenCalledTimes(1);
      expect(mockTransaction.programacoes.findUnique).toHaveBeenCalledWith({
        where: { id: 3 },
        select: {
          id_obra: true,
          obras: { select: { programacao_ponto_a_ponto: true } },
        },
      });
      expect(result).toEqual(schedule);
    });

    it('should return null when the schedule does not exist', async () => {
      mockTransaction.programacoes.findUnique.mockResolvedValueOnce(null);

      await expect(
        repository.findScheduleWorkMode(999, mockTransaction),
      ).resolves.toBeNull();
    });

    it('should propagate prisma errors', async () => {
      mockTransaction.programacoes.findUnique.mockRejectedValueOnce(
        new Error('db down'),
      );

      await expect(
        repository.findScheduleWorkMode(3, mockTransaction),
      ).rejects.toThrow('db down');
    });
  });

  describe('findScheduledServiceIds', () => {
    it('should query distinct service ids of the schedule', async () => {
      mockTransaction.programacoes_servicos.findMany.mockResolvedValueOnce([]);

      await repository.findScheduledServiceIds(3, mockTransaction);

      expect(
        mockTransaction.programacoes_servicos.findMany,
      ).toHaveBeenCalledWith({
        where: { id_programacao: 3 },
        select: { id_servico: true },
        distinct: ['id_servico'],
      });
    });

    it('should map the rows to a list of ids, keeping the order', async () => {
      mockTransaction.programacoes_servicos.findMany.mockResolvedValueOnce([
        { id_servico: 5 },
        { id_servico: 2 },
        { id_servico: 9 },
      ]);

      const result = await repository.findScheduledServiceIds(
        3,
        mockTransaction,
      );

      expect(result).toEqual([5, 2, 9]);
    });

    it('should return an empty array when the schedule has no items', async () => {
      mockTransaction.programacoes_servicos.findMany.mockResolvedValueOnce([]);

      await expect(
        repository.findScheduledServiceIds(3, mockTransaction),
      ).resolves.toEqual([]);
    });
  });

  describe('resetScheduleExecution', () => {
    it('should clear real of every schedule item', async () => {
      await repository.resetScheduleExecution(
        3,
        ScheduleStatus.CONFIRMADA,
        mockTransaction,
      );

      expect(
        mockTransaction.programacoes_servicos.updateMany,
      ).toHaveBeenCalledTimes(1);
      expect(
        mockTransaction.programacoes_servicos.updateMany,
      ).toHaveBeenCalledWith({
        where: { id_programacao: 3 },
        data: { real: null },
      });
    });

    it('should clear exec and set the given status on the schedule', async () => {
      await repository.resetScheduleExecution(
        3,
        ScheduleStatus.CONFIRMADA,
        mockTransaction,
      );

      expect(mockTransaction.programacoes.update).toHaveBeenCalledTimes(1);
      expect(mockTransaction.programacoes.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { exec: null, id_status_programacao: ScheduleStatus.CONFIRMADA },
      });
    });

    it('should use the status received as parameter (not a fixed value)', async () => {
      await repository.resetScheduleExecution(
        3,
        ScheduleStatus.REAGENDADA,
        mockTransaction,
      );

      const [{ data }] = mockTransaction.programacoes.update.mock.calls[0];
      expect(data.id_status_programacao).toBe(ScheduleStatus.REAGENDADA);
    });

    it('should use only the transaction client', async () => {
      await repository.resetScheduleExecution(
        3,
        ScheduleStatus.CONFIRMADA,
        mockTransaction,
      );

      expect(mockPrisma.programacoes.update).not.toHaveBeenCalled();
      expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    });

    it('should resolve with undefined', async () => {
      await expect(
        repository.resetScheduleExecution(
          3,
          ScheduleStatus.CONFIRMADA,
          mockTransaction,
        ),
      ).resolves.toBeUndefined();
    });

    it('should reject if the schedule update fails (both calls are fired by Promise.all)', async () => {
      mockTransaction.programacoes.update.mockRejectedValueOnce(
        Object.assign(new Error('not found'), { code: 'P2025' }),
      );

      await expect(
        repository.resetScheduleExecution(
          3,
          ScheduleStatus.CONFIRMADA,
          mockTransaction,
        ),
      ).rejects.toThrow('not found');
      expect(
        mockTransaction.programacoes_servicos.updateMany,
      ).toHaveBeenCalled();
    });

    it('should reject if the items update fails', async () => {
      mockTransaction.programacoes_servicos.updateMany.mockRejectedValueOnce(
        new Error('db down'),
      );

      await expect(
        repository.resetScheduleExecution(
          3,
          ScheduleStatus.CONFIRMADA,
          mockTransaction,
        ),
      ).rejects.toThrow('db down');
    });
  });

  describe('clearServicesReal', () => {
    it('should set qtde_real to null for the given services', async () => {
      await repository.clearServicesReal([2, 5], mockTransaction);

      expect(mockTransaction.servicos.updateMany).toHaveBeenCalledTimes(1);
      expect(mockTransaction.servicos.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [2, 5] } },
        data: { qtde_real: null },
      });
    });

    it('should still query with an empty list (current behaviour)', async () => {
      await repository.clearServicesReal([], mockTransaction);

      expect(mockTransaction.servicos.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [] } },
        data: { qtde_real: null },
      });
    });

    it('should propagate prisma errors', async () => {
      mockTransaction.servicos.updateMany.mockRejectedValueOnce(
        new Error('db down'),
      );

      await expect(
        repository.clearServicesReal([2], mockTransaction),
      ).rejects.toThrow('db down');
    });
  });

  describe('sumWorkSchedulesExec', () => {
    it('should aggregate exec of the work schedules ignoring null exec', async () => {
      mockTransaction.programacoes.aggregate.mockResolvedValueOnce({
        _sum: { exec: 80 },
      });

      await repository.sumWorkSchedulesExec(10, mockTransaction);

      expect(mockTransaction.programacoes.aggregate).toHaveBeenCalledWith({
        where: { id_obra: 10, exec: { not: null } },
        _sum: { exec: true },
      });
    });

    it.each([
      [80, 80],
      [12.5, 12.5],
      [0, 0],
    ])('should return the sum (%p → %p)', async (sum, expected) => {
      mockTransaction.programacoes.aggregate.mockResolvedValueOnce({
        _sum: { exec: sum },
      });

      await expect(
        repository.sumWorkSchedulesExec(10, mockTransaction),
      ).resolves.toBe(expected);
    });

    it('should return 0 when no schedule has exec (_sum.exec = null)', async () => {
      mockTransaction.programacoes.aggregate.mockResolvedValueOnce({
        _sum: { exec: null },
      });

      await expect(
        repository.sumWorkSchedulesExec(10, mockTransaction),
      ).resolves.toBe(0);
    });

    it('should propagate prisma errors', async () => {
      mockTransaction.programacoes.aggregate.mockRejectedValueOnce(
        new Error('db down'),
      );

      await expect(
        repository.sumWorkSchedulesExec(10, mockTransaction),
      ).rejects.toThrow('db down');
    });
  });

  describe('updateWorkStatusAfterReset', () => {
    it('should set status, clear conclusion date and set executed', async () => {
      await repository.updateWorkStatusAfterReset(
        10,
        { status: WorkStatus.CONFIRMADA, executed: 80 },
        mockTransaction,
      );

      expect(mockTransaction.obras.update).toHaveBeenCalledTimes(1);
      expect(mockTransaction.obras.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          id_status: WorkStatus.CONFIRMADA,
          data_conclusao: null,
          executado: 80,
        },
      });
    });

    it('should not write executado when executed is not sent (point-by-point flow)', async () => {
      await repository.updateWorkStatusAfterReset(
        10,
        { status: WorkStatus.CONFIRMADA },
        mockTransaction,
      );

      const [{ data }] = mockTransaction.obras.update.mock.calls[0];
      expect(data).toEqual({
        id_status: WorkStatus.CONFIRMADA,
        data_conclusao: null,
      });
      expect(data).not.toHaveProperty('executado');
    });

    it('should write executado = 0 (0 is not treated as missing)', async () => {
      await repository.updateWorkStatusAfterReset(
        10,
        { status: WorkStatus.CONFIRMADA, executed: 0 },
        mockTransaction,
      );

      const [{ data }] = mockTransaction.obras.update.mock.calls[0];
      expect(data.executado).toBe(0);
    });

    it('should always clear data_conclusao', async () => {
      await repository.updateWorkStatusAfterReset(
        10,
        { status: WorkStatus.SERVICOS_REAGENDADOS, executed: 50 },
        mockTransaction,
      );

      const [{ data }] = mockTransaction.obras.update.mock.calls[0];
      expect(data.data_conclusao).toBeNull();
      expect(data.id_status).toBe(WorkStatus.SERVICOS_REAGENDADOS);
    });

    it('should propagate P2025 when the work does not exist', async () => {
      const error = Object.assign(new Error('not found'), { code: 'P2025' });
      mockTransaction.obras.update.mockRejectedValueOnce(error);

      await expect(
        repository.updateWorkStatusAfterReset(
          10,
          { status: WorkStatus.CONFIRMADA },
          mockTransaction,
        ),
      ).rejects.toBe(error);
    });
  });
});
