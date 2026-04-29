export interface DailySummary {
  data: string;
  executado: number;
  programado: number;
  meta: number;
  percentualMeta: number;
}

export interface GroupSummary {
  parceira: string;
  executado: number;
  programado: number;
  percentualMeta: number;
}

export interface DashboardFiltersState {
  partner: string;
  status: string;
  search: string;
  dateRange: {
    start: string;
    end: string;
  } | null;
}
