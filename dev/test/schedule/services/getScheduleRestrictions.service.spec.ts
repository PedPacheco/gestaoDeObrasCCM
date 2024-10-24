import { Test } from '@nestjs/testing';
import { obras } from '@prisma/client';
import { GetValueWeeklyScheduleDTO } from 'src/config/dto/scheduleDTO';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { GetScheduleRestrictionsService } from 'src/modules/schedule/services/getScheduleRestrictions.service';
import * as moment from 'moment';

describe('GetScheduleRestrictions', () => {
  let prisma: PrismaService;
  let service: GetScheduleRestrictionsService;

  const prismaMock = {
    obras: {
      findMany: jest.fn(),
    },
  };

  const mockResponseQuery = [
    {
      id: 1695,
      ovnota: '3908435',
      diagrama: null,
      ordem_dci: null,
      ordem_dcim: null,
      executado: 98,
      programacoes: [
        {
          data_prog: '2024-08-04T00:00:00.000Z',
          prog: 0,
          exec: 0,
          observacao_restricao: null,
          programacoes_restricao_prog1: {
            restricao: 'Aviso',
          },
          responsabilidade1: null,
          nome_responsavel: null,
          area_responsavel1: null,
          status_restricao1: null,
          data_resolucao1: null,
          programacoes_restricao_prog2: {
            restricao: 'Aviso',
          },
          responsabilidade2: null,
          nome_responsavel2: null,
          area_responsavel2: null,
          status_restricao2: null,
          data_resolucao2: null,
        },
      ],
      municipios: {
        mun: 'SJC',
      },
      tipos: {
        tipo_obra: 'REMOÇÃO DE REDE',
      },
      turmas: {
        turma: 'ENGELMIG',
      },
    } as unknown as obras,
  ];

  const mockResult = [
    {
      id: 1695,
      ovnota: '3908435',
      mun: 'SJC',
      tipo: 'REMOÇÃO DE REDE',
      parceira: 'ENGELMIG',
      executado: 98,
      data_prog: '2024-08-04T00:00:00.000Z',
      prog: 0,
      exec: 0,
      observacao_restricao: null,
      restricao_prog1: 'Aviso',
      responsabilidade1: null,
      nome_responsavel: null,
      area_responsavel1: null,
      status_restricao1: null,
      data_resolucao1: null,
      restricao_prog2: 'Aviso',
      responsabilidade2: null,
      nome_responsavel2: null,
      area_responsavel2: null,
      status_restricao2: null,
      data_resolucao2: null,
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetScheduleRestrictionsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<GetScheduleRestrictionsService>(
      GetScheduleRestrictionsService,
    );
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should return the correct values without filters', async () => {
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

    jest.spyOn(prisma.obras, 'findMany').mockResolvedValue(mockResponseQuery);

    const result = await service.getRestrictions(filters);

    expect(result).toEqual(mockResult);
    expect(prisma.obras.findMany).toHaveBeenCalledWith({
      relationLoadStrategy: 'join',
      where: {
        programacoes: {
          some: {
            exec: null,
            data_prog: {
              gte: moment('01/09/2024', 'DD/MM/YYYY').toDate(),
              lte: moment('10/09/2024', 'DD/MM/YYYY').toDate(),
            },
          },
        },
        municipios: { id_regional: undefined },
        id_turma: undefined,
        id_tipo: undefined,
        id_gpm: undefined,
        tipos: { id_grupo: undefined },
      },
      select: {
        id: true,
        ovnota: true,
        diagrama: true,
        ordem_dci: true,
        ordem_dcim: true,
        executado: true,
        programacoes: {
          select: {
            data_prog: true,
            prog: true,
            exec: true,
            observacao_restricao: true,
            programacoes_restricao_prog1: {
              select: { restricao: true },
            },
            responsabilidade1: true,
            nome_responsavel: true,
            area_responsavel1: true,
            status_restricao1: true,
            data_resolucao1: true,
            programacoes_restricao_prog2: {
              select: { restricao: true },
            },
            responsabilidade2: true,
            nome_responsavel2: true,
            area_responsavel2: true,
            status_restricao2: true,
            data_resolucao2: true,
          },
          where: {
            data_prog: {
              gte: moment('01/09/2024', 'DD/MM/YYYY').toDate(),
              lte: moment('10/09/2024', 'DD/MM/YYYY').toDate(),
            },
          },
        },
        municipios: {
          select: { mun: true },
        },
        tipos: { select: { tipo_obra: true } },
        turmas: { select: { turma: true } },
      },
    });
  });

  it('should return the correct values with filters', async () => {
    const filters: GetValueWeeklyScheduleDTO = {
      dataInicial: '01/09/2024',
      dataFinal: '10/09/2024',
      executado: true,
      idGrupo: 1,
      idMunicipio: 1,
      idParceira: 1,
      idRegional: 1,
      idTipo: 1,
    };

    jest.spyOn(prisma.obras, 'findMany').mockResolvedValue(mockResponseQuery);

    const result = await service.getRestrictions(filters);

    expect(result).toEqual(mockResult);
    expect(prisma.obras.findMany).toHaveBeenCalledWith({
      relationLoadStrategy: 'join',
      where: {
        programacoes: {
          some: {
            exec: { not: null },
            data_prog: {
              gte: moment('01/09/2024', 'DD/MM/YYYY').toDate(),
              lte: moment('10/09/2024', 'DD/MM/YYYY').toDate(),
            },
          },
        },
        municipios: { id_regional: 1 },
        id_turma: 1,
        id_tipo: 1,
        id_gpm: 1,
        tipos: { id_grupo: 1 },
      },
      select: {
        id: true,
        ovnota: true,
        diagrama: true,
        ordem_dci: true,
        ordem_dcim: true,
        executado: true,
        programacoes: {
          select: {
            data_prog: true,
            prog: true,
            exec: true,
            observacao_restricao: true,
            programacoes_restricao_prog1: {
              select: { restricao: true },
            },
            responsabilidade1: true,
            nome_responsavel: true,
            area_responsavel1: true,
            status_restricao1: true,
            data_resolucao1: true,
            programacoes_restricao_prog2: {
              select: { restricao: true },
            },
            responsabilidade2: true,
            nome_responsavel2: true,
            area_responsavel2: true,
            status_restricao2: true,
            data_resolucao2: true,
          },
          where: {
            data_prog: {
              gte: moment('01/09/2024', 'DD/MM/YYYY').toDate(),
              lte: moment('10/09/2024', 'DD/MM/YYYY').toDate(),
            },
          },
        },
        municipios: {
          select: { mun: true },
        },
        tipos: { select: { tipo_obra: true } },
        turmas: { select: { turma: true } },
      },
    });
  });
});
