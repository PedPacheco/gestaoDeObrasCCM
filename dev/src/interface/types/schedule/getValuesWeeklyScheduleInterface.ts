import { Partners } from '../common/commonInterface';

interface Types {
  tipo_abrev: string;
}

export interface Schedules {
  data_prog: Date;
  hora_ini: Date;
  hora_ter: Date;
}

export interface GetValuesWeeklyScheduleResponseRepository {
  id: number;
  ovnota: string;
  tipos: Types;
  programacoes: Schedules[];
  turmas: Partners;
}

export interface GetValuesWeeklyScheduleResponseService {
  id: number;
  ovnota: string;
  tipo_abrev: string;
  programacoes: Schedules[];
  parceira: string;
}
