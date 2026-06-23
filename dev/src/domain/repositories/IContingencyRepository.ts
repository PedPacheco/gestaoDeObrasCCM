import { Prisma } from '@prisma/client';

export interface RecentResponse {
  date: string;
  nome: string | null;
}

export interface ContingencyDashboard {
  total: number;
  recentDates: RecentResponse[];
  totalMaoObra: number;
  totalEquipe: number;
  porcentagemCedida: number | null;
  capacidadeMes: number | null;
  parceira: { name: string; value: number }[];
  maoObra: { name: string; value: number }[];
  equipe: { name: string; value: number }[];
  csd: { name: string; value: number }[];
}

export interface DashboardFilter {
  dataInicial?: string;
  dataFinal?: string;
  parceira?: string[];
  maoObra?: string[];
  equipe?: string[];
  csd?: string[];
}

export interface IContingencyRepository {
  create(
    data: Prisma.recursos_contingenciaUncheckedCreateInput,
  ): Promise<void>;
  getDashboard(filter?: DashboardFilter): Promise<ContingencyDashboard>;
}

export const CONTINGENCY_REPOSITORY = Symbol('ContingencyRepository');
