export type GetTotalValuesSchedulesInput = {
  idRegional?: number[];
  idMunicipio?: number[];
  idGrupo?: number[];
  idTipo?: number[];
  idParceira?: number[];
  idCircuito?: number[];
  ano: number;
};

export type ScheduleMonthValues = {
  prog: number;
  exec: number;
};

export type GetTotalValuesScheduleOutput = {
  turma: string;
  jan: ScheduleMonthValues;
  fev: ScheduleMonthValues;
  mar: ScheduleMonthValues;
  abr: ScheduleMonthValues;
  mai: ScheduleMonthValues;
  jun: ScheduleMonthValues;
  jul: ScheduleMonthValues;
  ago: ScheduleMonthValues;
  set: ScheduleMonthValues;
  out: ScheduleMonthValues;
  nov: ScheduleMonthValues;
  dez: ScheduleMonthValues;
  total: ScheduleMonthValues;
};
