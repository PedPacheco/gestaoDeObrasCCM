import { Prisma } from '@prisma/client';
import {
  GetMaterialsContractsResponse,
  GetSelectedServicesParamsRequest,
  GetServiceOptionsResponse,
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryByIdScheduleResponse,
  GetServiceScheduleHistoryResponse,
  GetServicesContractsResponse,
  GetServicesSelectedByWorkIdResponse,
  GetTeamsServicesResponse,
  WorkToExportResponse,
} from 'src/domain/types';

export interface IWorkServicesQueryRepository {
  getAllServicesOfWork(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetServicesByWorkIdResponse[]>;
  getNotScheduledServices(id: number): Promise<GetServicesByWorkIdResponse[]>;
  getSelectedServices({
    id,
    idProgramacao,
  }: GetSelectedServicesParamsRequest): Promise<
    GetServicesSelectedByWorkIdResponse[]
  >;
  getServiceScheduleHistory(
    id: number,
    tx?: Prisma.TransactionClient,
  ): Promise<GetServiceScheduleHistoryResponse[]>;
  getServiceScheduleHistoryByIdSchedule(
    ids: number[],
  ): Promise<GetServiceScheduleHistoryByIdScheduleResponse[]>;
  getServicesToExportation(params: {
    dataFinal: string;
    dataInicial: string;
    idParceira: number[];
    idEquipe?: number[];
  }): Promise<WorkToExportResponse[]>;
  getServicesContracts(
    idParceira: number,
  ): Promise<GetServicesContractsResponse[]>;
  getMaterialsContract(): Promise<GetMaterialsContractsResponse[]>;
  getTeamsServices(idParceira: number): Promise<GetTeamsServicesResponse[]>;
  getServiceOptions(id: number): Promise<GetServiceOptionsResponse>;
}

export const WORK_SERVICES_QUERY_REPOSITORY = Symbol(
  'WorkServicesQueryRepository',
);
