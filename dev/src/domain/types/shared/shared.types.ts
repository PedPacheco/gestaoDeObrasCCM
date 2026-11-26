export interface Pagination {
  skip: number;
  take: number;
}

/** from inclusivo, toExclusive exclusivo. */
export interface DateRange {
  from?: Date;
  toExclusive?: Date;
}

export type Partners = {
  turma: string;
};

export type Types = {
  id_grupo: number;
  grupos: { grupo: string };
};
