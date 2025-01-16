interface GetScheduleValuesInterface {
  id: number;
  ovnota: string;
  ordemdiagrama: string;
  diagrama: string | null;
  mun: string;
  entrada: string;
  prazo_fim: string;
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
  num_dp: string | null;
  hora_ini: string;
  hora_ter: string;
  equipe_linha_morta: number;
  equipe_linha_viva: number;
  equipe_regularizacao: number;
  id_tecnico: number;
  conjunto: string;
  circuito: string;
  total_obras: number;
  total_mo_planejada: number;
  total_qtde_planejada: number;
}

export interface GetScheduleValuesResponse {
  works: GetScheduleValuesInterface[];
  totalRecords: number;
}
