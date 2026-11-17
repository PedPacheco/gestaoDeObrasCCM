// ─── Factories ────────────────────────────────────────────────────────────────

import { ContingencyInput } from 'src/application/types';
import { CreateContingencyData, EmergencyTeam } from 'src/domain/types';
import { Prisma } from 'src/infra/generated/prisma/client';
import { EmergencyTeamRow } from 'src/infra/types';

export const makeFilter = (
  overrides: Partial<ContingencyInput> = {},
): ContingencyInput => ({
  mesInicial: '2025-06', // formato YYYY-MM
  mesFinal: '2025-06',
  idParceira: [1, 2],
  maoObra: ['ELETRICISTA'],
  equipe: ['EQUIPE_A'],
  csd: ['SIM'],
  ...overrides,
});

export const makeRecentRow = (
  dateStr: string,
  id = 1,
  nome: string | null = 'João',
) => ({
  id,
  dia_disponibilidade: new Date(dateStr),
  novo_tabela_usuarios: nome !== null ? { nome } : null,
  turmas: { turma: 'Turma A' },
});

export const makeRecent = (
  dateStr: string,
  id = 1,
  nome: string | null = 'João',
) => ({
  id,
  availabilityDate: new Date(dateStr),
  userName: nome,
  partner: 'Turma A',
});

export const makeCreateInput = (
  overrides: Partial<CreateContingencyData> = {},
): CreateContingencyData => ({
  availabilityDate: new Date('2025-06-10T00:00:00.000Z'),
  partnerId: 1,
  laborType: 'ELETRICISTA',
  laborQuantity: 5,
  teamType: 'EQUIPE_A',
  teamQuantity: 3,
  allocatedCsd: 'SIM',
  userId: 42,
  ...overrides,
});

export const makeCreateInputRow = (
  overrides: Partial<Prisma.recursos_contingenciaUncheckedCreateInput> = {},
): Prisma.recursos_contingenciaUncheckedCreateInput => ({
  dia_disponibilidade: new Date('2025-06-10T00:00:00.000Z'),
  id_parceira: 1,
  tipo_recurso_mao_obra: 'ELETRICISTA',
  quantidade_mao_obra: 5,
  tipo_recurso_equipe: 'EQUIPE_A',
  quantidade_equipe: 3,
  disponibilizado_csd: 'SIM',
  id_usuario: 42,
  ...overrides,
});

/** Linha devolvida por `findMany` dentro de `groupByField`. */
type GroupByFieldFindManyRow = {
  tipo_recurso_mao_obra?: string | null;
  tipo_recurso_equipe?: string | null;
  quantidade_mao_obra: number | null;
  quantidade_equipe: number | null;
};

export const makeGroupByFieldFindManyRow = (
  overrides: Partial<GroupByFieldFindManyRow> = {},
): GroupByFieldFindManyRow => ({
  quantidade_mao_obra: 0,
  quantidade_equipe: 0,
  ...overrides,
});

export const makeCsdGroupRow = (value: string | null, count: number) => ({
  disponibilizado_csd: value,
  _count: { _all: count },
});

export const makeGroupByParceiraRow = (idParceira: number, count: number) => ({
  id_parceira: idParceira,
  _count: { _all: count },
});

export const makeTurmaRow = (id: number, turma: string) => ({ id, turma });

export const makeEmergencyTeamRawRow = (
  overrides: Partial<EmergencyTeamRow> = {},
): EmergencyTeamRow => ({
  ano: 2025,
  mes: 6,
  tipo: 'EQUIPE_A',
  quantidade: 3,
  valor: 450,
  ...overrides,
});

export const makeEmergencyTeam = (
  overrides: Partial<EmergencyTeam> = {},
): EmergencyTeam => ({
  year: 2025,
  month: 6,
  type: 'EQUIPE_A',
  quantity: 3,
  value: 450,
  ...overrides,
});
