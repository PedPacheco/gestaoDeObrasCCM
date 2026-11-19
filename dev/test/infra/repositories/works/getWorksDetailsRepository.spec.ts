import { Test } from '@nestjs/testing';
import { workDetailsSelect } from 'src/infra/mappers/works/management/getDetail.mapper';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetWorksDetailsRepository } from 'src/infra/repositories/works/management/getWorksDetailsRepository';
import { workIdentifierWhere } from 'src/infra/shared/workIdentifierWhere';

const BASE_SCHEDULE_ROW = {
  id: 10,
  criado_em: new Date('2024-09-01T00:00:00.000Z'),
  data_prog: new Date('2024-09-19T00:00:00.000Z'),
  hora_ini: new Date('1970-01-01T08:00:00.000Z'),
  hora_ter: new Date('1970-01-01T17:00:00.000Z'),
  tipo_servico: 'OBRA LIVRE',
  prog: 45,
  exec: null as number | null,
  observacao_programacao: null as string | null,
  equip_desligado: 'TRECHO LIVRE' as string | null,
  chi: 0 as number | null,
  num_dp: null as string | null,
  chave_provisoria: false as boolean | null,
  equipe_linha_morta: 12 as number | null,
  equipe_linha_viva: 3 as number | null,
  equipe_regularizacao: 0 as number | null,
  tecnicos: { tecnico: 'NÃO DEFINIDO' as string | null },
  programacoes_restricao_execucao: { restricao: null as string | null },
  programacoes_servicos: [{ equipes: { equipe: 'EQ-01' } }],
  nome_responsavel_execucao: null as string | null,
  confirmada: true,
  validada: true,
  reprovada: false,
  status_programacao: { status_programacao: 'VALIDADA' },
  observacao_restricao: null as string | null,
  observacao_execucao: null as string | null,
  id_restricao_execucao: 1,
  id_restricao_prog1: 1,
  responsabilidade1: null as string | null,
  nome_responsavel: null as string | null,
  area_responsavel1: null as string | null,
  status_restricao1: null as string | null,
  data_resolucao1: null as Date | null,
  id_restricao_prog2: 1,
  responsabilidade2: null as string | null,
  nome_responsavel2: null as string | null,
  area_responsavel2: null as string | null,
  status_restricao2: null as string | null,
  data_resolucao2: null as Date | null,
  usuario: { nome: 'Ana' } as { nome: string } | null,
  usuario_ultima_atualizacao: null as { nome: string } | null,
};

export type ScheduleRowFixture = typeof BASE_SCHEDULE_ROW;

export function buildScheduleRow(
  overrides: Partial<ScheduleRowFixture> = {},
): ScheduleRowFixture {
  return { ...BASE_SCHEDULE_ROW, ...overrides };
}

const BASE_WORK_ROW = {
  id: 244,
  ovnota: '12791122',
  pep: 'X/004604' as string | null,
  status_pep: null as string | null,
  diagrama: null as string | null,
  ordem_dci: '170000004647' as string | null,
  ordem_dcd: '190000006101' as string | null,
  ordem_dca: null as string | null,
  ordem_dcim: null as string | null,
  ordem_dcdm: null as string | null,
  status_ov_sap: 20 as number | null,
  status_diagrama: null as string | null,
  status_usuario_diagrama: null as string | null,
  status_150: null as string | null,
  status_usuario_150: null as string | null,
  status_170: 'LIB ' as string | null,
  status_usuario_170: 'PLAR' as string | null,
  status_180: null as string | null,
  status_usuario_180: null as string | null,
  status_190: 'LIB ' as string | null,
  status_usuario_190: 'EXEC' as string | null,
  entrada: new Date('2023-04-18T00:00:00.000Z') as Date | null,
  prazo: 90 as number | null,
  data_conclusao: null as Date | null,
  observ_obra: null as string | null,
  qtde_planejada: 0.772 as number | null,
  qtde_pend: 0.77165 as number | null,
  mo_planejada: 89223.8157 as number | null,
  mo_pend: null as number | null,
  mo_final: null as number | null,
  executado: null as number | null,
  referencia: '190BF006190439' as string | null,
  capex_mat_pend: 186326.1654099993 as number | null,
  capex_mat_plan: 186326.1654099993 as number | null,
  capex_mo_pend: 64982.8126 as number | null,
  capex_mo_plan: 74310.44331999999 as number | null,
  data_empreitamento: new Date('2024-08-06T00:00:00.000Z') as Date | null,
  ano_plan: null as number | null,
  programacao_ponto_a_ponto: false as boolean | null,
  circuitos: {
    circuito: 'CAC-1302',
    conjuntos: { conjunto: 'São josé' as string | null },
  },
  relatorio_viabilidade: null as {
    data_envio: Date;
    prazo_viabilidade: string;
    aprovada: boolean;
  } | null,
  empreendimento: { empreendimento: null as string | null },
  municipios: { municipio: 'MONTEIRO LOBATO', regionais: { id: 1 } },
  tipos: { tipo_obra: 'SPACER CABLE', id_grupo: 2 },
  id_turma: 1,
  id_status: 5,
  programacoes: [buildScheduleRow()],
};

export type WorkRowFixture = typeof BASE_WORK_ROW;

export function buildWorkRow(
  overrides: Partial<WorkRowFixture> = {},
): WorkRowFixture {
  return { ...BASE_WORK_ROW, ...overrides };
}
describe('GetWorksDetailsRepository', () => {
  let repository: GetWorksDetailsRepository;

  const mockPrisma = {
    obras: { findFirst: vi.fn() },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        GetWorksDetailsRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get(GetWorksDetailsRepository);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('get', () => {
    it('queries obras with the work identifier filter and the work details select', async () => {
      mockPrisma.obras.findFirst.mockResolvedValue(null);

      await repository.get(244);

      expect(mockPrisma.obras.findFirst).toHaveBeenCalledTimes(1);
      expect(mockPrisma.obras.findFirst).toHaveBeenCalledWith({
        where: workIdentifierWhere(244),
        select: workDetailsSelect,
      });
    });

    it('returns null when no work matches the identifier', async () => {
      mockPrisma.obras.findFirst.mockResolvedValue(null);

      await expect(repository.get(4552432432432)).resolves.toBeNull();
    });

    it('returns the work mapped to the domain shape when a work is found', async () => {
      const row = buildWorkRow();
      mockPrisma.obras.findFirst.mockResolvedValue(row);

      const result = await repository.get(row.id);

      expect(result).toStrictEqual(row);
    });

    it('propagates errors thrown by Prisma', async () => {
      const error = new Error('database unavailable');
      mockPrisma.obras.findFirst.mockRejectedValue(error);

      await expect(repository.get(244)).rejects.toBe(error);
    });
  });
});
