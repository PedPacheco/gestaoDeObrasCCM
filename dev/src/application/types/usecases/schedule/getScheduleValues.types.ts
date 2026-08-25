import {
  GetScheduleValuesResponseItem,
  GetScheduleValuesTotals,
} from 'src/domain/types';

export type GetScheduleValuesInput = {
  dataInicial?: string;
  dataFinal?: string;
  idRegional?: number[];
  idMunicipio?: number[];
  idGrupo?: number[];
  idTipo?: number[];
  idParceira?: number[];
  idStatus?: number[];
  idStatusProgramacao?: number[];
  idStatusSap?: number[];
  ovnota?: string;
  executado: boolean;
  pendente: boolean;
  page?: number;
};

export type GetScheduleValuesOutput = {
  works: GetScheduleValuesResponseItem[];
  totals: GetScheduleValuesTotals;
};

export type ScheduleForecastInput = {
  prog: number;
  exec: number | null;
  executado: number;
  capex_mat_pend: number;
  capex_mo_pend: number;
};

export type ScheduleForecastOutput = {
  serviceCapexForecast: number;
  materialCapexForecast: number;
  forecastTotal: number;
};

export type ScheduleRestrictionData = {
  id_restricao_prog1: number;
  id_restricao_prog2: number;
  status_restricao1: string;
  status_restricao2: string;
  data_resolucao1: Date | null;
  data_resolucao2: Date | null;
};

export type GetScheduleValuesFormattedTotals = {
  total_obras: number;
  total_mo_planejada: number;
  total_mo_exec: number;
  total_qtde_planejada: number;
};
