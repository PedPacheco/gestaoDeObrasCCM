import { RejectionsOfSchedulesService } from 'src/application/schedule/rejectionOfSchedules.service';
import { REJECTION_OF_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IRejectionsOfSchedules';

import { Test } from '@nestjs/testing';

describe('GetScheduleValues', () => {
  let service: RejectionsOfSchedulesService;

  const mockRepository = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RejectionsOfSchedulesService,
        {
          provide: REJECTION_OF_SCHEDULES_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<RejectionsOfSchedulesService>(
      RejectionsOfSchedulesService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call get method and return data', async () => {
    mockRepository.get.mockResolvedValue([
      {
        motivo: 'CHI',
        data_prog: new Date('2025-05-17'),
        hora_ini: '08:00',
        hora_ter: '17:00',
        prog: 80,
        descricao: 'Obra sem chi',
        equip_desligado: 'transformador',
        equipe_linha_morta: 6,
        equipe_linha_viva: 0,
        equipe_regularizacao: 0,
        tipo_servico: 'DP',
        observacao_programacao: null,
      },
    ]);

    const result = await service.get(1);

    expect(result).toEqual([
      {
        motivo: 'CHI',
        data_prog: new Date('2025-05-17'),
        hora_ini: '08:00',
        hora_ter: '17:00',
        prog: 80,
        descricao: 'Obra sem chi',
        equip_desligado: 'transformador',
        equipe_linha_morta: 6,
        equipe_linha_viva: 0,
        equipe_regularizacao: 0,
        tipo_servico: 'DP',
        observacao_programacao: null,
      },
    ]);
    expect(mockRepository.get).toHaveBeenCalledWith(1);
  });
});
