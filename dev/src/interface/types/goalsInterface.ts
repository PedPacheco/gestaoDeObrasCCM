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
  empreendimento?: string;
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

export interface goalsInterfaceRepository {
  id_tipo: number;
  tipo_obra: string;
  turma: string;
  regional: string;
  empreendimento?: string;
  anocalc: number;
  jan: number;
  fev: number;
  mar: number;
  abr: number;
  mai: number;
  jun: number;
  jul: number;
  ago: number;
  set: number;
  out: number;
  nov: number;
  dez: number;
  carteira: number;
}

export interface GoalsIntefaceController {
  statusCode: number;
  message: string;
  data: Goals[];
}
