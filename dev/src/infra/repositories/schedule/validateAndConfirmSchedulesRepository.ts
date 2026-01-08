import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IValidateConfirmAndRejectSchedulesRepository } from 'src/domain/repositories/schedule/IValidateSchedulesRepository';
import {
  ConfirmSchedulesDTO,
  ValidateSchedulesDTO,
} from 'src/interface/dtos/scheduleDTO';

@Injectable()
export class ValidateAndConfirmSchedulesRepository implements IValidateConfirmAndRejectSchedulesRepository {
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

  async reject(data: any, tx: Prisma.TransactionClient): Promise<void> {
    try {
      await tx.programacoes_reprovacoes.create({
        data: {
          id_obra: data.id_obra,
          motivo: data.reason,
          descricao: data.description,
          data_prog: data.data_prog,
          prog: data.prog,
          equip_desligado: data.equip_desligado,
          hora_ini: data.hora_ini,
          hora_ter: data.hora_ter,
          equipe_linha_viva: data.equipe_linha_viva,
          equipe_linha_morta: data.equipe_linha_morta,
          equipe_regularizacao: data.equipe_regularizacao,
          tipo_servico: data.tipo_servico,
          observacao_programacao: data.observacao_programacao,
        },
      });

      await tx.programacoes.update({
        where: { id: data.id },
        data: {
          reprovada: data.reject,
          id_status_programacao: 7,
        },
      });
    } catch (error) {
      throw error;
    }
  }
}
