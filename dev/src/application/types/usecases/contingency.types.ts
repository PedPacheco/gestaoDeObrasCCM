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
  mesInicial?: string; // YYYY-MM
  mesFinal?: string; // YYYY-MM
  idParceira?: number[];
  maoObra?: string[];
  equipe?: string[];
  csd?: string[];
};

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
}

export interface MonthlyCapacityRow {
  year: string;
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
  emergencyTeams: EmergencyTeamRow[];
  recentAnswers: {
    id: number;
    date: string;
    name: string | null;
    partner: string | null;
  }[];
  partners: CountItem[];
  laborTypes: CountItem[];
  teamTypes: CountItem[];
  csds: CountItem[];
}
