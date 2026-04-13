import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { EquipmentRepository } from 'src/infra/repositories/equipmentRepository';

describe('EquipmentRepository', () => {
  let repository: EquipmentRepository;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const prismaMock = {
      obras: {
        findMany: jest.fn(),
        count: jest.fn(),
      },
      equipamentos: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentRepository,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    repository = module.get<EquipmentRepository>(EquipmentRepository);
    prisma = module.get(PrismaService);

    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  /**
   * ============================
   * 🚀 findWorks
   * ============================
   */

  it('should call prisma.obras.findMany with correct params', async () => {
    const where = { ovnota: { in: ['1'] } };
    const mockResult = [{ id: 1 }];

    (prisma.obras.findMany as jest.Mock).mockResolvedValue(mockResult);

    const result = await repository.findWorks(where);

    expect(prisma.obras.findMany).toHaveBeenCalledWith({
      where,
      select: {
        id: true,
        ovnota: true,
        diagrama: true,
        ordem_dci: true,
        ordem_dca: true,
        ordem_dcd: true,
        ordem_dcim: true,
        referencia: true,
        id_circuito: true,
        id_status: true,
        municipios: { select: { municipio: true, mun: true } },
        tipos: { select: { tipo_obra: true } },
        status: { select: { status: true } },
        circuitos: { select: { circuito: true } },
      },
    });

    expect(result).toEqual(mockResult);
  });

  /**
   * ============================
   * 🚀 countWorks
   * ============================
   */

  it('should call prisma.obras.count with correct where', async () => {
    const where = { referencia: { not: null } };

    (prisma.obras.count as jest.Mock).mockResolvedValue(10);

    const result = await repository.countWorks(where);

    expect(prisma.obras.count).toHaveBeenCalledWith({ where });
    expect(result).toBe(10);
  });

  /**
   * ============================
   * 🚀 findEquipmentByCode
   * ============================
   */

  it('should call prisma.equipamentos.findMany with correct params', async () => {
    const codigos = ['EQ1', 'EQ2'];
    const mockResult = [{ codigo_instalacao: 'EQ1' }];

    (prisma.equipamentos.findMany as jest.Mock).mockResolvedValue(mockResult);

    const result = await repository.findEquipmentByCode(codigos);

    expect(prisma.equipamentos.findMany).toHaveBeenCalledWith({
      where: { codigo_instalacao: { in: codigos } },
      select: {
        codigo_instalacao: true,
        latitude: true,
        longitude: true,
        bairro: true,
      },
    });

    expect(result).toEqual(mockResult);
  });

  /**
   * ============================
   * 🚀 findWithoutLocationRaw
   * ============================
   */

  it('should call prisma.obras.findMany with correct params for raw query', async () => {
    const ovnotas = { ovnota: { in: ['1'] } };
    const mockResult = [{ ovnota: '1' }];

    (prisma.obras.findMany as jest.Mock).mockResolvedValue(mockResult);

    const result = await repository.findWithoutLocationRaw(ovnotas);

    expect(prisma.obras.findMany).toHaveBeenCalledWith({
      where: ovnotas,
      select: {
        ovnota: true,
        referencia: true,
        executado: true,
        status: { select: { status: true } },
        tipos: { select: { tipo_obra: true } },
        turmas: { select: { turma: true } },
        empreendimento: { select: { empreendimento: true } },
        circuitos: {
          select: {
            circuito: true,
            conjuntos: { select: { conjunto: true } },
          },
        },
      },
    });

    expect(result).toEqual(mockResult);
  });
});
