import * as moment from 'moment';
import { GetPendingScheduleValuesDTO } from 'src/config/dto/scheduleDTO';
import { PrismaService } from 'src/config/prisma/prisma.service';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GetPendingScheduleValuesResponse } from 'src/interfaces/getPendingScheduleValuesInterface';

@Injectable()
export class GetPendingScheduleValuesService {
  constructor(private prisma: PrismaService) {}

  async getValues(
    filters: GetPendingScheduleValuesDTO,
  ): Promise<GetPendingScheduleValuesResponse> {
    const { idParceira, idRegional, page } = filters;

    let query = Prisma.sql`SELECT obras.id, ovnota, COALESCE(diagrama, COALESCE(ordem_dci, ordem_dcim)) AS ordemdiagrama, diagrama, mun, entrada, tipo_obra, qtde_planejada, 
                mo_planejada, turma, executado, data_prog, prog, observ_programacao, mo_planejada*prog/100 AS mo_prog
                FROM construcao_sp.obras
                INNER JOIN construcao_sp.programacoes ON programacoes.id_obra = obras.id
                INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm
                INNER JOIN construcao_sp.regionais ON regionais.id = municipios.id_regional
                INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo
                INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma
                WHERE exec IS NULL AND data_prog < CURRENT_DATE`;

    if (idParceira) {
      query = Prisma.sql`${query} AND id_turma IN (${Prisma.join(idParceira)})`;
    }

    if (idRegional) {
      query = Prisma.sql`${query} AND municipios.id_regional IN (${Prisma.join(idRegional)})`;
    }

    query = Prisma.sql`${query} ORDER BY data_prog`;

    if (page !== null) {
      query = Prisma.sql`${query} LIMIT 200 OFFSET ${page * 200}`;
    }

    const currentDate = moment.utc().toDate();

    const [works, totalRecords] = await Promise.all([
      this.prisma.$queryRaw(query),
      this.prisma.obras.count({
        where: {
          programacoes: {
            some: { exec: null, data_prog: { lt: currentDate } },
          },
          municipios: {
            id_regional: idRegional ? { in: idRegional } : undefined,
          },
          id_turma: idParceira ? { in: idParceira } : undefined,
        },
      }),
    ]);

    const response: GetPendingScheduleValuesResponse = { works, totalRecords };

    return response;
  }
}
