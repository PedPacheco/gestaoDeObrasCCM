import { Partners, Schedules, Types } from '../common/commonInterface';

export interface GetMonthlySummaryForecastInterface {
  obras: {
    capex_mat_plan: number;
    capex_mat_pend: number;
    capex_mo_plan: number;
    capex_mo_pend: number;
  };
  prog: number;
  exec: number;
  data_prog: Date;
}

export interface GetSecondMonthlySummaryForecastInterface {
  ovnota: string;
  ordem_dci: string;
  ordem_dca: string;
  ordem_dcd: string;
  ordem_dcim: string;
  capex_mat_plan: number;
  capex_mat_pend: number;
  capex_mo_plan: number;
  capex_mo_pend: number;
  turmas: Partners;
  tipos: Types;
  programacoes: Schedules[];
}
