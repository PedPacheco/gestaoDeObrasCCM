export interface IFiltersRepository {
  getData<T>(
    table: string,
    selectFields: string[],
    conditions?: Record<string, unknown>,
  ): Promise<T[]>;
}

export const FILTERS_REPOSITORY = Symbol('FiltersRepository');
