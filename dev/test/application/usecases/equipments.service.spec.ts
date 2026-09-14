import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentService } from 'src/application/usecases/equipment.service';
import { EQUIPMENT_REPOSITORY } from 'src/domain/contracts/IEquipmentRepository';

describe('EquipmentService', () => {
  let service: EquipmentService;

  const mockRepository = {
    findWorks: jest.fn(),
    countWorks: jest.fn(),
    findEquipmentByCode: jest.fn(),
    findWithoutLocationRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        {
          provide: EQUIPMENT_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);

    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  /**
   * ============================
   * 🚀 getEquipment
   * ============================
   */

  it('should return empty data when no works found', async () => {
    mockRepository.findWorks.mockResolvedValue([]);
    mockRepository.countWorks.mockResolvedValue(0);

    const result = await service.getEquipment([{ ovnota: '12' }]);

    expect(result).toEqual({
      data: [],
      total: 0,
    });

    expect(mockRepository.findWorks).toHaveBeenCalled();
    expect(mockRepository.countWorks).toHaveBeenCalled();
  });

  it('should apply ovnotas filter correctly', async () => {
    mockRepository.findWorks.mockResolvedValue([]);
    mockRepository.countWorks.mockResolvedValue(0);

    await service.getEquipment([{ ovnota: '1', ordemDiagrama: '123' }]);

    expect(mockRepository.findWorks).toHaveBeenCalledWith({
      referencia: { not: null },
      ovnota: { in: ['1'] },
      OR: [
        { diagrama: { in: ['123'] } },
        { ordem_dci: { in: ['123'] } },
        { ordem_dcd: { in: ['123'] } },
        { ordem_dca: { in: ['123'] } },
        { ordem_dcim: { in: ['123'] } },
      ],
    });
  });

  it('should map works with equipment data correctly', async () => {
    const worksMock = [
      {
        id: 1,
        ovnota: '123',
        referencia: 'EQ1',
        tipos: { tipo_obra: 'POSTE' },
        status: { status: 'Pendente' },
        municipios: { municipio: 'SP' },
        circuitos: { circuito: 'C1' },
      },
    ];

    const equipmentMock = [
      {
        codigo_instalacao: 'EQ1',
        bairro: 'Centro',
        latitude: -23.5,
        longitude: -46.6,
      },
    ];

    mockRepository.findWorks.mockResolvedValue(worksMock);
    mockRepository.countWorks.mockResolvedValue(1);
    mockRepository.findEquipmentByCode.mockResolvedValue(equipmentMock);

    const result = await service.getEquipment([{ ordemDiagrama: '212412' }]);

    expect(result).toEqual({
      total: 1,
      data: [
        {
          id: 1,
          ovnota: '123',
          referencia: 'EQ1',
          tipo_obra: 'POSTE',
          status: 'Pendente',
          municipio: 'SP',
          circuito: 'C1',
          bairro: 'Centro',
          latitude: -23.5,
          longitude: -46.6,
        },
      ],
    });
  });

  it('should filter out works without matching equipment', async () => {
    const worksMock = [
      {
        id: 1,
        ovnota: '123',
        referencia: 'EQ1',
      },
    ];

    mockRepository.findWorks.mockResolvedValue(worksMock);
    mockRepository.countWorks.mockResolvedValue(1);
    mockRepository.findEquipmentByCode.mockResolvedValue([]);

    const result = await service.getEquipment([]);

    expect(result).toEqual({
      total: 1,
      data: [],
    });
  });

  it('should ignore null referencias when aggregating', async () => {
    const worksMock = [
      { referencia: null },
      { referencia: 'EQ1' },
      { referencia: 'EQ1' },
    ];

    mockRepository.findWorks.mockResolvedValue(worksMock);
    mockRepository.countWorks.mockResolvedValue(3);
    mockRepository.findEquipmentByCode.mockResolvedValue([]);

    await service.getEquipment([]);

    expect(mockRepository.findEquipmentByCode).toHaveBeenCalledWith(['EQ1']);
  });

  it('should handle missing nested properties safely', async () => {
    const worksMock = [
      {
        id: 1,
        ovnota: '123',
        referencia: 'EQ1',
        tipos: null,
        status: null,
        municipios: null,
        circuitos: null,
      },
    ];

    const equipmentMock = [
      {
        codigo_instalacao: 'EQ1',
        bairro: 'Centro',
        latitude: 0,
        longitude: 0,
      },
    ];

    mockRepository.findWorks.mockResolvedValue(worksMock);
    mockRepository.countWorks.mockResolvedValue(1);
    mockRepository.findEquipmentByCode.mockResolvedValue(equipmentMock);

    const result = await service.getEquipment([]);

    expect(result.data[0]).toEqual(
      expect.objectContaining({
        tipo_obra: undefined,
        status: undefined,
        municipio: undefined,
        circuito: undefined,
      }),
    );
  });

  /**
   * ============================
   * 🚀 getWithoutLocation
   * ============================
   */

  it('should call repository with parsed ovnotas', async () => {
    mockRepository.findWithoutLocationRaw.mockResolvedValue([]);

    await service.getWithoutLocation([{ ovnota: '1', ordemDiagrama: '123' }]);

    expect(mockRepository.findWithoutLocationRaw).toHaveBeenCalledWith({
      ovnota: { in: ['1'] },
      OR: [
        { diagrama: { in: ['123'] } },
        { ordem_dci: { in: ['123'] } },
        { ordem_dcd: { in: ['123'] } },
        { ordem_dca: { in: ['123'] } },
        { ordem_dcim: { in: ['123'] } },
      ],
    });
  });

  it('should map works correctly in getWithoutLocation', async () => {
    const rawMock = [
      {
        ovnota: '123',
        referencia: null,
        status: { status: 'Pendente' },
        circuitos: {
          circuito: 'C1',
          conjuntos: { conjunto: 'CJ1' },
        },
        turmas: { turma: 'Turma A' },
        tipos: { tipo_obra: 'POSTE' },
        executado: 50,
        empreendimento: { empreendimento: 'Empreendimento X' },
      },
    ];

    mockRepository.findWithoutLocationRaw.mockResolvedValue(rawMock);

    const result = await service.getWithoutLocation([
      { ovnota: '1', ordemDiagrama: '123' },
    ]);

    expect(result).toEqual([
      {
        ovnota: '123',
        referencia: '',
        status: 'Pendente',
        conjunto: 'CJ1',
        circuito: 'C1',
        empreiteira: 'Turma A',
        tipo_obra: 'POSTE',
        executado: 50,
        empreendimento: 'Empreendimento X',
      },
    ]);
  });

  it('should fallback to empty strings when nested values are missing', async () => {
    const rawMock = [
      {
        ovnota: '123',
        referencia: null,
        status: null,
        circuitos: null,
        turmas: null,
        tipos: null,
        executado: null,
        empreendimento: null,
      },
    ];

    mockRepository.findWithoutLocationRaw.mockResolvedValue(rawMock);

    const result = await service.getWithoutLocation([
      { ovnota: '1', ordemDiagrama: '123' },
    ]);

    expect(result).toEqual([
      {
        ovnota: '123',
        referencia: '',
        status: '',
        conjunto: '',
        circuito: '',
        empreiteira: '',
        tipo_obra: '',
        executado: '',
        empreendimento: '',
      },
    ]);
  });
});
