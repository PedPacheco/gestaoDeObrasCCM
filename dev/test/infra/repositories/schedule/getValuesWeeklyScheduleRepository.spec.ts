import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetValuesWeeklyScheduleRepository } from 'src/infra/repositories/schedule/getValuesWeeklyScheduleRepository';
import { GetValueWeeklyScheduleDTO } from 'src/interface/dtos/scheduleDTO';

import * as moment from 'moment';

describe('GetValuesWeeklyScheduleRepository', () => {
  let repository: GetValuesWeeklyScheduleRepository;

  const mockPrisma = {
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
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetValuesWeeklyScheduleRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<GetValuesWeeklyScheduleRepository>(
      GetValuesWeeklyScheduleRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
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

    mockPrisma.obras.findMany.mockResolvedValue(mockQueryResponse);

    const result = await repository.getValues(filters);

    expect(result).toEqual(mockQueryResponse);
    expect(mockPrisma.obras.findMany).toHaveBeenCalledWith({
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
        id_status: { not: 3 },
        municipios: { id_regional: undefined },
        id_gpm: undefined,
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
      idGrupo: [1],
      idMunicipio: [1],
      idParceira: [1],
      idRegional: [1],
      idTipo: [1],
    };

    mockPrisma.obras.findMany.mockResolvedValue(mockQueryResponse);

    const result = await repository.getValues(filters);

    expect(result).toEqual(mockQueryResponse);
    expect(mockPrisma.obras.findMany).toHaveBeenCalledWith({
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
        id_status: { not: 3 },
        municipios: { id_regional: { in: [1] } },
        id_gpm: { in: [1] },
        id_turma: { in: [1] },
        id_tipo: { in: [1] },
        tipos: { id_grupo: { in: [1] } },
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
