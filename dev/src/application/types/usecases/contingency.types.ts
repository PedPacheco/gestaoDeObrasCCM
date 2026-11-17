// application/types/usecases/contingency/contingency.types.ts
import type {
  ContingencyFilter,
  CountItem,
  EmergencyTeam,
} from 'src/domain/types';

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

export type ContingencyInput = ContingencyFilter;

export interface MonthlyCapacityOutput {
  year: string; // mantido como string para não mudar o contrato com o front
  month: number;
  capacity: number;
  value: number;
}

export type EmergencyTeamOutput = EmergencyTeam;

export interface RecentAnswerOutput {
  id: number;
  date: string; // YYYY-MM-DD
  name: string | null;
  partner: string | null;
}

export interface ContingencyDashboardOutput {
  allocatedPercentage: number | null;
  monthlyCapacity: MonthlyCapacityOutput[];
  emergencyTeams: EmergencyTeamOutput[];
  recentAnswers: RecentAnswerOutput[];
  partners: CountItem[];
  laborTypes: CountItem[];
  teamTypes: CountItem[];
  csds: CountItem[];
}
