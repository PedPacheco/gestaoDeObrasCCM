import { GetScheduleRestrictionsService } from 'src/application/schedule/getScheduleRestrictions.service';
import { GetValueWeeklyScheduleDTO } from 'src/interface/dtos/scheduleDTO';

import { Test } from '@nestjs/testing';
import { GET_SCHEDULE_RESTRICTIONS_REPOSITORY } from 'src/domain/repositories/schedule/IGetScheduleRestrictionsRepository';

describe('GetScheduleRestrictions', () => {
  let service: GetScheduleRestrictionsService;

  const mockRepository = {
    getRestrictions: jest.fn(),
  };

  const mockResponseQuery = {
    works: [
      {
        id: 1695,
        ovnota: '3908435',
        diagrama: null,
        ordem_dci: null,
        ordem_dcim: null,
        executado: 98,
        prog_id: 1,
        data_prog: new Date('2024-08-03T00:00:00.000Z'),
        prog: 0,
        exec: 0,
        observacao_restricao: null,
        id_restricao_prog1: 1,
        restricao1: 'Aviso',
        responsabilidade1: null,
        nome_responsavel: null,
        area_responsavel1: null,
        status_restricao1: null,
        data_resolucao1: null,
        id_restricao_prog2: 1,
        restricao2: 'Aviso',
        responsabilidade2: null,
        nome_responsavel2: null,
        area_responsavel2: null,
        status_restricao2: null,
        data_resolucao2: null,
        mun: 'SJC',
        tipo_obra: 'REMOÇÃO DE REDE',
        parceira: 'ENGELMIG',
      },
      {
        id: 1695,
        ovnota: '3908435',
        diagrama: null,
        ordem_dci: null,
        ordem_dcim: null,
        executado: 98,
        prog_id: 1,
        data_prog: new Date('2024-08-04T00:00:00.000Z'),
        prog: 0,
        exec: 0,
        observacao_restricao: null,
        id_restricao_prog1: 1,
        restricao1: 'Aviso',
        responsabilidade1: null,
        nome_responsavel: null,
        area_responsavel1: null,
        status_restricao1: null,
        data_resolucao1: null,
        id_restricao_prog2: 1,
        restricao2: 'Aviso',
        responsabilidade2: null,
        nome_responsavel2: null,
        area_responsavel2: null,
        status_restricao2: null,
        data_resolucao2: null,
        mun: 'SJC',
        tipo_obra: 'REMOÇÃO DE REDE',
        parceira: 'ENGELMIG',
      },
    ],
    totals: [
      {
        total_obras: 2,
      },
    ],
  };

  const mockResult = {
    works: [
      {
        id: 1695,
        prog_id: 1,
        ovnota: '3908435',
        diagrama: null,
        ordem_dci: null,
        ordem_dcim: null,
        mun: 'SJC',
        tipo_obra: 'REMOÇÃO DE REDE',
        parceira: 'ENGELMIG',
        executado: 98,
        data_prog: new Date('2024-08-03T00:00:00.000Z'),
        prog: 0,
        exec: 0,
        observacao_restricao: null,
        id_restricao_prog1: 1,
        restricao1: 'Aviso',
        responsabilidade1: null,
        nome_responsavel: null,
        area_responsavel1: null,
        status_restricao1: null,
        data_resolucao1: null,
        id_restricao_prog2: 1,
        restricao2: 'Aviso',
        responsabilidade2: null,
        nome_responsavel2: null,
        area_responsavel2: null,
        status_restricao2: null,
        data_resolucao2: null,
      },
      {
        id: 1695,
        prog_id: 1,
        ovnota: '3908435',
        diagrama: null,
        ordem_dci: null,
        ordem_dcim: null,
        mun: 'SJC',
        tipo_obra: 'REMOÇÃO DE REDE',
        parceira: 'ENGELMIG',
        executado: 98,
        data_prog: new Date('2024-08-04T00:00:00.000Z'),
        prog: 0,
        exec: 0,
        observacao_restricao: null,
        id_restricao_prog1: 1,
        restricao1: 'Aviso',
        responsabilidade1: null,
        nome_responsavel: null,
        area_responsavel1: null,
        status_restricao1: null,
        data_resolucao1: null,
        id_restricao_prog2: 1,
        restricao2: 'Aviso',
        responsabilidade2: null,
        nome_responsavel2: null,
        area_responsavel2: null,
        status_restricao2: null,
        data_resolucao2: null,
      },
    ],
    totals: { total_obras: 2 },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetScheduleRestrictionsService,
        {
          provide: GET_SCHEDULE_RESTRICTIONS_REPOSITORY,
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<GetScheduleRestrictionsService>(
      GetScheduleRestrictionsService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the correct values', async () => {
    const filters: GetValueWeeklyScheduleDTO = {
      dataInicial: '01/09/2024',
      dataFinal: '10/09/2024',
      executado: false,
      idGrupo: undefined,
      idMunicipio: undefined,
      idParceira: undefined,
      idRegional: undefined,
      idTipo: undefined,
    };

    mockRepository.getRestrictions.mockResolvedValue(mockResponseQuery);

    const result = await service.getRestrictions(filters);

    expect(result).toEqual(mockResult);
    expect(mockRepository.getRestrictions).toHaveBeenCalledWith(filters);
  });
});
