import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { obras } from '@prisma/client';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { GetWorkDetailsService } from 'src/modules/works/services/getWorkDetails.service';

describe('GetWorkDetailsService', () => {
  let prisma: PrismaService;
  let getWorkDetailsService: GetWorkDetailsService;

  const prismaMock = {
    obras: {
      findFirst: jest.fn(),
    },
  };

  const mockQueryResponse = {
    ovnota: '12791122',
    pep: 'X/004604',
    status_pep: null,
    diagrama: null,
    ordem_dci: '170000004647',
    ordem_dcd: '190000006101',
    ordem_dca: null,
    ordem_dcim: null,
    status_ov_sap: 20,
    status_diagrama: null,
    status_usuario_diagrama: null,
    status_150: null,
    status_usuario_150: null,
    status_170: 'LIB ',
    status_usuario_170: 'PLAR',
    status_180: null,
    status_usuario_180: null,
    status_190: 'LIB ',
    status_usuario_190: 'EXEC',
    entrada: '2023-04-18T00:00:00.000Z',
    prazo: 90,
    data_conclusao: null,
    executado: 45,
    qtde_planejada: 0.772,
    qtde_pend: 0.77165,
    mo_planejada: 89223.8157,
    mo_final: null,
    referencia: '190BF006190439',
    capex_mat_pend: 186326.1654099993,
    capex_mat_plan: 186326.1654099993,
    capex_mo_pend: 64982.8126,
    capex_mo_plan: 74310.44331999999,
    tipo_ads: 'CONVENCIONAL',
    data_empreitamento: '2024-08-06T00:00:00.000Z',
    circuitos: {
      circuito: 'CAC-1302',
    },
    empreendimento: {
      empreendimento: null,
    },
    municipios: {
      municipio: 'MONTEIRO LOBATO',
    },
    tipos: {
      tipo_obra: 'SPACER CABLE',
    },
    turmas: {
      turma: 'ENGELMIG',
    },
    status: {
      status: 'PROGRAMADO',
    },
    programacoes: [
      {
        data_prog: '2024-09-19T00:00:00.000Z',
        hora_ini: '1970-01-01T08:00:00.000Z',
        hora_ter: '1970-01-01T17:00:00.000Z',
        tipo_servico: 'OBRA LIVRE',
        prog: 45,
        exec: null,
        observ_programacao: 'TRECHO LIVRE',
        chi: 0,
        num_dp: null,
        chave_provisoria: false,
        equipe_linha_morta: 12,
        equipe_linha_viva: 3,
        equipe_regularizacao: 0,
        tecnicos: {
          tecnico: 'NÃO DEFINIDO',
        },
        programacoes_restricao_execucao: {
          restricao: null,
        },
        nome_responsavel_execucao: null,
      },
    ],
  } as unknown as obras;

  const response = {
    ovnota: '12791122',
    pep: 'X/004604',
    status_pep: null,
    diagrama: null,
    ordem_dci: '170000004647',
    ordem_dcd: '190000006101',
    ordem_dca: null,
    ordem_dcim: null,
    status_ov_sap: 20,
    status_diagrama: null,
    status_usuario_diagrama: null,
    status_150: null,
    status_usuario_150: null,
    status_170: 'LIB ',
    status_usuario_170: 'PLAR',
    status_180: null,
    status_usuario_180: null,
    status_190: 'LIB ',
    status_usuario_190: 'EXEC',
    entrada: '2023-04-18T00:00:00.000Z',
    prazo: 90,
    data_conclusao: null,
    executado: 45,
    qtde_planejada: 0.772,
    qtde_pend: 0.77165,
    mo_planejada: 89223.8157,
    mo_final: null,
    referencia: '190BF006190439',
    capex_mat_pend: 186326.1654099993,
    capex_mat_plan: 186326.1654099993,
    capex_mo_pend: 64982.8126,
    capex_mo_plan: 74310.44331999999,
    tipo_ads: 'CONVENCIONAL',
    data_empreitamento: '2024-08-06T00:00:00.000Z',
    circuitos: 'CAC-1302',
    empreendimento: null,
    municipios: 'MONTEIRO LOBATO',
    tipos: 'SPACER CABLE',
    turmas: 'ENGELMIG',
    status: 'PROGRAMADO',
    programacoes: [
      {
        data_prog: '2024-09-19T00:00:00.000Z',
        hora_ini: '1970-01-01T08:00:00.000Z',
        hora_ter: '1970-01-01T17:00:00.000Z',
        tipo_servico: 'OBRA LIVRE',
        prog: 45,
        exec: null,
        observ_programacao: 'TRECHO LIVRE',
        chi: 0,
        num_dp: null,
        chave_provisoria: false,
        equipe_linha_morta: 12,
        equipe_linha_viva: 3,
        equipe_regularizacao: 0,
        tecnico: 'NÃO DEFINIDO',
        restricao: null,
        nome_responsavel_execucao: null,
      },
    ],
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetWorkDetailsService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    getWorkDetailsService = module.get<GetWorkDetailsService>(
      GetWorkDetailsService,
    );
  });

  it('should be defined', () => {
    expect(getWorkDetailsService).toBeDefined();
  });

  it('should be return undefined when searching for id if the id value is greater than or equal to 12', async () => {
    const id = 4552432432432;

    jest.spyOn(prisma.obras, 'findFirst').mockResolvedValue(null);

    await expect(getWorkDetailsService.get(id)).rejects.toThrow(
      new NotFoundException('Obra não encontrada'),
    );
  });

  it('should be return the work details with format correct', async () => {
    const id = 244;

    jest.spyOn(prisma.obras, 'findFirst').mockResolvedValue(mockQueryResponse);

    const result = await getWorkDetailsService.get(id);

    expect(result).toEqual(response);
  });
});
