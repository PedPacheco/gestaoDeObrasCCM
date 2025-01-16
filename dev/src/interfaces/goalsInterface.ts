interface valuesGoals {
  meta: number;
  prog: number;
  real: number;
}

export interface Goals {
  id_tipo: number;
  tipo_obra: string;
  turma: string;
  regional: string;
  anocalc: number;
  carteira: number;
  jan: valuesGoals;
  fev: valuesGoals;
  mar: valuesGoals;
  abr: valuesGoals;
  mai: valuesGoals;
  jun: valuesGoals;
  jul: valuesGoals;
  ago: valuesGoals;
  set: valuesGoals;
  out: valuesGoals;
  nov: valuesGoals;
  dez: valuesGoals;
}

export interface GoalsIntefaceController {
  statusCode: number;
  message: string;
  data: Goals[];
}
