// infra/repositories/contingency/contingency.mapper.ts
import type {
  CapacityByYearMonth,
  ContingencyGroupField,
  ContingencyGroupItem,
  ContingencyResourceDispatches,
  CreateContingencyData,
  EmergencyTeam,
  RecentContingency,
} from 'src/domain/types';
import type { Prisma } from 'src/infra/generated/prisma/client';
import {
  CapacityByYearMonthRow,
  ContingencyGroupColumn,
  CsdQuantityRow,
  EmergencyTeamRow,
  FindContingencyResourceDispatchesRow,
  GroupByFieldRow,
  PartnerNameRow,
  PartnerQuantityRow,
  QuantityRow,
  RecentContingencyRow,
} from '../types';

export const GROUP_FIELD_COLUMN: Record<
  ContingencyGroupField,
  ContingencyGroupColumn
> = {
  laborType: 'tipo_recurso_mao_obra',
  teamType: 'tipo_recurso_equipe',
};

// domínio → Prisma
export const toCreateContingencyInput = (
  d: CreateContingencyData,
): Prisma.recursos_contingenciaUncheckedCreateInput => ({
  dia_disponibilidade: d.availabilityDate,
  id_parceira: d.partnerId,
  tipo_recurso_mao_obra: d.laborType,
  quantidade_mao_obra: d.laborQuantity,
  tipo_recurso_equipe: d.teamType,
  quantidade_equipe: d.teamQuantity,
  disponibilizado_csd: d.allocatedCsd,
  id_usuario: d.userId,
});

// rows → domínio
export const toRecentContingency = (
  r: RecentContingencyRow,
): RecentContingency => ({
  id: r.id,
  availabilityDate: r.dia_disponibilidade,
  userName: r.novo_tabela_usuarios?.nome ?? null,
  partner: r.turmas?.turma ?? null,
});

/** Conversão das quantidades partilhada pelos agrupamentos. */
const toQuantities = (r: QuantityRow) => ({
  laborQuantity: r.quantidade_mao_obra ?? 0,
  teamsQuantity: r.quantidade_equipe ?? 0,
});

export const toContingencyGroupItem = (
  r: GroupByFieldRow,
  column: ContingencyGroupColumn,
): ContingencyGroupItem | null => {
  const name = r[column];
  if (name == null) return null;

  return { name, ...toQuantities(r) };
};

/** Um item por registo, com o nome da parceira. A soma é feita no use case. */
export const toPartnerQuantityItems = (
  rows: PartnerQuantityRow[],
  partners: PartnerNameRow[],
): ContingencyGroupItem[] => {
  const names = new Map(partners.map((p) => [p.id, p.turma]));

  return rows.map((r) => ({
    name: names.get(r.id_parceira) ?? String(r.id_parceira),
    ...toQuantities(r),
  }));
};

/** Um item por registo, com o valor de disponibilizado_csd como nome. */
export const toCsdQuantityItem = (r: CsdQuantityRow): ContingencyGroupItem => ({
  name: r.disponibilizado_csd,
  ...toQuantities(r),
});

export const toCapacityByYearMonth = (
  r: CapacityByYearMonthRow,
): CapacityByYearMonth => ({
  year: Number(r.ano),
  month: r.mes,
  capacity: r.capacidade,
  value: r.valor,
});

export const toEmergencyTeam = (r: EmergencyTeamRow): EmergencyTeam => ({
  year: r.ano,
  month: r.mes,
  type: r.tipo,
  quantity: r.quantidade,
  value: r.valor,
});

export const toContingencyResourceDispatchesRow = (
  row: FindContingencyResourceDispatchesRow,
): ContingencyResourceDispatches => ({
  allocatedCsd: row.disponibilizado_csd,
  availabilityDate: row.dia_disponibilidade,
  createdAt: row.criado_em,
  laborQuantity: row.quantidade_mao_obra,
  laborType: row.tipo_recurso_mao_obra,
  teamQuantity: row.quantidade_equipe,
  teamType: row.tipo_recurso_equipe,
  partner: row.turmas.turma,
  user: row.novo_tabela_usuarios.nome,
});
