import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ExecutionReportRepository } from 'src/infra/repositories/executionReportRepository';

import { Test, TestingModule } from '@nestjs/testing';

describe('ExecutionReportRepository', () => {
  let repository: ExecutionReportRepository;

  const mockPrisma = {};

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
      await repository.create(
        {
          idSchedule: 1,
          idUser: 1,
          idWork: 1,
        },
        mockTransaction,
      );

      expect(mockTransaction.relatorio_execucao.create).toHaveBeenCalledWith({
        data: {
          id_obra: 1,
          id_programacao: 1,
          id_usuario: 1,
        },
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
});
