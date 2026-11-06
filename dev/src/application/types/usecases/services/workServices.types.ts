export type ScheduleServicesInput = {
  id: number;
  idTeam: number;
  idSchedule?: number;
  type: 'M' | 'S';
  operation: string;
  point: string;
  prog: number;
  additional?: number;
};

export type ApplyAdditionalInput = {
  id: number;
  additional: number;
};

export type AddServiceInput = {
  idWork: number;
  idService: number;
  type?: 'M' | 'S';
  point: string;
  operation: string;
  operationDescription: string;
  quantity: number;
};
