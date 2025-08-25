import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetScheduleValuesRepository } from 'src/infra/repositories/schedule/getScheduleValuesRepository';
import * as moment from 'moment';

describe('GetScheduleValuesRepository', () => {
  let repository: GetScheduleValuesRepository;

  const mockPrisma = {
    $queryRaw: jest.fn(),
  };

  function normalizeSQL(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim();
  }

  const mockQueryResponse = [
    {
      id: 9045,
      ovnota: '12398586',
      ordemdiagrama: '170000002955',
      diagrama: null,
      mun: 'MCR',
      prazo_fim: '2024-03-30T00:00:00.000Z',
      tipo_obra: 'POSTE',
      qtde_planejada: 1,
      mo_planejada: 3262.21,
      turma: 'LIG',
      executado: 0,
      entrada: '2024-08-01T00:00:00.000Z',
      data_prog: '2024-10-01T00:00:00.000Z',
      prog: 100,
      exec: null,
      observ_programacao: 'DESLIGAR BF-524904',
      mo_prog: 3262.21,
      mo_exec: 3262.21,
      num_dp: '15563352',
      hora_ini: '1970-01-01T14:30:00.000Z',
      hora_ter: '1970-01-01T17:30:00.000Z',
      equipe_linha_morta: 1,
      equipe_linha_viva: 1,
      equipe_regularizacao: 0,
      id_tecnico: 1,
    },
  ];

  const mockCount = [
    {
      total_obras: 1,
      total_mo_planejada: 3262.21,
      total_mo_exec: 0,
      total_qtde_planejada: 1,
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetScheduleValuesRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<GetScheduleValuesRepository>(
      GetScheduleValuesRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return the correct values without filters', async () => {
    const filters = {
      data: '01/10/2024',
      tipoFiltro: 'day',
      executado: false,
      idGrupo: undefined,
      idMunicipio: undefined,
      idParceira: undefined,
      idRegional: undefined,
      idTipo: undefined,
      ovnota: undefined,
    };

    mockPrisma.$queryRaw
      .mockResolvedValueOnce(mockQueryResponse)
      .mockResolvedValueOnce(mockCount);

    const expectedQuery = `SELECT obras.id, ovnota, COALESCE(diagrama, ordem_dci, ordem_dcim) AS ordemdiagrama, diagrama, mun, entrada, entrada + prazo AS prazo_fim, tipo_obra, qtde_planejada,
    mo_planejada, turma, executado, data_prog, prog, exec, mo_planejada*prog/100 AS mo_prog, mo_planejada*COALESCE(exec, 100)/100 AS mo_exec,
    num_dp, hora_ini, hora_ter, equipe_linha_morta, equipe_linha_viva, equipe_regularizacao, tecnico, conjunto, circuito, status_programacao
    FROM construcao_sp.obras
    INNER JOIN construcao_sp.circuitos ON circuitos.id = obras.id_circuito
    INNER JOIN construcao_sp.conjuntos ON conjuntos.id = circuitos.id_conjunto
    INNER JOIN construcao_sp.programacoes ON programacoes.id_obra = obras.id
    INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm
    INNER JOIN construcao_sp.regionais ON regionais.id = municipios.id_regional
    INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo
    INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma
    INNER JOIN construcao_sp.tecnicos ON tecnicos.id = programacoes.id_tecnico
    INNER JOIN construcao_sp.status_programacao ON status_programacao.id = programacoes.id_status_programacao
    WHERE 1=1 AND data_prog =  AND exec IS NULL ORDER BY data_prog, ovnota`;

    const result = await repository.getValues(filters);

    const querySent = mockPrisma.$queryRaw.mock.calls[0][0];

    const expectedDate = moment('01/10/2024', 'DD/MM/YYYY', true).toDate();

    expect(result).toEqual({
      works: mockQueryResponse,
      resultTotals: mockCount,
    });
    expect(normalizeSQL(querySent.strings.join(''))).toContain(
      normalizeSQL(expectedQuery),
    );
    expect(querySent.values).toEqual([expectedDate]);
  });

  it('should return the correct values with filters', async () => {
    const filters = {
      data: '10/2024',
      tipoFiltro: 'month',
      executado: true,
      idGrupo: [1],
      idMunicipio: [1],
      idParceira: [1],
      idRegional: [1],
      idTipo: [1],
      ovnota: '1324',
    };

    mockPrisma.$queryRaw
      .mockResolvedValueOnce(mockQueryResponse)
      .mockResolvedValueOnce(mockCount);

    const expectedQuery = `SELECT obras.id, ovnota, COALESCE(diagrama, ordem_dci, ordem_dcim) AS ordemdiagrama, diagrama, mun, entrada, entrada + prazo AS prazo_fim, tipo_obra, qtde_planejada,
      mo_planejada, turma, executado, data_prog, prog, exec, mo_planejada*prog/100 AS mo_prog, mo_planejada*COALESCE(exec, 100)/100 AS mo_exec,
      num_dp, hora_ini, hora_ter, equipe_linha_morta, equipe_linha_viva, equipe_regularizacao, tecnico, conjunto, circuito, status_programacao
      FROM construcao_sp.obras
      INNER JOIN construcao_sp.circuitos ON circuitos.id = obras.id_circuito
      INNER JOIN construcao_sp.conjuntos ON conjuntos.id = circuitos.id_conjunto
      INNER JOIN construcao_sp.programacoes ON programacoes.id_obra = obras.id
      INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm
      INNER JOIN construcao_sp.regionais ON regionais.id = municipios.id_regional
      INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo
      INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma
      INNER JOIN construcao_sp.tecnicos ON tecnicos.id = programacoes.id_tecnico
      INNER JOIN construcao_sp.status_programacao ON status_programacao.id = programacoes.id_status_programacao
      WHERE 1=1 
      AND EXTRACT(MONTH FROM data_prog) = 
      AND EXTRACT(YEAR FROM data_prog) = 
      AND municipios.id_regional IN ()
      AND municipios.id IN ()
      AND id_tipo IN ()
      AND id_turma IN ()
      AND tipos.id_grupo IN ()
      AND obras.ovnota = 
      AND exec <> 0
      ORDER BY data_prog, ovnota
      `;

    const result = await repository.getValues(filters);

    const querySent = mockPrisma.$queryRaw.mock.calls[0][0];

    const month = parseInt(filters.data?.split('/')[0]);
    const year = parseInt(filters.data?.split('/')[1]);

    expect(result).toEqual({
      works: mockQueryResponse,
      resultTotals: mockCount,
    });
    expect(normalizeSQL(querySent.strings.join(''))).toContain(
      normalizeSQL(expectedQuery),
    );
    expect(querySent.values).toEqual([month, year, 1, 1, 1, 1, 1, '1324']);
  });
});
