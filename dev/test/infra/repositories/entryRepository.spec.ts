import { Test, TestingModule } from '@nestjs/testing';
import { obras } from '@prisma/client';
import moment from 'moment';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { EntryRespository } from 'src/infra/repositories/entryRepository';
import {
  GetEntryOfWorksByDayDTO,
  GetEntryOfWorksDTO,
} from 'src/interface/dtos/entryDto';

describe('EntryRepository', () => {
  const mockPrisma = {
    obras: {
      findMany: jest.fn() as jest.Mock,
    },
  };

  let prisma: typeof mockPrisma;
  let entryRepository: EntryRespository;

  const mockObras = (mo_final: number | null, mo_planejada: number) => [
    {
      ovnota: 'ov1',
      mo_final,
      mo_planejada,
      entrada: new Date('2024-01-15'),
      tipos: {
        tipo_obra: 'Tipo 1',
        grupos: {
          grupo: 'Grupo 1',
        },
      },
    } as unknown as obras,
  ];

  // const mockObrasByDay = [
  //   {
  //     id: 1,
  //     ovnota: '4805886',
  //     pep: 'pep',
  //     diagrama: '200000',
  //     ordem_dci: '162344',
  //     ordem_dcd: '1900998',
  //     ordem_dca: '17088798',
  //     ordem_dcim: '1900886',
  //     entrada: moment('04/09/2024', 'DD/MM/YYYY', true).toDate(),
  //     prazo: 90,
  //     qtde_planejada: 8,
  //     mo_planejada: 100,
  //     tipos: { tipo_obra: 'BTZERO' },
  //     turmas: { turma: 'ENGELMIG' },
  //     municipios: { mun: 'SJC' },
  //   } as unknown as obras,
  // ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EntryRespository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    prisma = module.get(PrismaService);
    entryRepository = module.get<EntryRespository>(EntryRespository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GetValuesFromEntry', () => {
    it('should return correct values with mo_final', async () => {
      const filter: GetEntryOfWorksDTO = {
        idGrupo: [1],
        idMunicipio: [1],
        idParceira: [1],
        idRegional: [1],
        idTipo: [1],
        idCircuito: [1],
        ano: 2024,
      };

      prisma.obras.findMany.mockResolvedValue(mockObras(100, 80));

      const result = await entryRepository.getValuesFromEntry(filter);

      const call = prisma.obras.findMany.mock.calls[0][0];

      expect(result).toEqual(mockObras(100, 80));
      expect(call.where).toMatchObject({
        entrada: {
          gte: new Date(`2024-01-01`),
          lte: new Date(`2024-12-31`),
        },
        id_tipo: { in: [1] },
        id_gpm: { in: [1] },
        id_circuito: { in: [1] },
        id_turma: { in: [1] },
        municipios: { id_regional: { in: [1] } },
        tipos: { id_grupo: { in: [1] } },
      });
    });

    it('should build the query correctly withou values of filters', async () => {
      const filters: GetEntryOfWorksDTO = {
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: undefined,
        idTipo: undefined,
        idCircuito: undefined,
        ano: 2024,
      };

      await entryRepository.getValuesFromEntry(filters);

      const call = prisma.obras.findMany.mock.calls[0][0];

      expect(call.where).toMatchObject({
        entrada: {
          gte: new Date(`2024-01-01`),
          lte: new Date(`2024-12-31`),
        },
        id_tipo: undefined,
        id_gpm: undefined,
        id_circuito: undefined,
        id_turma: undefined,
        municipios: { id_regional: undefined },
        tipos: { id_grupo: undefined },
      });
    });
  });

  describe('GetEntryOfWorksByDay', () => {
    it('should build the query correctly without values of filters', async () => {
      const filters: GetEntryOfWorksByDayDTO = {
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: undefined,
        idTipo: undefined,
        dataInicial: '01/10/2024',
        dataFinal: '02/10/2024',
      };

      const dateRange = {
        gte: moment(filters.dataInicial, 'DD/MM/YYYY').toDate(),
        lte: moment(filters.dataInicial, 'DD/MM/YYYY').toDate(),
      };

      await entryRepository.getEntryOfWorksByDay(filters, dateRange);

      const call = prisma.obras.findMany.mock.calls[0][0];

      expect(call.where).toMatchObject({
        entrada: dateRange,
        id_tipo: undefined,
        id_gpm: undefined,
        id_turma: undefined,
        municipios: { id_regional: undefined },
        tipos: { id_grupo: undefined },
      });
    });

    it('should build the query correctly withou values of filters', async () => {
      const filters: GetEntryOfWorksByDayDTO = {
        idGrupo: [1],
        idMunicipio: [1],
        idParceira: [1],
        idRegional: [1],
        idTipo: [1],
        dataInicial: '01/10/2024',
        dataFinal: '02/10/2024',
      };

      const dateRange = {
        gte: moment(filters.dataInicial, 'DD/MM/YYYY').toDate(),
        lte: moment(filters.dataInicial, 'DD/MM/YYYY').toDate(),
      };

      await entryRepository.getEntryOfWorksByDay(filters, dateRange);

      const call = prisma.obras.findMany.mock.calls[0][0];

      expect(call.where).toMatchObject({
        entrada: dateRange,
        id_tipo: { in: [1] },
        id_gpm: { in: [1] },
        id_turma: { in: [1] },
        municipios: { id_regional: { in: [1] } },
        tipos: { id_grupo: { in: [1] } },
      });
    });
  });
});
