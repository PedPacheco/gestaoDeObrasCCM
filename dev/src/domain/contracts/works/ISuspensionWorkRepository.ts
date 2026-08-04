import { SuspensionWorkRequestInterface } from 'src/interface/types/works/suspensionInterface';

export interface ISuspensionWorkRepository {
  create(data: SuspensionWorkRequestInterface): Promise<any>;
  createMultiple(data: SuspensionWorkRequestInterface[]): Promise<any>;
}

export const SUSPENSION_WORK_REPOSITORY = Symbol('SuspensionWorkRepository');
