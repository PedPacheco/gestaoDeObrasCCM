import { Prisma } from '@prisma/client';
import {
  GetMaterialsContractsResponse,
  GetSelectedServicesParamsRequest,
  GetServiceOptionsResponse,
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryResponse,
  GetServicesContractsResponse,
  GetServicesSelectedByWorkIdResponse,
  GetTeamsServicesResponse,
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
