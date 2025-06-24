import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ExecutionReportRepository } from 'src/infra/repositories/executionReportRepository';

import { Test, TestingModule } from '@nestjs/testing';

import { mockExecutionReportRepository } from '../../../test/mocks/mocksExecutionReport';

describe('ExecutionReportRepository', () => {
  let repository: ExecutionReportRepository;

  const mockPrisma = {
    relatorio_execucao: {
      findMany: jest.fn(),
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
        where: { id_obra: 1 },
        select: {
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
          equipamentos_retirados: true,
          potencia_equipamento_retirado: true,
          patrimonio_equipamento_retirado: true,
          alteracoes_execucao: true,
          observacoes_gerais: true,
          chave_provisoria_instalada: true,
          referencia_chave_provisoria: true,
          chave_provisoria_retirada: true,
          motivo: true,
          usuario: { select: { nome_usuario: true } },
          obras: {
            select: {
              ovnota: true,
              ordem_dci: true,
              tipos: { select: { tipo_obra: true } },
            },
          },
        },
      });

      expect(result).toEqual(expected);
    });
  });
});
