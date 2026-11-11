import { SuspensionWorkRequestInterface } from 'src/interface/types/works/suspensionInterface';

export interface ISuspensionWorkRepository {
  create(data: SuspensionWorkRequestInterface): Promise<void>;
  createMultiple(data: SuspensionWorkRequestInterface[]): Promise<void>;
}

export const SUSPENSION_WORK_REPOSITORY = Symbol('SuspensionWorkRepository');
