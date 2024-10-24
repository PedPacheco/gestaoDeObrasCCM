import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GetPendingScheduleValuesDTO } from 'src/config/dto/scheduleDTO';
import { PrismaService } from 'src/config/prisma/prisma.service';

@Injectable()
export class GetPendingScheduleValuesService {
  constructor(private prisma: PrismaService) {}

  async getValues(filters: GetPendingScheduleValuesDTO) {
    const { idParceira, idRegional } = filters;

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
      query = Prisma.sql`${query} AND id_turma = ${idParceira}`;
    }

    if (idRegional) {
      query = Prisma.sql`${query} AND municipios.id_regional = ${idRegional}`;
    }

    query = Prisma.sql`${query} ORDER BY data_prog`;

    return await this.prisma.$queryRaw(query);
  }
}
