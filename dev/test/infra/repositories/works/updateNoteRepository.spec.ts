import { Test, TestingModule } from '@nestjs/testing';
import { UpdateNoteRepository } from 'src/infra/repositories/works/updateNoteRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

describe('UpdateNoteRepository', () => {
  let repository: UpdateNoteRepository;

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
      ordem_dci: 'DCI001',
      ordem_dcd: 'DCD001',
      ordem_dca: null,
      ordem_dcim: null,
      entrada: new Date('2023-01-10'),
      prazo: 30,
      referencia: 'REF123',
      id_gpm: 10,
      id_tipo: 2,
      id_circuito: 3,
      id_empreendimento: 4,
      qtde_plan: 50,
      mo_plan: 100,
      capex_mat_plan: 15000,
      capex_mo_plan: 20000,
      ano_plan: 2023,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateNoteRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<UpdateNoteRepository>(UpdateNoteRepository);

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
    expect(mockPrisma.obras.update).toHaveBeenCalledTimes(1);

    expect(mockPrisma.obras.update).toHaveBeenCalledWith({
      where: { id: mockData[0].id },
      data: {
        ovnota: mockData[0].obra,
        pep: mockData[0].pep,
        ordem_dci: mockData[0].ordem_dci,
        ordem_dcd: mockData[0].ordem_dcd,
        ordem_dca: mockData[0].ordem_dca,
        ordem_dcim: mockData[0].ordem_dcim,
        entrada: mockData[0].entrada,
        prazo: mockData[0].prazo,
        id_gpm: mockData[0].id_gpm,
        id_tipo: mockData[0].id_tipo,
        id_circuito: mockData[0].id_circuito,
        id_empreendimento: mockData[0].id_empreendimento,
        referencia: mockData[0].referencia,
        ano_plan: mockData[0].ano_plan,
        mo_planejada: mockData[0].mo_plan,
        qtde_planejada: mockData[0].qtde_plan,
        capex_mat_plan: mockData[0].capex_mat_plan,
        capex_mo_plan: mockData[0].capex_mo_plan,
      },
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
