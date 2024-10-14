import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { GetTotalValuesScheduleService } from 'src/modules/schedule/services/getTotalValuesSchedule.service';

describe('GetTotalValuesScheduleService', () => {
  let prisma: PrismaService;
  let service: GetTotalValuesScheduleService;

  const initialQuery = `SELECT turma, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 1 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS jan_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 1 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS jan_exec, 
  SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 2 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS fev_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 2 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS fev_exec,  
  SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 3 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS mar_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 3 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS mar_exec,  
  SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 4 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS abr_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 4 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS abr_exec,  
  SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 5 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS mai_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 5 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS mai_exec,  
  SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 6 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS jun_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 6 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS jun_exec,  
  SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 7 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS jul_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 7 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS jul_exec,  
  SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 8 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS ago_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 8 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS ago_exec, 
  SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 9 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS set_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 9 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS set_exec,  
  SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 10 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS out_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 10 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS out_exec,  
  SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 11 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS nov_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 11 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS nov_exec,  
  SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 12 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS dez_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 12 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS dez_exec,  
  SUM(COALESCE(mo_final, mo_planejada)*prog/100) AS total_prog, SUM(COALESCE(mo_final, mo_planejada)*exec/100) AS total_exec, EXTRACT(YEAR FROM data_prog) AS ano  
  FROM construcao_sp.obras INNER JOIN construcao_sp.programacoes ON programacoes.id_obra = obras.id INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm
  INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo INNER JOIN construcao_sp.grupos ON grupos.id = tipos.id_grupo
  WHERE 1=1`;

  let expectedQuery: string;

  const mockResponseQuery = [
    {
      turma: 'COMPEL',
      jan_prog: 1391543.3200890007,
      jan_exec: 888399.434949,
      fev_prog: 1055475.1537599994,
      fev_exec: 915527.9687599996,
      mar_prog: 1138471.1047400003,
      mar_exec: 825064.4695300002,
      abr_prog: 920539.8466199996,
      abr_exec: 827996.7924,
      mai_prog: 1221554.39156,
      mai_exec: 705520.8621000001,
      jun_prog: 1098224.7013000003,
      jun_exec: 778519.4827,
      jul_prog: 0,
      jul_exec: 0,
      ago_prog: 0,
      ago_exec: 0,
      set_prog: 0,
      set_exec: 0,
      out_prog: 0,
      out_exec: 0,
      nov_prog: 0,
      nov_exec: 0,
      dez_prog: 0,
      dez_exec: 0,
      total_prog: 6825808.518069001,
      total_exec: 4941029.010438991,
      ano: 2024,
    },
  ];

  const mockResponse = [
    {
      turma: 'COMPEL',
      jan: {
        prog: 1391543.3200890007,
        exec: 888399.434949,
      },
      fev: {
        prog: 1055475.1537599994,
        exec: 915527.9687599996,
      },
      mar: {
        prog: 1138471.1047400003,
        exec: 825064.4695300002,
      },
      abr: {
        prog: 920539.8466199996,
        exec: 827996.7924,
      },
      mai: {
        prog: 1221554.39156,
        exec: 705520.8621000001,
      },
      jun: {
        prog: 1098224.7013000003,
        exec: 778519.4827,
      },
      jul: {
        prog: 0,
        exec: 0,
      },
      ago: {
        prog: 0,
        exec: 0,
      },
      set: {
        prog: 0,
        exec: 0,
      },
      out: {
        prog: 0,
        exec: 0,
      },
      nov: {
        prog: 0,
        exec: 0,
      },
      dez: {
        prog: 0,
        exec: 0,
      },
      total: {
        prog: 6825808.518069001,
        exec: 4941029.010438991,
      },
    },
  ];

  const prismaMock = {
    $queryRaw: jest.fn(),
  };

  beforeEach(async () => {
    expectedQuery = initialQuery;

    const module = await Test.createTestingModule({
      providers: [
        GetTotalValuesScheduleService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    service = module.get<GetTotalValuesScheduleService>(
      GetTotalValuesScheduleService,
    );

    prismaMock.$queryRaw.mockClear();
  });

  it('should return the correct values with filters', async () => {
    const filters = {
      idRegional: undefined,
      idTipo: undefined,
      idParceira: undefined,
      idMunicipio: undefined,
      idCircuito: undefined,
      idGrupo: undefined,
      ano: 2024,
    };

    jest.spyOn(prisma, '$queryRaw').mockResolvedValue(mockResponseQuery);

    expectedQuery = `${expectedQuery} AND EXTRACT(YEAR FROM data_prog) = 
    GROUP BY turma, EXTRACT(YEAR FROM data_prog) ORDER BY turma;`;

    const result = await service.getTotalValues(filters);

    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

    const queryStrings = prismaMock.$queryRaw.mock.calls[0][0].strings;
    const allPartsPresent = queryStrings.every((part) =>
      normalize(expectedQuery).includes(normalize(part)),
    );

    expect(result).toEqual(mockResponse);
    expect(prismaMock.$queryRaw.mock.calls[0][0].values).toStrictEqual([2024]);
    expect(allPartsPresent).toBeTruthy();
  });

  it('should return the correct values with filters', async () => {
    const filters = {
      idRegional: 1,
      idTipo: 1,
      idParceira: 1,
      idMunicipio: 1,
      idCircuito: 1,
      idGrupo: 1,
      ano: 2024,
    };

    jest.spyOn(prisma, '$queryRaw').mockResolvedValue(mockResponseQuery);

    expectedQuery = `${expectedQuery} AND municipios.id_regional = 
    AND id_tipo = 
    AND id_turma = 
    AND tipos.id_grupo = 
    AND municipios.id = 
    AND id_circuito = 
    AND EXTRACT(YEAR FROM data_prog) = 
    GROUP BY turma, EXTRACT(YEAR FROM data_prog) ORDER BY turma;`;

    const result = await service.getTotalValues(filters);

    const normalize = (str: string) => str.replace(/\s+/g, ' ').trim();

    const queryStrings = prismaMock.$queryRaw.mock.calls[0][0].strings;
    const allPartsPresent = queryStrings.every((part) =>
      normalize(expectedQuery).includes(normalize(part)),
    );

    expect(result).toEqual(mockResponse);
    expect(prismaMock.$queryRaw.mock.calls[0][0].values).toStrictEqual([
      1, 1, 1, 1, 1, 1, 2024,
    ]);
    expect(allPartsPresent).toBeTruthy();
  });
});
