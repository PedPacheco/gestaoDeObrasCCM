import { Prisma } from '@prisma/client';
import { DashboardFilterDTO } from 'src/interface/dtos/contingencyDTO';

export const CONTINGENCY_REPOSITORY = 'CONTINGENCY_REPOSITORY';

export interface RecentContingencyEntry {
  date: string;
  nome: string | null;
}

export interface ContingencyDashboard {
  porcentagemCedida: number | null;
  equipesEmergencia: any[];
  capacidadeMes: CapacidadePorAnoMesRow[];
  recentDates: RecentContingencyEntry[];
  parceira: any[];
  maoObra: any[];
  equipe: any[];
  csd: any[];
}

export interface RecentContingencyRow {
  dia_disponibilidade: Date;
  novo_tabela_usuarios: { nome: string } | null;
  turmas: { turma: string } | null;
}

export interface CapacidadePorAnoMesRow {
  ano: string;
  mes: number;
  capacidade: number;
  valor: number;
}

export interface EquipeEmergenciaMesRow {
  ano: number;
  mes: number;
  tipo: string;
  quantidade: number;
  valor: number;
}

export type ContingencyGroupField =
  'tipo_recurso_mao_obra' | 'tipo_recurso_equipe' | 'disponibilizado_csd';

export interface IContingencyRepository {
  create(data: Prisma.recursos_contingenciaUncheckedCreateInput): Promise<void>;
  findRecent(
    filter: DashboardFilterDTO | undefined,
  ): Promise<RecentContingencyRow[]>;
  groupByField(
    field: ContingencyGroupField,
    filter?: DashboardFilterDTO,
  ): Promise<any[]>;
  groupByParceira(filter?: DashboardFilterDTO): Promise<any[]>;
  groupByCsd(filter?: DashboardFilterDTO): Promise<any[]>;
  getCapacidadePorAnoMes(
    filter?: DashboardFilterDTO,
    month?: number,
  ): Promise<CapacidadePorAnoMesRow[]>;
  getEquipesEmergenciaComValor(
    filter?: DashboardFilterDTO,
    month?: number,
  ): Promise<EquipeEmergenciaMesRow[]>;
}
