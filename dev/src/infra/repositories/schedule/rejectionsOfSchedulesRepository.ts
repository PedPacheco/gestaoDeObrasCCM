import { PrismaService } from 'src/infra/prisma/prisma.service';

import { Injectable } from '@nestjs/common';

import { IRejectionOfSchedulesRepository } from 'src/domain/repositories/schedule/IRejectionsOfSchedules';

@Injectable()
export class RejectionsOfSchedulesRepository implements IRejectionOfSchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(idWork): Promise<any> {
    const value = idWork.toString();

    return await this.prisma.programacoes_reprovacoes.findMany({
      where: {
        obras: {
          OR: [
            { id: value.length >= 10 ? undefined : idWork },
            { ovnota: value },
            { ordem_dci: value },
            { ordem_dcd: value },
            { ordem_dca: value },
            { ordem_dcim: value },
            { diagrama: value },
          ],
        },
      },
      select: {
        motivo: true,
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
      },
    });
  }
}
