import { Test, TestingModule } from '@nestjs/testing';
import { UpdateOvRepository } from 'src/infra/repositories/works/updateOvRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

describe('UpdateOvRepository', () => {
  let repository: UpdateOvRepository;

  const mockPrisma = {
    $transaction: jest.fn(),
    obras: {
      update: jest.fn(),
    },
  };

  const mockLogger = {
    error: jest.fn(),
  };

  const mockData = [
    {
      id: 1,
      obra: '4001841383',
      pep: 'PEP-123456',
      diagrama: 'DIAG-001',
      entrada: new Date('2023-01-10'),
      id_gpm: 10,
      id_circuito: 3,
      id_tipo: 2,
      referencia: 'REF123',
      prazo: 30,
      status_diagrama: 'PENDING',
      status_pep: 'APPROVED',
      status_ov: 'OPEN',
    },
    {
      id: 2,
      obra: '4001854143',
      pep: 'PEP-654321',
      diagrama: 'DIAG-002',
      entrada: new Date('2023-02-15'),
      id_gpm: 12,
      id_circuito: 5,
      id_tipo: 3,
      referencia: 'REF456',
      prazo: 45,
      status_diagrama: 'COMPLETED',
      status_pep: 'PENDING',
      status_ov: 'CLOSED',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateOvRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<UpdateOvRepository>(UpdateOvRepository);

    // Substituir o logger padrão pela versão mockada
    (repository as any).logger = mockLogger;

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  it('should call prisma.$transaction with formatted data', async () => {
    mockPrisma.$transaction.mockResolvedValueOnce(undefined);

    await repository.update(mockData);

    expect(mockPrisma.$transaction).toHaveBeenCalledTimes(1);
    expect(mockPrisma.obras.update).toHaveBeenCalledTimes(mockData.length);

    mockData.forEach((item) => {
      expect(mockPrisma.obras.update).toHaveBeenCalledWith({
        where: { id: item.id },
        data: {
          ovnota: item.obra,
          pep: item.pep,
          diagrama: item.diagrama,
          entrada: item.entrada,
          id_gpm: item.id_gpm,
          id_tipo: item.id_tipo,
          id_circuito: item.id_circuito,
          status_ov_sap: item.status_ov,
          prazo: item.prazo,
          status_diagrama: item.status_diagrama,
          status_pep: item.status_pep,
          referencia: item.referencia,
        },
      });
    });
  });

  it('should log error and throw when prisma.$transaction fails', async () => {
    const error = new Error('DB error');
    mockPrisma.$transaction.mockRejectedValueOnce(error);

    await expect(repository.update(mockData)).rejects.toThrow('DB error');

    expect(mockLogger.error).toHaveBeenCalledWith(
      `Erro ao atualizar contratos. Payload: ${JSON.stringify(mockData)}`,
      error.stack,
    );
  });
});
