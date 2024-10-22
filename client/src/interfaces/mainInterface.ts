export interface MainInterface<FiltersType> {
  filters: FiltersType;
  data: any;
  token: string;
  columns?: Record<string, string>;
}
