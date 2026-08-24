export type GoalMonth = {
  meta: number;
  prog: number;
  real: number;
};

export type GoalGroupedResponse = {
  id_tipo: number;
  id_parceira: number;
  id_regional: number;
  tipo_obra: string;
  turma: string;
  regional: string;
  anocalc: number;
  carteira: number;
  empreendimento?: string;
  jan: GoalMonth;
  fev: GoalMonth;
  mar: GoalMonth;
  abr: GoalMonth;
  mai: GoalMonth;
  jun: GoalMonth;
  jul: GoalMonth;
  ago: GoalMonth;
  set: GoalMonth;
  out: GoalMonth;
  nov: GoalMonth;
  dez: GoalMonth;
};
