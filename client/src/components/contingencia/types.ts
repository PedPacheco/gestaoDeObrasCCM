export interface CountItem {
  name: string;
  value: number;
}

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
  parceira: CountItem[];
  maoObra: CountItem[];
  equipe: CountItem[];
  csd: CountItem[];
}
