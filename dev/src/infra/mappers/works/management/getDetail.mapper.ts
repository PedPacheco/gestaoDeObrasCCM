import type {
  ServicesType,
  WorkDetailsRepositoryResponse,
  WorkDetailsSchedule,
} from 'src/domain/types';
import type { Prisma } from 'src/infra/generated/prisma/client';

// ---------- select ----------
const workDetailsScheduleSelect = {
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
  programacoes_servicos: {
    select: { equipes: { select: { equipe: true } } },
  },
  nome_responsavel_execucao: true,
  confirmada: true,
  validada: true,
  reprovada: true,
  status_programacao: { select: { status_programacao: true } },
  observacao_restricao: true,
  observacao_execucao: true,
  id_restricao_execucao: true,
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
  usuario: { select: { nome: true } },
  usuario_ultima_atualizacao: { select: { nome: true } },
} satisfies Prisma.programacoesSelect; // confirme o nome do modelo no schema

export const workDetailsSelect = {
  id: true,
  ovnota: true,
  pep: true,
  status_pep: true,
  diagrama: true,
  ordem_dci: true,
  ordem_dcd: true,
  ordem_dca: true,
  ordem_dcim: true,
  ordem_dcdm: true,
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
  mo_pend: true,
  mo_final: true,
  executado: true,
  referencia: true,
  capex_mat_pend: true,
  capex_mat_plan: true,
  capex_mo_pend: true,
  capex_mo_plan: true,
  data_empreitamento: true,
  ano_plan: true,
  programacao_ponto_a_ponto: true,
  circuitos: {
    select: { circuito: true, conjuntos: { select: { conjunto: true } } },
  },
  relatorio_viabilidade: {
    select: { data_envio: true, prazo_viabilidade: true, aprovada: true },
  },
  empreendimento: { select: { empreendimento: true } },
  municipios: {
    select: { municipio: true, regionais: { select: { id: true } } },
  },
  tipos: { select: { tipo_obra: true, id_grupo: true } },
  id_turma: true,
  id_status: true,
  programacoes: {
    select: workDetailsScheduleSelect,
    orderBy: { data_prog: 'asc' },
  },
} satisfies Prisma.obrasSelect;

// ---------- rows ----------
type WorkDetailsRow = Prisma.obrasGetPayload<{
  select: typeof workDetailsSelect;
}>;
type WorkDetailsScheduleRow = WorkDetailsRow['programacoes'][number];

// ---------- mappers ----------
export function toWorkDetailsSchedule(
  row: WorkDetailsScheduleRow,
): WorkDetailsSchedule {
  const {
    tecnicos,
    programacoes_restricao_execucao,
    programacoes_servicos,
    status_programacao,
    usuario,
    usuario_ultima_atualizacao,
    ...scalars
  } = row;

  return {
    ...scalars,
    tecnicos: { tecnico: tecnicos.tecnico },
    programacoes_restricao_execucao: {
      restricao: programacoes_restricao_execucao.restricao,
    },
    programacoes_servicos: programacoes_servicos.map((s) => ({
      equipes: { equipe: s.equipes.equipe },
    })),
    status_programacao: {
      status_programacao: status_programacao.status_programacao,
    },
    usuario: usuario ? { nome: usuario.nome } : null,
    usuario_ultima_atualizacao: usuario_ultima_atualizacao
      ? { nome: usuario_ultima_atualizacao.nome }
      : null,
  };
}

export function toWorkDetails(
  row: WorkDetailsRow,
): WorkDetailsRepositoryResponse {
  const {
    circuitos,
    relatorio_viabilidade,
    empreendimento,
    municipios,
    tipos,
    programacoes,
    ...scalars
  } = row;

  return {
    ...scalars,
    circuitos: {
      circuito: circuitos.circuito,
      conjuntos: { conjunto: circuitos.conjuntos.conjunto },
    },
    relatorio_viabilidade: relatorio_viabilidade
      ? {
          data_envio: relatorio_viabilidade.data_envio,
          prazo_viabilidade: relatorio_viabilidade.prazo_viabilidade,
          aprovada: relatorio_viabilidade.aprovada,
        }
      : null,
    empreendimento: { empreendimento: empreendimento.empreendimento },
    municipios: {
      municipio: municipios.municipio,
      regionais: { id: municipios.regionais.id },
    },
    tipos: { tipo_obra: tipos.tipo_obra, id_grupo: tipos.id_grupo },
    programacoes: programacoes.map(toWorkDetailsSchedule),
  };
}

// ---------- ServicesType (commit 3 do 5b) ----------
type Material = NonNullable<ServicesType['materiais']>;

type ServicesRow = Omit<ServicesType, 'materiais'> & {
  materiais: (Omit<Material, 'preco'> & { preco: Prisma.Decimal }) | null;
};

export function toServicesType(row: ServicesRow): ServicesType {
  return {
    id: row.id,
    qtde_real: row.qtde_real,
    viabilizado: row.viabilizado,
    qtde_adicional: row.qtde_adicional,
    materiais: row.materiais
      ? {
          codigo: row.materiais.codigo,
          descricao: row.materiais.descricao,
          preco: row.materiais.preco.toNumber(),
          unidade: row.materiais.unidade,
        }
      : null,
    servicos_contratos: row.servicos_contratos,
  };
}
