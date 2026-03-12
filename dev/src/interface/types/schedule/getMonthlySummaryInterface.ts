import { Partners, Schedules, Types } from '../common/commonInterface';

export interface GetMonthlySummaryInterface {
  obras: { mo_planejada: number };
  prog: number;
  exec: number;
  data_prog: Date;
  equipe_linha_morta: number;
  equipe_linha_viva: number;
  equipe_regularizacao: number;
}

export interface GetSecondMonthlySummaryInterface {
  ovnota: string;
  ordem_dci: string;
  ordem_dca: string;
  ordem_dcd: string;
  ordem_dcim: string;
  mo_planejada: number | null;
  turmas: Partners;
  tipos: Types;
  programacoes: Schedules[];
}
