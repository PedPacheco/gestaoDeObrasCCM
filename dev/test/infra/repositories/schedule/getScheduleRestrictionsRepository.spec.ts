import { Test } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetScheduleRestrictionsRespository } from 'src/infra/repositories/schedule/getScheduleRestrictionsRepository';
import { GetValueWeeklyScheduleDTO } from 'src/interface/dtos/scheduleDTO';
import { GetScheduleRestrictions } from 'src/interface/types/schedule/getScheduleRestrictionsInterface';
import * as moment from 'moment';

describe('GetScheduleRestrictions', () => {
  let repository: GetScheduleRestrictionsRespository;

  const mockPrisma = {
    $queryRaw: jest.fn(),
  };

  function normalizeSQL(sql: string): string {
    return sql.replace(/\s+/g, ' ').trim();
  }

  const mockResponseQuery: GetScheduleRestrictions[] = [
    {
      id: 1695,
      ovnota: '3908435',
      diagrama: null,
      ordem_dci: null,
      ordem_dcim: null,
      executado: 98,
      prog_id: 1,
      data_prog: new Date('2024-08-03T00:00:00.000Z'),
      prog: 0,
      exec: 0,
      observacao_restricao: null,
      id_restricao_prog1: 1,
      restricao1: 'Aviso',
      responsabilidade1: null,
      nome_responsavel: null,
      area_responsavel1: null,
      status_restricao1: null,
      data_resolucao1: null,
      id_restricao_prog2: 1,
      restricao2: 'Aviso',
      responsabilidade2: null,
      nome_responsavel2: null,
      area_responsavel2: null,
      status_restricao2: null,
      data_resolucao2: null,
      mun: 'SJC',
      tipo_obra: 'REMOÇÃO DE REDE',
      parceira: 'ENGELMIG',
    },
    {
      id: 1695,
      ovnota: '3908435',
      diagrama: null,
      ordem_dci: null,
      ordem_dcim: null,
      executado: 98,
      prog_id: 1,
      data_prog: new Date('2024-08-04T00:00:00.000Z'),
      prog: 0,
      exec: 0,
      observacao_restricao: null,
      id_restricao_prog1: 1,
      restricao1: 'Aviso',
      responsabilidade1: null,
      nome_responsavel: null,
      area_responsavel1: null,
      status_restricao1: null,
      data_resolucao1: null,
      id_restricao_prog2: 1,
      restricao2: 'Aviso',
      responsabilidade2: null,
      nome_responsavel2: null,
      area_responsavel2: null,
      status_restricao2: null,
      data_resolucao2: null,
      mun: 'SJC',
      tipo_obra: 'REMOÇÃO DE REDE',
      parceira: 'ENGELMIG',
    },
  ];

  const mockCount = [
    {
      total_obras: 2,
    },
  ];

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetScheduleRestrictionsRespository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<GetScheduleRestrictionsRespository>(
      GetScheduleRestrictionsRespository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GetRestrictions', () => {
    it('should return the correct values without filters', async () => {
      const filters: GetValueWeeklyScheduleDTO = {
        dataInicial: null,
        dataFinal: null,
        executado: false,
        idGrupo: undefined,
        idMunicipio: undefined,
        idParceira: undefined,
        idRegional: undefined,
        idTipo: undefined,
        page: 0,
      };

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockResponseQuery)
        .mockResolvedValueOnce(mockCount);

      const expectedQuery = `SELECT 
        obras.id,
        obras.ovnota,
        obras.diagrama,
        obras.ordem_dci,
        obras.ordem_dcim,
        obras.executado,
        municipios.mun,
        tipos.tipo_obra,
        turmas.turma as parceira,
        programacoes.id AS prog_id,
        programacoes.data_prog,
        programacoes.prog,
        programacoes.exec,
        programacoes.observacao_restricao,
        programacoes.id_restricao_prog1,
        restr1.restricao AS restricao1,
        programacoes.responsabilidade1,
        programacoes.nome_responsavel,
        programacoes.area_responsavel1,
        programacoes.status_restricao1,
        programacoes.data_resolucao1,
        programacoes.id_restricao_prog2,
        restr2.restricao AS restricao2,
        programacoes.responsabilidade2,
        programacoes.nome_responsavel2,
        programacoes.area_responsavel2,
        programacoes.status_restricao2,
        programacoes.data_resolucao2
        FROM construcao_sp.obras
        INNER JOIN construcao_sp.programacoes 
          ON programacoes.id_obra = obras.id
        INNER JOIN construcao_sp.municipios 
          ON municipios.id = obras.id_gpm
        INNER JOIN construcao_sp.tipos 
          ON tipos.id = obras.id_tipo
        INNER JOIN construcao_sp.turmas 
          ON turmas.id = obras.id_turma
        INNER JOIN construcao_sp.restricoes AS restr1
          ON restr1.id = programacoes.id_restricao_prog1
        INNER JOIN construcao_sp.restricoes AS restr2
          ON restr2.id = programacoes.id_restricao_prog2
        WHERE 1=1 AND programacoes.exec IS NULL
        ORDER BY programacoes.data_prog, obras.ovnota
        LIMIT OFFSET 
            `;

      const result = await repository.getRestrictions(filters);

      const querySent = mockPrisma.$queryRaw.mock.calls[0][0];

      expect(result).toEqual({
        works: mockResponseQuery,
        totals: mockCount,
      });
      expect(normalizeSQL(querySent.strings.join(''))).toContain(
        normalizeSQL(expectedQuery),
      );
      expect(querySent.values).toEqual([200, 0]);
    });

    it('should return the correct values with filters', async () => {
      const filters: GetValueWeeklyScheduleDTO = {
        dataInicial: '01/09/2024',
        dataFinal: '02/09/2024',
        executado: true,
        idGrupo: [1],
        idMunicipio: [1],
        idParceira: [1],
        idRegional: [1],
        idTipo: [1],
        page: 0,
      };

      mockPrisma.$queryRaw
        .mockResolvedValueOnce(mockResponseQuery)
        .mockResolvedValueOnce(mockCount);

      const expectedQuery = `SELECT 
        obras.id,
        obras.ovnota,
        obras.diagrama,
        obras.ordem_dci,
        obras.ordem_dcim,
        obras.executado,
        municipios.mun,
        tipos.tipo_obra,
        turmas.turma as parceira,
        programacoes.id AS prog_id,
        programacoes.data_prog,
        programacoes.prog,
        programacoes.exec,
        programacoes.observacao_restricao,
        programacoes.id_restricao_prog1,
        restr1.restricao AS restricao1,
        programacoes.responsabilidade1,
        programacoes.nome_responsavel,
        programacoes.area_responsavel1,
        programacoes.status_restricao1,
        programacoes.data_resolucao1,
        programacoes.id_restricao_prog2,
        restr2.restricao AS restricao2,
        programacoes.responsabilidade2,
        programacoes.nome_responsavel2,
        programacoes.area_responsavel2,
        programacoes.status_restricao2,
        programacoes.data_resolucao2
        FROM construcao_sp.obras
        INNER JOIN construcao_sp.programacoes 
          ON programacoes.id_obra = obras.id
        INNER JOIN construcao_sp.municipios 
          ON municipios.id = obras.id_gpm
        INNER JOIN construcao_sp.tipos 
          ON tipos.id = obras.id_tipo
        INNER JOIN construcao_sp.turmas 
          ON turmas.id = obras.id_turma
        INNER JOIN construcao_sp.restricoes AS restr1
          ON restr1.id = programacoes.id_restricao_prog1
        INNER JOIN construcao_sp.restricoes AS restr2
          ON restr2.id = programacoes.id_restricao_prog2
        WHERE 1=1 AND programacoes.data_prog BETWEEN AND 
        AND programacoes.exec IS NOT NULL
        AND municipios.id_regional IN ()
        AND municipios.id IN ()
        AND obras.id_tipo IN ()
        AND obras.id_turma IN ()
        AND tipos.id_grupo IN ()
        ORDER BY programacoes.data_prog, obras.ovnota
        LIMIT OFFSET 
            `;

      const result = await repository.getRestrictions(filters);

      const querySent = mockPrisma.$queryRaw.mock.calls[0][0];

      const expectedInitialDate = moment(
        '01/09/2024',
        'DD/MM/YYYY',
        true,
      ).toDate();

      const expectedEndDate = moment('02/09/2024', 'DD/MM/YYYY', true).toDate();

      expect(result).toEqual({
        works: mockResponseQuery,
        totals: mockCount,
      });
      expect(normalizeSQL(querySent.strings.join(''))).toContain(
        normalizeSQL(expectedQuery),
      );
      expect(querySent.values).toEqual([
        expectedInitialDate,
        expectedEndDate,
        1,
        1,
        1,
        1,
        1,
        200,
        0,
      ]);
    });
  });
});
