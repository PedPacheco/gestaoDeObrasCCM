export interface Pagination {
  skip: number;
  take: number;
}

/** from inclusivo, toExclusive exclusivo. */
export interface DateRange {
  from?: Date;
  toExclusive?: Date;
}
