import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionCapacityService } from 'src/application/executionCapacity.service';
import { EXECUTION_CAPACITY_REPOSITORY } from 'src/domain/repositories/IExecutionCapacityRepository';

describe('ExecutionCapacityService', () => {
  let service: ExecutionCapacityService;

  const mockRepository = {
    get: jest.fn(),
  };

  const mockResponseData = [
    {
      ano: '2025',
      regionais: { regional: 'Guarulhos' },
      turmas: { turma: 'MANSERV' },
      tipo: 'B2',
      qtd_equipes_rfp: 5,
      equipe: 'LM',
      jan: 5,
      fev: 4,
      mar: 3,
      abr: 3,
      mai: 3,
      jun: 3,
      jul: 3,
      ago: null,
      set: null,
      out: null,
      nov: null,
      dez: null,
    },
    {
      ano: '2025',
      regionais: { regional: 'Guarulhos' },
      turmas: { turma: 'MANSERV' },
      tipo: 'B3',
      qtd_equipes_rfp: 14,
      equipe: 'LM',
      jan: 5,
      fev: 4,
      mar: 3,
      abr: 3,
      mai: 3,
      jun: 3,
      jul: 3,
      ago: 8,
      set: null,
      out: null,
      nov: null,
      dez: null,
    },
  ];

  const mockFormattedData = [
    {
      regional: 'Guarulhos',
      parceira: 'MANSERV',
      ano: '2025',
      tipo: 'B2',
      qtd_equipes_rfp: 5,
      equipe: 'LM',
      jan: 5,
      fev: 4,
      mar: 3,
      abr: 3,
      mai: 3,
      jun: 3,
      jul: 3,
      ago: null,
      set: null,
      out: null,
      nov: null,
      dez: null,
    },
    {
      regional: 'Guarulhos',
      parceira: 'MANSERV',
      ano: '2025',
      tipo: 'B3',
      qtd_equipes_rfp: 14,
      equipe: 'LM',
      jan: 5,
      fev: 4,
      mar: 3,
      abr: 3,
      mai: 3,
      jun: 3,
      jul: 3,
      ago: 8,
      set: null,
      out: null,
      nov: null,
      dez: null,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionCapacityService,
        { provide: EXECUTION_CAPACITY_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ExecutionCapacityService>(ExecutionCapacityService);
  });

  afterEach(jest.clearAllMocks);

  describe('get', () => {
    it('should call method get with all filters and return formatted data', async () => {
      mockRepository.get.mockResolvedValue(mockResponseData);

      const filters = {
        year: '2025',
        partnerId: 1,
        regionalId: 1,
        teams: 'LM',
      };

      const response = await service.get(filters);

      expect(response).toEqual(mockFormattedData);
      expect(mockRepository.get).toHaveBeenCalledWith({
        ano: '2025',
        id_turma: 1,
        id_regional: 1,
        equipe: 'LM',
      });
    });

    it('should call method get without filters and return formatted data', async () => {
      mockRepository.get.mockResolvedValue(mockResponseData);

      const filters = {
        year: '2025',
      };

      const response = await service.get(filters);

      expect(response).toEqual(mockFormattedData);
      expect(mockRepository.get).toHaveBeenCalledWith({
        ano: '2025',
      });
    });
  });
});
