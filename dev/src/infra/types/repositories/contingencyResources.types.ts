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

export const GROUP_BY_FIELD_SELECT = {
  tipo_recurso_mao_obra: true,
  tipo_recurso_equipe: true,
  quantidade_mao_obra: true,
  quantidade_equipe: true,
} satisfies Prisma.recursos_contingenciaSelect;

export type GroupByFieldRow = Prisma.recursos_contingenciaGetPayload<{
  select: typeof GROUP_BY_FIELD_SELECT;
}>;

export const PARTNER_NAME_SELECT = {
  id: true,
  turma: true,
} satisfies Prisma.turmasSelect;
export type PartnerNameRow = Prisma.turmasGetPayload<{
  select: typeof PARTNER_NAME_SELECT;
}>;

// ─── groupBy: tipos manuais. O tsc confirma-os quando o resultado é passado ao mapper ───
export interface PartnerCountRow {
  id_parceira: number;
  _count: { _all: number };
}
export interface CsdCountRow {
  disponibilizado_csd: string;
  _count: { _all: number };
}

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
