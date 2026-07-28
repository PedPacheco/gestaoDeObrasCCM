import { Prisma } from '@prisma/client';
import {
  AddServicesDTO,
  ApplyAdditonalDTO,
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
  getServicesFilters(id: number): Promise<GetServicesFiltersResponse>;
  getServicesContracts(idParceira: number): Promise<any[]>;
  getMaterialsContract(): Promise<any[]>;
  getTeamsServices(idParceira: number): Promise<any[]>;
  scheduleServices(data: ScheduleServicesDTO[], prog: any): Promise<void>;
  applyAdditional(data: ApplyAdditonalDTO[]): Promise<void>;
  finalizeServices(data: any, tx: Prisma.TransactionClient): Promise<void>;
  performServices(data: PerformServicesDTO[]): Promise<void>;
  reascheduleServices(data: { id: number }[]): Promise<void>;
  cancelServices(id: number): Promise<void>;
  addServices(data: AddServicesDTO): Promise<void>;
  addMaterials(data: AddServicesDTO): Promise<void>;
}

export const WORKS_SERVICE_REPOSITORY = Symbol('WorksServiceRepository');
