import {
  GetAllServicesOfWorkInterface,
  GetByIdParamsInterface,
  GetSelectedServicesParamsInterface,
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryResponse,
  GetServicesSelectedByWorkIdResponse,
} from 'src/interface/types/servicesInterface';

export interface IWorkServicesQueryRepository {
  getAllMaterialsOfWork(id: number): Promise<any[]>;
  getAllServicesOfWork(id: number): Promise<GetAllServicesOfWorkInterface[]>;
  getNotScheduledServices({
    id,
    operation,
    point,
    service,
  }: GetByIdParamsInterface): Promise<GetServicesByWorkIdResponse[]>;
  getSelectedServices({
    id,
    idProgramacao,
    operation,
    point,
    service,
  }: GetSelectedServicesParamsInterface): Promise<
    GetServicesSelectedByWorkIdResponse[]
  >;
  getServiceScheduleHistory(
    id: number,
  ): Promise<GetServiceScheduleHistoryResponse[]>;
  getServicesContracts(idParceira: number): Promise<any[]>;
  getMaterialsContract(): Promise<any[]>;
  getTeamsServices(idParceira: number): Promise<any[]>;
}

export const WORK_SERVICES_QUERY_REPOSITORY = Symbol(
  'WorkServicesQueryRepository',
);
