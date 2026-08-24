export interface filtersOrders {
  ordem_dci: string | null;
  ordem_dcd: string | null;
  ordem_dca: string | null;
  ordem_dcim: string | null;
}

export interface IFindExistingWorksRepository {
  findExistingWorks(works: string[]): Promise<{ id: number; ovnota: string }[]>;
  findExistingWorksOnSuspension(
    works: { ovnota: string; ordemDiagrama: string }[],
  ): Promise<{ id: number; ovnota: string }[]>;
  findExistingNotes(filters: any[]): Promise<
    {
      id: number;
      ovnota: string;
      ordemDci: string;
      ordemDcd: string;
      ordemDca: string;
      ordemDcim: string;
    }[]
  >;
  findExistingOrders(orders: filtersOrders[]): Promise<string[]>;
}

export const FIND_EXISITING_WORKS_REPOSITORY = Symbol(
  'FindExistingWorksRepository',
);
