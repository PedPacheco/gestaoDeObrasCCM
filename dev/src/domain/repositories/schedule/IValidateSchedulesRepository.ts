import { Prisma } from '@prisma/client';
import {
  ConfirmSchedulesDTO,
  ValidateSchedulesDTO,
} from 'src/interface/dtos/scheduleDTO';

export interface IValidateAndConfirmSchedulesRepository {
  validate(
    data: ValidateSchedulesDTO[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
  confirm(
    data: ConfirmSchedulesDTO[],
    tx: Prisma.TransactionClient,
  ): Promise<void>;
}

export const VALIDATE_AND_CONFIRM_SCHEDULES_REPOSITORY = Symbol(
  'ValidateAndConfirmSchedulesRepository',
);
