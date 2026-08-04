import { Prisma } from '@prisma/client';
import {
  ConfirmSchedulesDTO,
  ValidateSchedulesDTO,
} from 'src/interface/dtos/scheduleDTO';

export interface IValidateConfirmAndRejectSchedulesRepository {
  validate(
    data: ValidateSchedulesDTO[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  confirm(
    data: ConfirmSchedulesDTO[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  reject(data: any, tx: Prisma.TransactionClient): Promise<void>;
}

export const VALIDATE_CONFIRM_AND_REJECT_SCHEDULES_REPOSITORY = Symbol(
  'ValidateConfirmAndRejectSchedulesRepository',
);
