import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Injectable } from '@nestjs/common';

import { IRejectionOfSchedulesRepository } from 'src/domain/contracts/works/schedule/IRejectionsOfSchedules';
import { RejectionOfSchedulesGetResponse } from 'src/domain/types';
import { workIdentifierWhere } from 'src/infra/shared/workIdentifierWhere';

@Injectable()
export class RejectionsOfSchedulesRepository implements IRejectionOfSchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(idWork: number): Promise<RejectionOfSchedulesGetResponse[]> {
    return await this.prisma.programacoes_reprovacoes.findMany({
      where: {
        obras: workIdentifierWhere(idWork),
      },
      select: {
        data_prog: true,
        hora_ini: true,
        hora_ter: true,
        prog: true,
        descricao: true,
        equip_desligado: true,
        equipe_linha_morta: true,
        equipe_linha_viva: true,
        equipe_regularizacao: true,
        tipo_servico: true,
        observacao_programacao: true,
        restricoes: { select: { restricao: true } },
      },
    });
  }
}
