import { Prisma } from '@prisma/client';
import {
  PerformServicesDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';
import {
  GetAllServicesOfWorkInterface,
  GetByIdParamsInterface,
  GetSelectedServicesParamsInterface,
  GetServicesByWorkIdResponse,
  GetServiceScheduleHistoryResponse,
  GetServicesFiltersResponse,
  GetServicesSelectedByWorkIdResponse,
} from 'src/interface/types/servicesInterface';

export interface IWorksServicesRepository {
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
  getServicesFilters(id: number): Promise<GetServicesFiltersResponse>;
  getServicesContracts(idParceira: number): Promise<any[]>;
  getTeamsServices(idParceira: number): Promise<any[]>;
  scheduleServices(data: ScheduleServicesDTO[], prog: any): Promise<void>;
  finalizeServices(data: any, tx: Prisma.TransactionClient): Promise<void>;
  performServices(data: PerformServicesDTO[]): Promise<void>;
  reascheduleServices(data: { id: number }[]): Promise<void>;
  cancel(id: number): Promise<void>;
}

export const WORKS_SERVICE_REPOSITORY = Symbol('WorksServiceRepository');
