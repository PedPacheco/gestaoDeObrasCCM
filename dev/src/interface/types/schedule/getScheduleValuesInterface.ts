export interface GetScheduleValuesInterface {
  id: number;
  ovnota: string;
  ordemdiagrama: string;
  diagrama: string | null;
  mun: string;
  prazo_fim: string;
  id_grupo: number;
  tipo_obra: string;
  qtde_planejada: string;
  mo_planejada: string;
  turma: string;
  executado: number;
  data_prog: string;
  prog: number;
  exec: number | null;
  observprog: string | null;
  mo_prog: number;
  mo_exec: number;
  mat_prog: number;
  num_dp: string | null;
  hora_ini: string;
  hora_ter: string;
  equipe_linha_morta: number;
  equipe_linha_viva: number;
  equipe_regularizacao: number;
  id_tecnico: number;
  conjunto: string;
  circuito: string;
  status_programacao: string;
  status: string;
  id_restricao_prog1: number;
  id_restricao_prog2: number;
  data_resolucao1: Date;
  data_resolucao2: Date;
  status_restricao1: string;
  status_restricao2: string;
  restricao_aberta: boolean;
  status_prazo: string;
}

export interface totalsGetScheduleValues {
  total_obras: number;
  total_mo_planejada: number;
  total_mo_exec: number;
  total_qtde_planejada: number;
}

export interface GetScheduleValuesResponseRepository {
  works: GetScheduleValuesInterface[];
  resultTotals: totalsGetScheduleValues[];
}

export interface GetScheduleValuesResponse {
  works: GetScheduleValuesInterface[];
  totals: totalsGetScheduleValues;
}
