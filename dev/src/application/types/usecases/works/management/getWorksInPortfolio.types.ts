export type GetWorksInPorfolioItem = {
  id: number;
  ovnota: string;
  ordem_principal: string;
  ordem_dca: string;
  ordem_dcd: string;
  ordem_dcim: string;
  status_ov_sap: number;
  pep: string;
  executado: number;
  mun: string;
  prazo: number;
  prazo_fim: number;
  tipo_obra: string;
  id_grupo: number;
  qtde_planejada: number;
  contagem_ocorrencias: number;
  total_prog: number;
  total_exec: number;
  total_pend: number;
  total_equipe_lm: number;
  total_equipe_lv: number;
  total_equipe_reg: number;
  qtde_pend: number;
  circuito: string;
  mo_planejada: number;
  mo_exec: number;
  mo_pend: number;
  id_status: number;
  status: string;
  conjunto: string;
  abrev_regional: string;
  data_empreitamento: Date;
  empreendimento: string;
  turma: string;
  ano_plan: number;
  status_prazo: string;
  encontrado: boolean;
};

export type GetWorksInPortfolioTotals = {
  total_obras: number;
  total_mo_planejada: number;
  total_mo_exec: number;
  total_mo_pend: number;
  total_qtde_planejada: number;
  total_qtde_pend: number;
};

export type GetWorksInPortfolioOutput = {
  works: GetWorksInPorfolioItem[];
  totals: GetWorksInPortfolioTotals;
};
