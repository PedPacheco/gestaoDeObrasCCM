import { Test } from '@nestjs/testing';
import { obras } from '@prisma/client';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { GetPendingScheduleValuesService } from 'src/modules/schedule/services/getPendingScheduleValues.service';

describe('GetPendingScheduleValues', () => {
  let prisma: PrismaService;
  let service: GetPendingScheduleValuesService;

  const prismaMock = {
    $queryRaw: jest.fn(),
  };

  const mockResponse = [
    {
      id: 17856,
      ovnota: '15296621',
      ordemdiagrama: '170000015492',
      diagrama: null,
      mun: 'TAU',
      entrada: '2024-06-25T00:00:00.000Z',
      tipo_obra: 'SPACER CABLE',
      qtde_planejada: 0.49208,
      mo_planejada: 57599.1411,
      turma: 'START-TAU',
      executado: 85,
      data_prog: '2024-09-09T00:00:00.000Z',
      prog: 3,
      exec: null,
      observ_programacao: 'LIVRE',
      mo_prog: 1727.974233,
      mo_exec: 0,
    } as unknown as obras,
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetPendingScheduleValuesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    service = module.get<GetPendingScheduleValuesService>(
      GetPendingScheduleValuesService,
    );

    prismaMock.$queryRaw.mockClear();
  });

  it('should return the correct values without filters', async () => {
    const filters = {
      idParceira: undefined,
      idRegional: undefined,
    };

    jest.spyOn(prisma, '$queryRaw').mockResolvedValue(mockResponse);

    const result = await service.getValues(filters);

    const expectedQuery = `SELECT obras.id, ovnota, COALESCE(diagrama, COALESCE(ordem_dci, ordem_dcim)) AS ordemdiagrama, diagrama, mun, entrada, tipo_obra, qtde_planejada, mo_planejada, turma,
    executado, data_prog, prog, observ_programacao, mo_planejada*prog/100 AS mo_prog
    FROM construcao_sp.obras
    INNER JOIN construcao_sp.programacoes ON programacoes.id_obra = obras.id
    INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm
    INNER JOIN construcao_sp.regionais ON regionais.id = municipios.id_regional
    INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo
    INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma
    WHERE exec IS NULL AND data_prog < CURRENT_DATE ORDER BY data_prog`;

    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

    expect(result).toEqual(mockResponse);
    expect(prismaMock.$queryRaw.mock.calls[0][0].values).toEqual([]);
    expect(normalize(prismaMock.$queryRaw.mock.calls[0][0].strings[0])).toEqual(
      normalize(expectedQuery),
    );
  });

  it('should return the correct values with filters', async () => {
    const filters = {
      idParceira: 1,
      idRegional: 1,
    };

    jest.spyOn(prisma, '$queryRaw').mockResolvedValue(mockResponse);

    const result = await service.getValues(filters);

    const expectedQuery = `SELECT obras.id, ovnota, COALESCE(diagrama, COALESCE(ordem_dci, ordem_dcim)) AS ordemdiagrama, diagrama, mun, entrada, tipo_obra, qtde_planejada, mo_planejada, turma,
    executado, data_prog, prog, observ_programacao, mo_planejada*prog/100 AS mo_prog
    FROM construcao_sp.obras
    INNER JOIN construcao_sp.programacoes ON programacoes.id_obra = obras.id
    INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm
    INNER JOIN construcao_sp.regionais ON regionais.id = municipios.id_regional
    INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo
    INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma
    WHERE exec IS NULL AND data_prog < CURRENT_DATE
    AND id_turma = 
    AND AND municipios.id_regional = 
    ORDER BY data_prog`;

    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

    const queryStrings = prismaMock.$queryRaw.mock.calls[0][0].strings;
    const allPartsPresent = queryStrings.every((part) =>
      normalize(expectedQuery).includes(normalize(part)),
    );

    expect(result).toEqual(mockResponse);
    expect(prismaMock.$queryRaw.mock.calls[0][0].values).toEqual([1, 1]);
    expect(allPartsPresent).toBeTruthy();
  });
});
