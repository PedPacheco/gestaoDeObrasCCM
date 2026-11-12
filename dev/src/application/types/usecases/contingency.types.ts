export interface CreateContingencyInput {
  availabilityDate: string; // YYYY-MM-DD
  partnerId: number;
  laborType: string;
  laborQuantity: number;
  teamType: string;
  teamQuantity: number;
  allocatedCsd: string;
  userId: number;
}

export type ContingencyInput = {
  dataInicial?: string;
  dataFinal?: string;
  idParceira?: number[];
  maoObra?: string[];
  equipe?: string[];
  csd?: string[];
};

export type AggregatedEmergencyTeam = {
  ano: number;
  mes: number;
  quantidade: number;
  valor: number;
};

// src/domain/types/contracts/contingency.types.ts
export interface CountItem {
  name: string;
  value: number;
}

export interface QuantityByNameRow {
  name: string;
  quantity: number;
}

export interface RecentContingencyRow {
  availabilityDate: Date;
  userName: string | null;
  crew: string | null;
}

export interface GroupByFieldRow {
  name: string;
  laborQuantity: number | null;
  teamsQuantity: number | null;
  allocatedCsd: number | null;
}

export interface MonthlyCapacityRow {
  year: number;
  month: number;
  capacity: number;
  value: number;
}

export interface EmergencyTeamRow {
  year: number;
  month: number;
  type: string;
  quantity: number;
  value: number;
}

export interface ContingencyDashboardOutput {
  allocatedPercentage: number | null;
  monthlyCapacity: MonthlyCapacityRow[];
  emergencyTeams: AggregatedEmergencyTeam[];
  recentAnswers: { date: string; name: string | null }[];
  partners: CountItem[];
  laborTypes: CountItem[];
  teamTypes: CountItem[];
  csds: CountItem[];
}
