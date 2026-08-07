import {
  GetSelectedServicesParamsInterface,
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryResponse,
  GetServiceOptionsResponse,
  GetServicesSelectedByWorkIdResponse,
} from 'src/interface/types/servicesInterface';

export interface IWorkServicesQueryRepository {
  getAllServicesOfWork(id: number): Promise<GetServicesByWorkIdResponse[]>;
  getNotScheduledServices(id: number): Promise<GetServicesByWorkIdResponse[]>;
  getSelectedServices({
    id,
    idProgramacao,
  }: GetSelectedServicesParamsInterface): Promise<
    GetServicesSelectedByWorkIdResponse[]
  >;
  getServiceScheduleHistory(
    id: number,
  ): Promise<GetServiceScheduleHistoryResponse[]>;
  getServicesContracts(idParceira: number): Promise<any[]>;
  getMaterialsContract(): Promise<any[]>;
  getTeamsServices(idParceira: number): Promise<any[]>;
  getServiceOptions(id: number): Promise<GetServiceOptionsResponse>;
}

export const WORK_SERVICES_QUERY_REPOSITORY = Symbol(
  'WorkServicesQueryRepository',
);
