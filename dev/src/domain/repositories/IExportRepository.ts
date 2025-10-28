export interface IExportWorksInPortFolioRepository {
  export(): Promise<any>;
}

export const EXPORT_WORKS_IN_PORTFOLIO_REPOSITORY = Symbol(
  'ExportWorksInPortFolioRepository',
);
