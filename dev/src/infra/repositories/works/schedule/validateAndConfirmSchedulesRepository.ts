import { Injectable } from '@nestjs/common';

import { IValidateConfirmAndRejectSchedulesRepository } from 'src/domain/contracts/works/schedule/IValidateSchedulesRepository';
import { Prisma } from 'src/infra/generated/prisma/client';
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
    await tx.programacoes_reprovacoes.create({
      data: {
        id_obra: data.workId,
        motivo: data.reason,
        descricao: data.description,
        data_prog: data.dataProg,
        prog: data.prog,
        equip_desligado: data.equipment,
        hora_ini: data.startTime,
        hora_ter: data.finishTime,
        equipe_linha_viva: data.lvTeam,
        equipe_linha_morta: data.lmTeam,
        equipe_regularizacao: data.regulTeam,
        tipo_servico: data.serviceType,
        observacao_programacao: data.observation,
      },
    });

    await tx.programacoes.update({
      where: { id: data.id },
      data: {
        reprovada: data.reject,
        confirmada: false,
        validada: false,
        id_status_programacao: 7,
      },
    });
  }
}
