export interface Partners {
  turma: string;
}

export interface Groups {
  grupo: string;
}

export interface Types {
  id_grupo?: number;
  grupos: Groups;
}

export interface Schedules {
  data_prog: Date;
  prog: number;
  exec: number;
}
