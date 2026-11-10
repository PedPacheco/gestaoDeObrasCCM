import { Partners, Types } from 'src/interface/types/common/commonInterface';

export type GetMonthlySummaryForecastResponse = {
  obras: {
    ovnota: string;
    ordem_dci: string;
    ordem_dca: string;
    ordem_dcd: string;
    ordem_dcim: string;
    capex_mat_plan: number;
    capex_mat_pend: number;
    capex_mo_plan: number;
    capex_mo_pend: number;
    executado: number;
    turmas: Partners;
    tipos: Types;
  };
  prog: number;
  exec: number;
  data_prog: Date;
  equipe_linha_morta: number;
  equipe_linha_viva: number;
  equipe_regularizacao: number;
};

export type GetCapexPlanResponse = {
  grupos: { grupo: string };
  regionais: { regional: string };
  ano_plano: number;
  valor_jan: number;
  valor_fev: number;
  valor_mar: number;
  valor_abr: number;
  valor_mai: number;
  valor_jun: number;
  valor_jul: number;
  valor_ago: number;
  valor_set: number;
  valor_out: number;
  valor_nov: number;
  valor_dez: number;
};
