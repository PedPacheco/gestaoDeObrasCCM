import { Test } from '@nestjs/testing';
import { GetWorksDTO } from 'src/config/dto/worksDto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { GetCompletedWorksService } from 'src/modules/works/services/getCompletedWorks.service';

describe('GetCompletedWorksService', () => {
  let prismaService: PrismaService;
  let getCompletedWorksService: GetCompletedWorksService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetCompletedWorksService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    getCompletedWorksService = module.get<GetCompletedWorksService>(
      GetCompletedWorksService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(getCompletedWorksService).toBeDefined();
  });

  it('should apply multiple filters correctly and month filter', async () => {
    const filters: GetWorksDTO = {
      data: '09/2024',
      tipoFiltro: 'month',
      idRegional: 1,
      idTipo: 2,
      idParceira: 3,
      idGrupo: 4,
      idMunicipio: 5,
      idStatus: 6,
      idCircuito: 7,
      idConjunto: 8,
      idEmpreendimento: 9,
      idOvnota: 10,
    };

    const mockQuery = [
      { id: 1, ovnota: '123', mo_planejada: 3454.0, qtde_planejada: 4 },
    ];

    const mockResult = [
      {
        id: 1,
        ovnota: '123',
        mo_planejada: 3454.0,
        qtde_planejada: 4,
        total_mo_planejada: 3454.0,
        total_obras: 1,
        total_qtde_planejada: 4,
      },
    ];

    mockPrismaService.$queryRaw.mockResolvedValue(mockQuery);

    const result = await getCompletedWorksService.getCompletedWorks(filters);

    const calledQuery = mockPrismaService.$queryRaw.mock.calls[0][0];

    expect(mockPrismaService.$queryRaw).toHaveBeenCalled();
    expect(calledQuery.strings[0]).toContain('AND municipios.id_regional = ');
    expect(calledQuery.strings[1]).toContain('AND id_tipo = ');
    expect(calledQuery.strings[2]).toContain('AND id_turma = ');
    expect(calledQuery.strings[3]).toContain('AND tipos.id_grupo = ');
    expect(calledQuery.strings[4]).toContain('AND municipios.id = ');
    expect(calledQuery.strings[5]).toContain('AND status.id = ');
    expect(calledQuery.strings[6]).toContain('AND id_circuito = ');
    expect(calledQuery.strings[7]).toContain('AND circuitos.id_conjunto = ');
    expect(calledQuery.strings[8]).toContain('AND id_empreendimento = ');
    expect(calledQuery.strings[9]).toContain('AND id = ');
    expect(calledQuery.strings[10]).toContain(
      'AND EXTRACT(MONTH FROM data_conclusao) = ',
    );
    expect(result).toEqual(mockResult);
  });

  it('should apply multiple filters correctly and day filter', async () => {
    const filters: GetWorksDTO = {
      data: '04/09/2024',
      tipoFiltro: 'day',
      idRegional: 1,
      idTipo: 2,
      idParceira: 3,
      idGrupo: 4,
      idMunicipio: 5,
      idStatus: 6,
      idCircuito: 7,
      idConjunto: 8,
      idEmpreendimento: 9,
      idOvnota: 10,
    };

    const mockQuery = [
      { id: 1, ovnota: '123', mo_planejada: 3454.0, qtde_planejada: 4 },
    ];

    const mockResult = [
      {
        id: 1,
        ovnota: '123',
        mo_planejada: 3454.0,
        qtde_planejada: 4,
        total_mo_planejada: 3454.0,
        total_obras: 1,
        total_qtde_planejada: 4,
      },
    ];

    mockPrismaService.$queryRaw.mockResolvedValue(mockQuery);

    const result = await getCompletedWorksService.getCompletedWorks(filters);

    const calledQuery = mockPrismaService.$queryRaw.mock.calls[0][0];

    expect(prismaService.$queryRaw).toHaveBeenCalled();
    expect(calledQuery.strings[0]).toContain('AND municipios.id_regional = ');
    expect(calledQuery.strings[1]).toContain('AND id_tipo = ');
    expect(calledQuery.strings[2]).toContain('AND id_turma = ');
    expect(calledQuery.strings[3]).toContain('AND tipos.id_grupo = ');
    expect(calledQuery.strings[4]).toContain('AND municipios.id = ');
    expect(calledQuery.strings[5]).toContain('AND status.id = ');
    expect(calledQuery.strings[6]).toContain('AND id_circuito = ');
    expect(calledQuery.strings[7]).toContain('AND circuitos.id_conjunto = ');
    expect(calledQuery.strings[8]).toContain('AND id_empreendimento = ');
    expect(calledQuery.strings[9]).toContain('AND id = ');
    expect(calledQuery.strings[10]).toContain('AND data_conclusao = ');

    expect(result).toEqual(mockResult);
  });
});
