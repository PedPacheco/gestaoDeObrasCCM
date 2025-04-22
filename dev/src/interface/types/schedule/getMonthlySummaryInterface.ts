interface Works {
  mo_final: number;
  mo_planejada: number;
}

interface Partners {
  turma: string;
}

interface Groups {
  grupo: string;
}

interface Types {
  grupos: Groups;
}

interface Schedules {
  data_prog: Date;
  prog: number;
  exec: number;
}

export interface GetMonthlySummaryInterface {
  obras: Works;
  prog: number;
  exec: number;
  data_prog: Date;
}

export interface GetSecondMonthlySummaryInterface {
  ovnota: string;
  mo_final: number | null;
  mo_planejada: number | null;
  turmas: Partners;
  tipos: Types;
  programacoes: Schedules[];
}
