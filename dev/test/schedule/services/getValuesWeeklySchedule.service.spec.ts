import { Test } from '@nestjs/testing';
import { obras } from '@prisma/client';
import { GetValueWeeklyScheduleDTO } from 'src/config/dto/scheduleDTO';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { GetValuesWeeklyScheduleService } from 'src/modules/schedule/services/getValuesWeeklySchedule.service';
import * as moment from 'moment';

describe('GetValuesWeeklyScheduleService', () => {
  let prisma: PrismaService;
  let service: GetValuesWeeklyScheduleService;

  const prismaMock = {
    obras: {
      findMany: jest.fn(),
    },
  };

  const mockQueryResponse = [
    {
      id: 5839,
      ovnota: '14417407',
      tipos: {
        tipo_abrev: 'SPACER',
      },
      programacoes: [
        {
          data_prog: '2024-10-11T00:00:00.000Z',
          hora_ini: '1970-01-01T08:00:00.000Z',
          hora_ter: '1970-01-01T17:00:00.000Z',
        },
      ],
      turmas: {
        turma: 'ENGELMIG',
      },
    } as unknown as obras,
  ];

  const mockResponse = [
    {
      id: 5839,
      ovnota: '14417407',

      tipo_abrev: 'SPACER',
      programacoes: [
        {
          data_prog: '2024-10-11T00:00:00.000Z',
          hora_ini: '1970-01-01T08:00:00.000Z',
          hora_ter: '1970-01-01T17:00:00.000Z',
        },
      ],

      parceira: 'ENGELMIG',
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetValuesWeeklyScheduleService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = module.get<GetValuesWeeklyScheduleService>(
      GetValuesWeeklyScheduleService,
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

    jest.spyOn(prisma.obras, 'findMany').mockResolvedValue(mockQueryResponse);

    const result = await service.getValues(filters);

    expect(result).toEqual(mockResponse);
    expect(prisma.obras.findMany).toHaveBeenCalledWith({
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
        tipos: { id_grupo: undefined },
      },
      select: {
        id: true,
        ovnota: true,
        tipos: {
          select: { tipo_abrev: true },
        },
        programacoes: {
          where: {
            data_prog: {
              gte: moment('01/09/2024', 'DD/MM/YYYY').toDate(),
              lte: moment('10/09/2024', 'DD/MM/YYYY').toDate(),
            },
          },
          select: { data_prog: true, hora_ini: true, hora_ter: true },
        },
        turmas: {
          select: { turma: true },
        },
      },
    });
  });

  it('should return the correct values without filters', async () => {
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

    jest.spyOn(prisma.obras, 'findMany').mockResolvedValue(mockQueryResponse);

    const result = await service.getValues(filters);

    expect(result).toEqual(mockResponse);
    expect(prisma.obras.findMany).toHaveBeenCalledWith({
      where: {
        programacoes: {
          some: {
            exec: { not: 0 },
            data_prog: {
              gte: moment('01/09/2024', 'DD/MM/YYYY').toDate(),
              lte: moment('10/09/2024', 'DD/MM/YYYY').toDate(),
            },
          },
        },
        municipios: { id_regional: 1 },
        id_turma: 1,
        id_tipo: 1,
        tipos: { id_grupo: 1 },
      },
      select: {
        id: true,
        ovnota: true,
        tipos: {
          select: { tipo_abrev: true },
        },
        programacoes: {
          where: {
            data_prog: {
              gte: moment('01/09/2024', 'DD/MM/YYYY').toDate(),
              lte: moment('10/09/2024', 'DD/MM/YYYY').toDate(),
            },
          },
          select: { data_prog: true, hora_ini: true, hora_ter: true },
        },
        turmas: {
          select: { turma: true },
        },
      },
    });
  });
});
