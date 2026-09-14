import { ExistingNoteResponse, ExistingWorkResponse } from 'src/domain/types';

export interface filtersOrders {
  ordem_dci: string | null;
  ordem_dcd: string | null;
  ordem_dca: string | null;
  ordem_dcim: string | null;
}

export interface IFindExistingWorksRepository {
  findExistingWorks(works: string[]): Promise<ExistingWorkResponse[]>;
  findExistingWorksOnSuspension(
    works: { ovnota: string; ordemDiagrama: string }[],
  ): Promise<ExistingWorkResponse[]>;
  findExistingNotes(
    filters: { ovnota: string }[],
  ): Promise<ExistingNoteResponse[]>;
  findExistingOrders(orders: filtersOrders[]): Promise<string[]>;
}

export const FIND_EXISITING_WORKS_REPOSITORY = Symbol(
  'FindExistingWorksRepository',
);
