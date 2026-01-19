import { Test } from '@nestjs/testing';
import { afterEach } from 'node:test';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetWorksDetailsRepository } from 'src/infra/repositories/works/getWorksDetailsRepository';

describe('GetWorksDetailsRepository', () => {
  let repository: GetWorksDetailsRepository;

  const mockPrisma = {
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
      conjuntos: { conjunto: 'São josé' },
    },
    empreendimento: {
      empreendimento: null,
    },
    municipios: {
      municipio: 'MONTEIRO LOBATO',
      regionais: { id: 1 },
    },
    tipos: {
      tipo_obra: 'SPACER CABLE',
      id_grupo: 2,
    },
    id_turma: 1,
    id_status: 5,
    programacoes: [
      {
        data_prog: '2024-09-19T00:00:00.000Z',
        hora_ini: '1970-01-01T08:00:00.000Z',
        hora_ter: '1970-01-01T17:00:00.000Z',
        tipo_servico: 'OBRA LIVRE',
        prog: 45,
        exec: null,
        equip_desligado: 'TRECHO LIVRE',
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
        validada: true,
        confirmada: true,
        reprovada: true,
        status_programacao: {
          status_programacao: 3,
        },
      },
    ],
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetWorksDetailsRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<GetWorksDetailsRepository>(
      GetWorksDetailsRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Get', () => {
    it('should be return undefined when searching for id if the id value is greater than or equal to 12', async () => {
      const id = 4552432432432;

      mockPrisma.obras.findFirst.mockResolvedValue(null);

      const response = await repository.get(id);

      expect(response).toBeNull();
      expect(mockPrisma.obras.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { id: undefined },
            { ovnota: id.toString() },
            { ordem_dci: id.toString() },
            { ordem_dcd: id.toString() },
            { ordem_dca: id.toString() },
            { ordem_dcim: id.toString() },
            { diagrama: id.toString() },
          ],
        },
        select: {
          id: true,
          ovnota: true,
          pep: true,
          status_pep: true,
          diagrama: true,
          ordem_dci: true,
          ordem_dcd: true,
          ordem_dca: true,
          ordem_dcim: true,
          status_ov_sap: true,
          status_diagrama: true,
          status_usuario_diagrama: true,
          status_150: true,
          status_usuario_150: true,
          status_170: true,
          status_usuario_170: true,
          status_180: true,
          status_usuario_180: true,
          status_190: true,
          status_usuario_190: true,
          entrada: true,
          prazo: true,
          data_conclusao: true,
          observ_obra: true,
          qtde_planejada: true,
          qtde_pend: true,
          mo_planejada: true,
          mo_final: true,
          executado: true,
          referencia: true,
          capex_mat_pend: true,
          capex_mat_plan: true,
          capex_mo_pend: true,
          capex_mo_plan: true,
          tipo_ads: true,
          data_empreitamento: true,
          ano_plan: true,
          circuitos: {
            select: {
              circuito: true,
              conjuntos: { select: { conjunto: true } },
            },
          },
          empreendimento: { select: { empreendimento: true } },
          municipios: {
            select: { municipio: true, regionais: { select: { id: true } } },
          },
          tipos: { select: { tipo_obra: true, id_grupo: true } },
          id_turma: true,
          id_status: true,
          programacoes: {
            select: {
              id: true,
              criado_em: true,
              data_prog: true,
              hora_ini: true,
              hora_ter: true,
              tipo_servico: true,
              prog: true,
              exec: true,
              observacao_programacao: true,
              equip_desligado: true,
              chi: true,
              num_dp: true,
              chave_provisoria: true,
              equipe_linha_morta: true,
              equipe_linha_viva: true,
              equipe_regularizacao: true,
              tecnicos: { select: { tecnico: true } },
              programacoes_restricao_execucao: { select: { restricao: true } },
              nome_responsavel_execucao: true,
              confirmada: true,
              validada: true,
              reprovada: true,
              status_programacao: {
                select: { status_programacao: true },
              },
              observacao_restricao: true,
              id_restricao_prog1: true,
              responsabilidade1: true,
              nome_responsavel: true,
              area_responsavel1: true,
              status_restricao1: true,
              data_resolucao1: true,
              id_restricao_prog2: true,
              responsabilidade2: true,
              nome_responsavel2: true,
              area_responsavel2: true,
              status_restricao2: true,
              data_resolucao2: true,
            },
            orderBy: { data_prog: 'asc' },
          },
        },
      });
    });

    it('should be return the work details with format correct', async () => {
      const id = 244;

      mockPrisma.obras.findFirst.mockResolvedValue(mockQueryResponse);

      const response = await repository.get(id);

      expect(response).toEqual(mockQueryResponse);
      expect(mockPrisma.obras.findFirst).toHaveBeenCalledWith({
        where: {
          OR: [
            { id: id },
            { ovnota: id.toString() },
            { ordem_dci: id.toString() },
            { ordem_dcd: id.toString() },
            { ordem_dca: id.toString() },
            { ordem_dcim: id.toString() },
            { diagrama: id.toString() },
          ],
        },
        select: {
          id: true,
          ovnota: true,
          pep: true,
          status_pep: true,
          diagrama: true,
          ordem_dci: true,
          ordem_dcd: true,
          ordem_dca: true,
          ordem_dcim: true,
          status_ov_sap: true,
          status_diagrama: true,
          status_usuario_diagrama: true,
          status_150: true,
          status_usuario_150: true,
          status_170: true,
          status_usuario_170: true,
          status_180: true,
          status_usuario_180: true,
          status_190: true,
          status_usuario_190: true,
          entrada: true,
          prazo: true,
          data_conclusao: true,
          observ_obra: true,
          qtde_planejada: true,
          qtde_pend: true,
          mo_planejada: true,
          mo_final: true,
          executado: true,
          referencia: true,
          capex_mat_pend: true,
          capex_mat_plan: true,
          capex_mo_pend: true,
          capex_mo_plan: true,
          tipo_ads: true,
          data_empreitamento: true,
          ano_plan: true,
          circuitos: {
            select: {
              circuito: true,
              conjuntos: { select: { conjunto: true } },
            },
          },
          empreendimento: { select: { empreendimento: true } },
          municipios: {
            select: { municipio: true, regionais: { select: { id: true } } },
          },
          tipos: { select: { tipo_obra: true, id_grupo: true } },
          id_turma: true,
          id_status: true,
          programacoes: {
            select: {
              id: true,
              criado_em: true,
              data_prog: true,
              hora_ini: true,
              hora_ter: true,
              tipo_servico: true,
              prog: true,
              exec: true,
              observacao_programacao: true,
              equip_desligado: true,
              chi: true,
              num_dp: true,
              chave_provisoria: true,
              equipe_linha_morta: true,
              equipe_linha_viva: true,
              equipe_regularizacao: true,
              tecnicos: { select: { tecnico: true } },
              programacoes_restricao_execucao: { select: { restricao: true } },
              nome_responsavel_execucao: true,
              confirmada: true,
              validada: true,
              reprovada: true,
              status_programacao: {
                select: { status_programacao: true },
              },
              observacao_restricao: true,
              id_restricao_prog1: true,
              responsabilidade1: true,
              nome_responsavel: true,
              area_responsavel1: true,
              status_restricao1: true,
              data_resolucao1: true,
              id_restricao_prog2: true,
              responsabilidade2: true,
              nome_responsavel2: true,
              area_responsavel2: true,
              status_restricao2: true,
              data_resolucao2: true,
            },
            orderBy: { data_prog: 'asc' },
          },
        },
      });
    });
  });
});
