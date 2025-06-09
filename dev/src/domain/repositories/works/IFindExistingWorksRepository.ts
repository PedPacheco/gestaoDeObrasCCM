export interface filtersOrders {
  ordem_dci: string | null;
  ordem_dcd: string | null;
  ordem_dca: string | null;
  ordem_dcim: string | null;
}

export interface IFindExistingWorksRepository {
  findExistingMarketWorks(marketEntry: string[]): Promise<string[]>;
  findExistingNotes(note: string[]): Promise<string[]>;
  findExistingOrders(orders: filtersOrders[]): Promise<string[]>;
}

export const FIND_EXISITING_WORKS_REPOSITORY = Symbol(
  'FindExistingWorksRepository',
);
