// infra/repositories/contingency/contingency.rows.ts
import type { Prisma } from 'src/infra/generated/prisma/client';

export type ContingencyGroupColumn =
  'tipo_recurso_mao_obra' | 'tipo_recurso_equipe';

// ─── Queries Prisma: o tipo vem do select, por isso acompanha o schema ───

export const RECENT_CONTINGENCY_SELECT = {
  id: true,
  dia_disponibilidade: true,
  novo_tabela_usuarios: { select: { nome: true } },
  turmas: { select: { turma: true } },
} satisfies Prisma.recursos_contingenciaSelect;

export type RecentContingencyRow = Prisma.recursos_contingenciaGetPayload<{
  select: typeof RECENT_CONTINGENCY_SELECT;
}>;

/** Quantidades partilhadas por todos os agrupamentos. */
const QUANTITY_SELECT = {
  quantidade_mao_obra: true,
  quantidade_equipe: true,
} satisfies Prisma.recursos_contingenciaSelect;

export type QuantityRow = Prisma.recursos_contingenciaGetPayload<{
  select: typeof QUANTITY_SELECT;
}>;

export const GROUP_BY_FIELD_SELECT = {
  tipo_recurso_mao_obra: true,
  tipo_recurso_equipe: true,
  ...QUANTITY_SELECT,
} satisfies Prisma.recursos_contingenciaSelect;

export type GroupByFieldRow = Prisma.recursos_contingenciaGetPayload<{
  select: typeof GROUP_BY_FIELD_SELECT;
}>;

/** Um registo por linha com a parceira. A soma é feita no use case. */
export const PARTNER_QUANTITY_SELECT = {
  id_parceira: true,
  ...QUANTITY_SELECT,
} satisfies Prisma.recursos_contingenciaSelect;

export type PartnerQuantityRow = Prisma.recursos_contingenciaGetPayload<{
  select: typeof PARTNER_QUANTITY_SELECT;
}>;

/** Um registo por linha com o CSD. A soma é feita no use case. */
export const CSD_QUANTITY_SELECT = {
  disponibilizado_csd: true,
  ...QUANTITY_SELECT,
} satisfies Prisma.recursos_contingenciaSelect;

export type CsdQuantityRow = Prisma.recursos_contingenciaGetPayload<{
  select: typeof CSD_QUANTITY_SELECT;
}>;

export const PARTNER_NAME_SELECT = {
  id: true,
  turma: true,
} satisfies Prisma.turmasSelect;

export type PartnerNameRow = Prisma.turmasGetPayload<{
  select: typeof PARTNER_NAME_SELECT;
}>;

export const FIND_CONTINGENCY_RESOURCE_DISPATCHES_SELECT = {
  criado_em: true,
  dia_disponibilidade: true,
  disponibilizado_csd: true,
  tipo_recurso_equipe: true,
  tipo_recurso_mao_obra: true,
  ...QUANTITY_SELECT,
  novo_tabela_usuarios: { select: { nome: true } },
  turmas: { select: { turma: true } },
} satisfies Prisma.recursos_contingenciaSelect;

export type FindContingencyResourceDispatchesRow =
  Prisma.recursos_contingenciaGetPayload<{
    select: typeof FIND_CONTINGENCY_RESOURCE_DISPATCHES_SELECT;
  }>;

// ─── $queryRaw: o Prisma não valida; estes tipos têm de corresponder aos casts do SQL ───

export interface CapacityByYearMonthRow {
  ano: string; // ce.ano sem cast (coluna de texto)
  mes: number; // literal inteiro do VALUES
  capacidade: number; // SUM(...)::int
  valor: number; // SUM(...)::float8
}

export interface EmergencyTeamRow {
  ano: number; // ::int
  mes: number; // ::int
  tipo: string | null; // rc.tipo_recurso_equipe
  quantidade: number; // SUM(...)::int
  valor: number; // ::float8
}
