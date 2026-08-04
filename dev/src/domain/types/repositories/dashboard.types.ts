export type FindWorksByStatus = { status: string; count: number };

export type FindWorksByRegional = {
  regional: string;
  total: number;
  concluded: number;
};

export type findMonthlyTrendResponse = {
  month: string;
  entered: number;
  concluded: number;
};

export type FindTopPartners = { partner: string; total: number };

export type FindRecentWorks = {
  ovnota: string;
  status: string;
  partner: string;
  municipio: string;
  executado: number | null;
  entrada: Date;
};

export type FindPartnerStatus = {
  partner: string;
  status: string;
  count: number;
};
