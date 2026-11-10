export type CompletedWorkItem = {
  id: number;
  ovnota: string;
  ordemdiagrama: string;
  ordem_dca: string;
  ordem_dcd: string;
  ordem_dcim: string;
  status_ov_sap: number;
  pep: string;
  executado: number;
  mun: string;
  atraso: number;
  data_conclusao: Date;
  tipo_obra: string;
  qtde_planejada: number;
  qtde_pend: number;
  circuito: string;
  mo_planejada: number;
  turma: string;
  status: string;
  conjunto: string;
  abrev_regional: string;
  observ_obra: string | null;
  ano_plan: number;
};

export type CompletedWorkTotals = {
  total_obras: number;
  total_mo_planejada: number;
  total_mo_exec: number;
  total_qtde_planejada: number;
  total_qtde_pend: number;
};

export type CompletedWorksRepositoryResponse = {
  works: CompletedWorkItem[];
  totals: CompletedWorkTotals;
};
