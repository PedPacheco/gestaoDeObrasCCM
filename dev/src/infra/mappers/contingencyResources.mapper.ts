// infra/repositories/contingency/contingency.mapper.ts
import type {
  CapacityByYearMonth,
  ContingencyGroupField,
  ContingencyGroupItem,
  CountItem,
  CreateContingencyData,
  EmergencyTeam,
  RecentContingency,
} from 'src/domain/types';
import type { Prisma } from 'src/infra/generated/prisma/client';
import {
  CapacityByYearMonthRow,
  ContingencyGroupColumn,
  CsdCountRow,
  EmergencyTeamRow,
  GroupByFieldRow,
  PartnerCountRow,
  PartnerNameRow,
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

export const toContingencyGroupItem = (
  r: GroupByFieldRow,
  column: ContingencyGroupColumn,
): ContingencyGroupItem | null => {
  const name = r[column];
  if (name == null) return null;
  return {
    name,
    laborQuantity: r.quantidade_mao_obra ?? 0,
    teamsQuantity: r.quantidade_equipe ?? 0,
  };
};

export const toPartnerCountItems = (
  groups: PartnerCountRow[],
  partners: PartnerNameRow[],
): CountItem[] => {
  const names = new Map(partners.map((p) => [p.id, p.turma]));
  return groups.map((g) => ({
    name: names.get(g.id_parceira) ?? String(g.id_parceira),
    value: g._count._all,
  }));
};

export const toCsdCountItem = (r: CsdCountRow): CountItem => ({
  name: r.disponibilizado_csd,
  value: r._count._all,
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
