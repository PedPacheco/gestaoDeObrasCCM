import { Test } from '@nestjs/testing';
import { GetWorksDTO } from 'src/config/dto/worksDto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { GetWorksInPortfolioService } from 'src/modules/works/services/getWorksInPortfolio.service';

describe('GetWorksInPortfolioService', () => {
  let prismaService: PrismaService;
  let getWorksInPortfolioService: GetWorksInPortfolioService;

  const mockPrismaService = {
    $queryRaw: jest.fn(),
  };

  const mockResponse = [
    {
      id: 5773,
      ovnota: '12791121',
      ordemdiagrama: '170000004644',
      ordem_dca: null,
      ordem_dcd: '190000005626',
      ordem_dcim: null,
      status_ov_sap: 20,
      pep: 'X/004604',
      executado: 45,
      mun: 'SJC',
      id_status: 35,
      entrada: '2023-04-11T00:00:00.000Z',
      prazo: 90,
      prazo_fim: new Date('2023-07-10'),
      abrev_regional: 'SJC',
      tipo_obra: 'SPACER CABLE',
      qtde_planejada: 0.732,
      contagem_ocorrencias: 1,
      qtde_pend: 0.73161,
      circuito: 'CAC-1302',
      mo_planejada: 68339.6952,
      first_data_prog: '2024-09-19T00:00:00.000Z',
      status: 'PROGRAMADO',
      hora_ini: '1970-01-01T08:00:00.000Z',
      hora_ter: '1970-01-01T17:00:00.000Z',
      tipo_servico: 'OBRA LIVRE',
      chi: 0,
      conjunto: 'CAÇAPAVA',
      equipe_linha_morta: 12,
      equipe_linha_viva: 3,
      equipe_regularizacao: 0,
      data_empreitamento: '2024-08-06T00:00:00.000Z',
      empreendimento: null,
      turma: 'ENGELMIG',
    },
    {
      id: 5773,
      ovnota: '12791121',
      ordemdiagrama: '170000004644',
      ordem_dca: null,
      ordem_dcd: '190000005626',
      ordem_dcim: null,
      status_ov_sap: 20,
      pep: 'X/004604',
      executado: 45,
      mun: 'SJC',
      id_status: 4,
      entrada: '2023-04-11T00:00:00.000Z',
      prazo: 90,
      prazo_fim: new Date('2023-07-10'),
      abrev_regional: 'SJC',
      tipo_obra: 'SPACER CABLE',
      qtde_planejada: 0.732,
      contagem_ocorrencias: 1,
      qtde_pend: 0.73161,
      circuito: 'CAC-1302',
      mo_planejada: 68339.6952,
      first_data_prog: '2024-09-19T00:00:00.000Z',
      status: 'PROGRAMADO',
      hora_ini: '1970-01-01T08:00:00.000Z',
      hora_ter: '1970-01-01T17:00:00.000Z',
      tipo_servico: 'OBRA LIVRE',
      chi: 0,
      conjunto: 'CAÇAPAVA',
      equipe_linha_morta: 12,
      equipe_linha_viva: 3,
      equipe_regularizacao: 0,
      data_empreitamento: '2024-08-06T00:00:00.000Z',
      empreendimento: null,
      turma: 'ENGELMIG',
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetWorksInPortfolioService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    prismaService = module.get<PrismaService>(PrismaService);
    getWorksInPortfolioService = module.get<GetWorksInPortfolioService>(
      GetWorksInPortfolioService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(getWorksInPortfolioService).toBeDefined();
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

    mockPrismaService.$queryRaw.mockResolvedValue(mockResponse);

    const result =
      await getWorksInPortfolioService.getWorksInPortfolio(filters);

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
      'AND EXTRACT(MONTH FROM first_data_prog) = ',
    );
    expect(result[0]).toEqual({
      ...mockResponse[0],
      total_obras: 2,
      total_mo_executada: 61505.72568,
      total_mo_suspensa: 30752.86284,
      total_mo_planejada: 136679.3904,
      total_qtde_planejada: 1.464,
      total_qtde_pend: 1.46322,
    });
  });

  it('should apply multiple filters correctly and day filter', async () => {
    const filters: GetWorksDTO = {
      data: '04/09/2024',
      tipoFiltro: 'day',
      idRegional: null,
      idMunicipio: null,
      idGrupo: null,
      idTipo: null,
      idParceira: null,
      idStatus: null,
      idConjunto: null,
      idCircuito: null,
      idEmpreendimento: null,
      idOvnota: null,
    };

    mockPrismaService.$queryRaw.mockResolvedValue(mockResponse);

    await getWorksInPortfolioService.getWorksInPortfolio(filters);

    const calledQuery = mockPrismaService.$queryRaw.mock.calls[0][0];

    expect(prismaService.$queryRaw).toHaveBeenCalled();
    expect(calledQuery.strings[0]).toContain('AND first_data_prog = ');
  });
});
