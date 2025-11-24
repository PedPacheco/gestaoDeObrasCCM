import { scheduleServicesDTO } from 'src/interface/dtos/workServicesDTO';
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
  getServicesFilters(id: number): Promise<GetServicesFiltersResponse>;
  getServicesContracts(idParceira: number): Promise<any[]>;
  getTeamsServices(idParceira: number): Promise<any[]>;
  scheduleServices(data: scheduleServicesDTO[]): Promise<void>;
}

export const WORKS_SERVICE_REPOSITORY = Symbol('WorksServiceRepository');
