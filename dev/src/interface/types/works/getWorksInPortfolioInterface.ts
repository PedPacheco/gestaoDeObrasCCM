export interface worksInPortfolioInterface {
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
  entrada: Date;
  prazo: number;
  prazo_fim: number;
  tipo_obra: string;
  qtde_planejada: number;
  contagem_ocorrencias: number;
  qtde_pend: number;
  circuito: string;
  mo_planejada: number;
  first_data_prog: Date;
  id_status: number;
  status: string;
  hora_ini: string;
  hora_ter: string;
  tipo_servico: string;
  chi: number;
  conjunto: string;
  equipe_linha_morta: number;
  equipe_linha_viva: number;
  equipe_regularizacao: number;
  abrev_regional: string;
  data_empreitamento: Date;
  empreendimento: string;
  turma: string;
  mo_exec?: number;
  mo_suspensa?: number;
  atraso?: boolean;
}

export interface totalsWorksInPortfolio {
  total_obras: number;
  total_mo_planejada: number;
  total_mo_exec: number;
  total_mo_suspensa: number;
  total_qtde_planejada: number;
  total_qtde_pend: number;
}

export interface worksInPortfolioResponseRepository {
  works: worksInPortfolioInterface[];
  totals: totalsWorksInPortfolio[];
}

export interface worksInPortfolioResponseService {
  works: worksInPortfolioInterface[];
  totals: totalsWorksInPortfolio;
}
