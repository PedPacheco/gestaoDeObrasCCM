import {
  AddServicesDTO,
  ApplyAdditonalDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';

export interface IWorkServicesRepository {
  scheduleServices(
    data: ScheduleServicesDTO[],
    prog: number | { increment: number },
    idSchedule: number,
  ): Promise<void>;
  applyAdditional(data: ApplyAdditonalDTO[]): Promise<void>;
  reascheduleServices(
    data: { id: number; id_servico: number }[],
    scheduleId: number,
  ): Promise<void>;
  cancelServices(id: number): Promise<void>;
  addServices(data: AddServicesDTO): Promise<void>;
  addMaterials(data: AddServicesDTO): Promise<void>;
}

export const WORK_SERVICES_REPOSITORY = Symbol('WorkServicesRepository');
