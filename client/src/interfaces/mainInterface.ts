export interface MainInterface<FiltersType> {
  filtersData: FiltersType;
  data: any;
  token: string;
  columns: Record<string, string>;
}
