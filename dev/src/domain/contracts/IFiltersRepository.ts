export interface IFiltersRepository {
  getData(
    table: string,
    selectFields: string[],
    conditions?: Record<string, any>,
  ): Promise<any[]>;
}

export const FILTERS_REPOSITORY = Symbol('FiltersRepository');
