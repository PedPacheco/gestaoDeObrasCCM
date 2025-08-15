import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IValidateAndConfirmSchedulesRepository } from 'src/domain/repositories/schedule/IValidateSchedulesRepository';
import {
  ConfirmSchedulesDTO,
  ValidateSchedulesDTO,
} from 'src/interface/dtos/scheduleDTO';

@Injectable()
export class ValidateAndConfirmSchedulesRepository
  implements IValidateAndConfirmSchedulesRepository
{
  constructor() {}

  async validate(
    data: ValidateSchedulesDTO[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.programacoes.updateMany({
      where: {
        id: { in: data.filter((item) => item.validate).map((item) => item.id) },
      },
      data: {
        id_status_programacao: 2,
        validada: true,
      },
    });
  }

  async confirm(
    data: ConfirmSchedulesDTO[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.programacoes.updateMany({
      where: {
        id: { in: data.filter((item) => item.confirm).map((item) => item.id) },
      },
      data: {
        id_status_programacao: 3,
        confirmada: true,
      },
    });
  }
}
