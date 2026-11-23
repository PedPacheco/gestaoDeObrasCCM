// domain/types/contingency.types.ts
export type ContingencyFilter = {
  mesInicial?: string; // YYYY-MM
  mesFinal?: string; // YYYY-MM
  idParceira?: number[];
  maoObra?: string[];
  equipe?: string[];
  csd?: string[];
};

export type CreateContingencyData = {
  availabilityDate: Date;
  partnerId: number;
  laborType: string | null;
  laborQuantity: number | null;
  teamType: string | null;
  teamQuantity: number | null;
  allocatedCsd: string;
  userId: number;
};

export type ContingencyGroupField = 'laborType' | 'teamType';

export interface CountItem {
  name: string;
  value: number;
}

export interface ContingencyGroupItem {
  name: string;
  laborQuantity: number;
  teamsQuantity: number;
}

export interface RecentContingency {
  id: number;
  availabilityDate: Date;
  userName: string | null;
  partner: string | null;
}

export interface CapacityByYearMonth {
  year: number;
  month: number;
  capacity: number;
  value: number;
}

export interface EmergencyTeam {
  year: number;
  month: number;
  type: string | null;
  quantity: number;
  value: number;
}
