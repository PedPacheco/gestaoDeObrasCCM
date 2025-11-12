import {
  GetByIdParamsInterface,
  GetSelectedServicesParamsInterface,
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryResponse,
  GetServicesFiltersResponse,
  GetServicesSelectedByWorkIdResponse,
} from 'src/interface/types/servicesInterface';

export interface IWorksServicesRepository {
  getServices({
    id,
    operation,
    point,
    service,
  }: GetByIdParamsInterface): Promise<GetServicesByWorkIdResponse[]>;
  getSelectedServices({
    id,
    operation,
    point,
    service,
    dataProg,
  }: GetSelectedServicesParamsInterface): Promise<
    GetServicesSelectedByWorkIdResponse[]
  >;
  getServiceScheduleHistory(
    id: number,
  ): Promise<GetServiceScheduleHistoryResponse[]>;
  getServicesFilters(id: number): Promise<GetServicesFiltersResponse>;
  getAdditionalServices(): Promise<any[]>;
}

export const WORKS_SERVICE_REPOSITORY = Symbol('WorksServiceRepository');
