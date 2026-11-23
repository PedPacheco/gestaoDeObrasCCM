import type { Prisma } from 'src/infra/generated/prisma/client';

// ═══════════════════════════════════════════════════════════════════
// Fragmentos comuns
// ═══════════════════════════════════════════════════════════════════

/** Material com preço (Decimal), usado nas consultas de serviços. */
const SERVICE_MATERIAL_SELECT = {
  codigo: true,
  descricao: true,
  preco: true,
} satisfies Prisma.materiaisSelect;

/** Serviço de contrato com preço, usado nas consultas de serviços. */
const SERVICE_CONTRACT_SELECT = {
  material: true,
  texto_breve: true,
  preco: true,
} satisfies Prisma.servicos_contratosSelect;

// ═══════════════════════════════════════════════════════════════════
// Serviços
// ═══════════════════════════════════════════════════════════════════

/** Serviços da obra: getAllServicesOfWork e getNotScheduledServices. */
export const BASE_SERVICES_SELECT = {
  id: true,
  id_obra: true,
  id_contrato_servico: true,
  id_material: true,
  operacao: true,
  ponto: true,
  qtde_plan: true,
  qtde_prog: true,
  qtde_real: true,
  qtde_adicional: true,
  viabilizado: true,
  descricao_operacao: true,
  numero_operacao: true,
  materiais: { select: SERVICE_MATERIAL_SELECT },
  servicos_contratos: { select: SERVICE_CONTRACT_SELECT },
} satisfies Prisma.servicosSelect;

export type BaseServiceRow = Prisma.servicosGetPayload<{
  select: typeof BASE_SERVICES_SELECT;
}>;

/** Serviços para programação (findServicesForScheduling). Sem Decimal: não precisa de mapper. */
export const SERVICE_FOR_SCHEDULING_SELECT = {
  id: true,
  id_obra: true,
  id_material: true,
  viabilizado: true,
  qtde_adicional: true,
  qtde_real: true,
  ponto: true,
  operacao: true,
  descricao_operacao: true,
} satisfies Prisma.servicosSelect;

// ═══════════════════════════════════════════════════════════════════
// Serviços programados
// ═══════════════════════════════════════════════════════════════════

/** Serviços selecionados numa programação (getSelectedServices). */
export const SELECTED_SERVICES_SELECT = {
  id_programacao: true,
  prog: true,
  real: true,
  adicional: true,
  equipes: { select: { equipe: true, encarregado: true, perfil: true } },
  programacoes: { select: { data_prog: true } },
  servicos: {
    select: {
      id: true,
      id_obra: true,
      operacao: true,
      ponto: true,
      qtde_plan: true,
      viabilizado: true,
      descricao_operacao: true,
      numero_operacao: true,
      materiais: { select: SERVICE_MATERIAL_SELECT },
      servicos_contratos: { select: SERVICE_CONTRACT_SELECT },
    },
  },
} satisfies Prisma.programacoes_servicosSelect;

export type SelectedServiceRow = Prisma.programacoes_servicosGetPayload<{
  select: typeof SELECTED_SERVICES_SELECT;
}>;

/** Histórico por ids de programação (getServiceScheduleHistoryByIdSchedule). */
export const SCHEDULE_HISTORY_BY_ID_SCHEDULE_SELECT = {
  id: true,
  id_servico: true,
  servicos: {
    select: {
      materiais: { select: SERVICE_MATERIAL_SELECT },
      servicos_contratos: { select: SERVICE_CONTRACT_SELECT },
      ponto: true,
      operacao: true,
      qtde_plan: true,
      viabilizado: true,
      descricao_operacao: true,
      numero_operacao: true,
    },
  },
  id_programacao: true,
  programacoes: { select: { data_prog: true } },
  equipes: { select: { equipe: true, perfil: true } },
  prog: true,
  real: true,
  adicional: true,
} satisfies Prisma.programacoes_servicosSelect;

export type ScheduleHistoryByIdScheduleRow =
  Prisma.programacoes_servicosGetPayload<{
    select: typeof SCHEDULE_HISTORY_BY_ID_SCHEDULE_SELECT;
  }>;

// ═══════════════════════════════════════════════════════════════════
// Materiais
// ═══════════════════════════════════════════════════════════════════

/** Lista de materiais (antigo findMany sem select, que devolvia todas as colunas). */
export const MATERIALS_CONTRACT_SELECT = {
  id: true,
  codigo: true,
  descricao: true,
  unidade: true,
  preco: true,
} satisfies Prisma.materiaisSelect;

export type MaterialContractRow = Prisma.materiaisGetPayload<{
  select: typeof MATERIALS_CONTRACT_SELECT;
}>;

// ═══════════════════════════════════════════════════════════════════
// Exportação
// O select depende dos filtros de data e equipa, por isso é uma função.
// ═══════════════════════════════════════════════════════════════════

/** Obras com programações e serviços para a exportação em Excel. */
export function buildWorkToExportSelect(
  dateFilter: Prisma.DateTimeFilter,
  programacoesServicosFilter: Prisma.programacoes_servicosWhereInput,
) {
  return {
    ovnota: true,
    diagrama: true,
    referencia: true,
    ordem_dci: true,
    ordem_dca: true,
    ordem_dcd: true,
    ordem_dcim: true,
    executado: true,
    tipos: { select: { tipo_obra: true } },
    municipios: { select: { municipio: true } },
    turmas: { select: { turma: true } },
    empreendimento: { select: { empreendimento: true } },
    circuitos: {
      select: { circuito: true, conjuntos: { select: { conjunto: true } } },
    },
    programacoes: {
      where: { data_prog: dateFilter },
      select: {
        id: true,
        data_prog: true,
        prog: true,
        tipo_servico: true,
        observacao_programacao: true,
        chi: true,
        num_dp: true,
        chave_provisoria: true,
        hora_ini: true,
        hora_ter: true,
        equipe_linha_morta: true,
        equipe_linha_viva: true,
        equipe_regularizacao: true,
        tecnicos: { select: { tecnico: true } },
        status_programacao: { select: { status_programacao: true } },
      },
    },
    servicos: {
      where: {
        OR: [
          { viabilizado: { not: null, gt: 0 } },
          // { qtde_adicional: { not: null, gt: 0 } },
        ],
        programacoes_servicos: { some: programacoesServicosFilter },
      },
      select: {
        operacao: true,
        ponto: true,
        viabilizado: true,
        qtde_adicional: true,
        materiais: { select: { ...SERVICE_MATERIAL_SELECT, unidade: true } },
        servicos_contratos: {
          select: { ...SERVICE_CONTRACT_SELECT, medida: true },
        },
        programacoes_servicos: {
          where: programacoesServicosFilter,
          select: {
            id_programacao: true,
            prog: true,
            real: true,
            equipes: { select: { equipe: true } },
          },
        },
      },
    },
  } satisfies Prisma.obrasSelect;
}

export type WorkToExportRow = Prisma.obrasGetPayload<{
  select: ReturnType<typeof buildWorkToExportSelect>;
}>;

export type ServiceToExportRow = WorkToExportRow['servicos'][number];
