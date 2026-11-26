import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { ContractUpdateRepository } from 'src/infra/repositories/works/management/contractUpdateRepository';

describe('ContractUpdateRepository', () => {
  let repository: ContractUpdateRepository;

  const mockPrisma = {
    obras: { updateMany: vi.fn() },
    $transaction: vi.fn(),
  };

  const mockData = [
    {
      ovnota: '2354',
      ordemDiagrama: '1800',
      ordemField: 'ordem_dcim',
      dataEmpreitamento: new Date('2025-09-02'),
    },
    {
      ovnota: '2345',
      ordemDiagrama: '1700',
      ordemField: 'ordem_dci',
      dataEmpreitamento: new Date('2025-09-02'),
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractUpdateRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<ContractUpdateRepository>(ContractUpdateRepository);
  });

  afterEach(vi.clearAllMocks);

  describe('update', () => {
    it('should call transaction prisma transaction to update contract of works', async () => {
      mockPrisma.$transaction.mockImplementation((calls) => {
        return Promise.all(calls.map((fn: any) => fn));
      });

      await repository.update(mockData);

      expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
      expect(mockPrisma.obras.updateMany).toHaveBeenCalledTimes(
        mockData.length,
      );

      mockData.forEach((work, index) => {
        expect(mockPrisma.obras.updateMany).toHaveBeenNthCalledWith(index + 1, {
          where: {
            ovnota: work.ovnota,
            [work.ordemField]: work.ordemDiagrama,
          },
          data: {
            data_empreitamento: work.dataEmpreitamento,
            id_status: 45,
          },
        });
      });
    });
  });
});
