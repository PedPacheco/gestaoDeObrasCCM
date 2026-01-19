import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ExecutionReportRepository } from 'src/infra/repositories/executionReportRepository';

import { Test, TestingModule } from '@nestjs/testing';

import {
  mockExecutionReportPersistenceObject,
  mockExecutionReportRepository,
} from '../../../test/mocks/mocksExecutionReport';

describe('ExecutionReportRepository', () => {
  let repository: ExecutionReportRepository;

  const mockPrisma = {
    $transaction: jest.fn(),
    relatorio_execucao: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    programacoes: {
      update: jest.fn(),
    },
  };

  const mockTransaction = {
    relatorio_execucao: {
      create: jest.fn(),
      findFirst: jest.fn(),
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

  afterEach(jest.clearAllMocks);

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
          usuario: { select: { nome_usuario: true } },
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
          usuario: { select: { nome_usuario: true } },
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

  describe('delete', () => {
    it('Should call delete method and delete item', async () => {
      mockPrisma.programacoes.update = jest
        .fn()
        .mockReturnValue('update_result');
      mockPrisma.relatorio_execucao.delete = jest
        .fn()
        .mockReturnValue('delete_result');
      mockPrisma.$transaction = jest.fn().mockResolvedValue(undefined);

      await repository.delete(1, 3);

      expect(mockPrisma.$transaction).toHaveBeenCalledWith([
        'update_result',
        'delete_result',
      ]);
    });
  });
});
