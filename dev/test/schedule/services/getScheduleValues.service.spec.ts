import { Test } from '@nestjs/testing';
import { obras } from '@prisma/client';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { GetScheduleValuesService } from 'src/modules/schedule/services/getScheduleValues.service';
import * as moment from 'moment';

describe('GetScheduleValues', () => {
  let prisma: PrismaService;
  let service: GetScheduleValuesService;

  const prismaMock = {
    $queryRaw: jest.fn(),
  };

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
    } as unknown as obras,
  ];

  const mockResponse = [
    {
      ...mockQueryResponse[0],
      total_obras: 1,
      total_mo_planejada: 3262.21,
      total_qtde_planejada: 1,
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetScheduleValuesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    service = module.get<GetScheduleValuesService>(GetScheduleValuesService);

    prismaMock.$queryRaw.mockClear();
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
    };

    jest.spyOn(prisma, '$queryRaw').mockResolvedValue(mockQueryResponse);

    const result = await service.getValues(filters);

    const expectedDate = moment('01/10/2024', 'DD/MM/YYYY', true).toDate();

    const expectedQuery = `SELECT obras.id, ovnota, COALESCE(diagrama, ordem_dci, ordem_dcim) AS ordemdiagrama, diagrama, mun, entrada, entrada + prazo AS prazo_fim, tipo_obra, qtde_planejada,
    mo_planejada, turma, executado, data_prog, prog, exec, observ_programacao, mo_planejada*prog/100 AS mo_prog, mo_planejada*COALESCE(exec, 100)/100 AS mo_exec, data_prog,
    num_dp, hora_ini, hora_ter, equipe_linha_morta, equipe_linha_viva, equipe_regularizacao, id_tecnico
    FROM construcao_sp.obras
    INNER JOIN construcao_sp.programacoes ON programacoes.id_obra = obras.id
    INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm
    INNER JOIN construcao_sp.regionais ON regionais.id = municipios.id_regional
    INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo
    INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma
    WHERE 1=1
    AND data_prog = 
    AND exec IS NULL
    ORDER BY data_prog, ovnota`;

    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

    const queryStrings = prismaMock.$queryRaw.mock.calls[0][0].strings;
    const allPartsPresent = queryStrings.every((part) =>
      normalize(expectedQuery).includes(normalize(part)),
    );

    expect(result).toEqual(mockResponse);
    expect(prismaMock.$queryRaw.mock.calls[0][0].values[0]).toEqual(
      expectedDate,
    );
    expect(allPartsPresent).toBeTruthy();
  });

  it('should return the correct values with filters', async () => {
    const filters = {
      data: '10/2024',
      tipoFiltro: 'month',
      executado: true,
      idGrupo: 1,
      idMunicipio: 1,
      idParceira: 1,
      idRegional: 1,
      idTipo: 1,
    };

    jest.spyOn(prisma, '$queryRaw').mockResolvedValue(mockQueryResponse);

    const result = await service.getValues(filters);

    const month = parseInt(filters.data?.split('/')[0]);
    const year = parseInt(filters.data?.split('/')[1]);

    const expectedQuery = `SELECT obras.id, ovnota, COALESCE(diagrama, ordem_dci, ordem_dcim) AS ordemdiagrama, diagrama, mun, entrada, entrada + prazo AS prazo_fim, tipo_obra, qtde_planejada,
    mo_planejada, turma, executado, data_prog, prog, exec, observ_programacao, mo_planejada*prog/100 AS mo_prog, mo_planejada*COALESCE(exec, 100)/100 AS mo_exec, data_prog,
    num_dp, hora_ini, hora_ter, equipe_linha_morta, equipe_linha_viva, equipe_regularizacao, id_tecnico
    FROM construcao_sp.obras
    INNER JOIN construcao_sp.programacoes ON programacoes.id_obra = obras.id
    INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm
    INNER JOIN construcao_sp.regionais ON regionais.id = municipios.id_regional
    INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo
    INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma
    WHERE 1=1 
    AND EXTRACT(MONTH FROM data_prog) = 
    AND EXTRACT(YEAR FROM data_prog) = 
    AND municipios.id_regional = 
    AND municipios.id = 
    AND id_tipo = 
    AND id_turma = 
    AND tipos.id_grupo = 
    AND exec <> 0
    ORDER BY data_prog, ovnota`;

    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

    const queryStrings = prismaMock.$queryRaw.mock.calls[0][0].strings;
    const allPartsPresent = queryStrings.every((part) =>
      normalize(expectedQuery).includes(normalize(part)),
    );

    expect(result).toEqual(mockResponse);
    expect(prismaMock.$queryRaw.mock.calls[0][0].values).toStrictEqual([
      month,
      year,
      1,
      1,
      1,
      1,
      1,
    ]);
    expect(allPartsPresent).toBeTruthy();
  });
});
