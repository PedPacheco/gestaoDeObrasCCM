import { Prisma } from '@prisma/client';

export const CONTINGENCY_REPOSITORY = 'CONTINGENCY_REPOSITORY';

export interface DashboardFilter {
  dataInicial?: string;
  dataFinal?: string;
  idParceira?: number[];
  maoObra?: string[];
  equipe?: string[];
  csd?: string[];
}

export interface NamedCount {
  name: string;
  value: number;
}

export interface RecentContingencyEntry {
  date: string;
  nome: string | null;
}

export interface ContingencyDashboard {
  total: number;
  totalMaoObra: number;
  totalEquipe: number;
  porcentagemCedida: number | null;
  capacidadeMes: number | null;
  recentDates: RecentContingencyEntry[];
  parceira: NamedCount[];
  maoObra: NamedCount[];
  equipe: NamedCount[];
  csd: NamedCount[];
}

// --- Tipos de fronteira repository <-> service (dados "crus", sem cálculo) ---

export interface ContingencyAggregateSums {
  totalMaoObra: number;
  totalEquipe: number;
  minDate: Date | null;
  maxDate: Date | null;
}

export interface RecentContingencyRow {
  dia_disponibilidade: Date;
  usuario: { nome: string } | null;
  turmas: { turma: string } | null;
}

export interface CapacidadePorAnoMesRow {
  ano: string;
  mes: number;
  capacidade: number;
}

export type ContingencyGroupField =
  | 'tipo_recurso_mao_obra'
  | 'tipo_recurso_equipe'
  | 'disponibilizado_csd';

export interface IContingencyRepository {
  create(data: Prisma.recursos_contingenciaUncheckedCreateInput): Promise<void>;

  count(filter?: DashboardFilter): Promise<number>;

  aggregateSums(filter?: DashboardFilter): Promise<ContingencyAggregateSums>;

  findRecent(
    filter: DashboardFilter | undefined,
    take: number,
  ): Promise<RecentContingencyRow[]>;

  groupByField(
    field: ContingencyGroupField,
    filter?: DashboardFilter,
  ): Promise<NamedCount[]>;

  groupByParceira(filter?: DashboardFilter): Promise<NamedCount[]>;

  // Dados crus de capacidade por ano/mês/turma, sem nenhuma lógica de
  // dias úteis ou soma de período — isso é regra de negócio e fica no service.
  getCapacidadePorAnoMes(
    anos: string[],
    turmas: number[],
  ): Promise<CapacidadePorAnoMesRow[]>;
}
