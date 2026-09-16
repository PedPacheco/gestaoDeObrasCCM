import { Prisma } from '@prisma/client';
import {
  GetSelectedServicesParamsInterface,
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryResponse,
  GetServiceOptionsResponse,
  GetServicesSelectedByWorkIdResponse,
  WorkToExportResponse,
} from 'src/interface/types/servicesInterface';

export interface IWorkServicesQueryRepository {
  getAllServicesOfWork(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetServicesByWorkIdResponse[]>;
  getNotScheduledServices(id: number): Promise<GetServicesByWorkIdResponse[]>;
  getSelectedServices({
    id,
    idProgramacao,
  }: GetSelectedServicesParamsInterface): Promise<
    GetServicesSelectedByWorkIdResponse[]
  >;
  getServiceScheduleHistory(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetServiceScheduleHistoryResponse[]>;
  getServiceScheduleHistoryByIdSchedule(ids: number[]): Promise<any[]>;
  getServicesToExportation(params: {
    dataFinal: string;
    dataInicial: string;
    idParceira: number[];
    idEquipe?: number[];
  }): Promise<WorkToExportResponse[]>;
  getServicesContracts(idParceira: number): Promise<any[]>;
  getMaterialsContract(): Promise<any[]>;
  getTeamsServices(idParceira: number): Promise<any[]>;
  getServiceOptions(id: number): Promise<GetServiceOptionsResponse>;
}

export const WORK_SERVICES_QUERY_REPOSITORY = Symbol(
  'WorkServicesQueryRepository',
);
