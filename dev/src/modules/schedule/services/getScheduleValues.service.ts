import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { GetScheduleValuesDTO } from 'src/config/dto/scheduleDTO';
import { PrismaService } from 'src/config/prisma/prisma.service';
import * as moment from 'moment';
import { calculateTotals } from 'src/utils/calculateTotals';

@Injectable()
export class GetScheduleValuesService {
  constructor(private prisma: PrismaService) {}

  async getValues(filters: GetScheduleValuesDTO) {
    const {
      data,
      executado,
      idGrupo,
      idParceira,
      idRegional,
      idTipo,
      idMunicipio,
      tipoFiltro,
    } = filters;

    const month = data?.split('/')[0];
    const year = data?.split('/')[1];

    let query = Prisma.sql`SELECT obras.id, ovnota, COALESCE(diagrama, ordem_dci, ordem_dcim) AS ordemdiagrama, diagrama, mun, entrada, entrada + prazo AS prazo_fim, tipo_obra, qtde_planejada,
                 mo_planejada, turma, executado, data_prog, prog, exec, observ_programacao, mo_planejada*prog/100 AS mo_prog, mo_planejada*COALESCE(exec, 100)/100 AS mo_exec, data_prog,
                num_dp, hora_ini, hora_ter, equipe_linha_morta, equipe_linha_viva, equipe_regularizacao, id_tecnico
                FROM construcao_sp.obras
                INNER JOIN construcao_sp.programacoes ON programacoes.id_obra = obras.id
                INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm
                INNER JOIN construcao_sp.regionais ON regionais.id = municipios.id_regional
                INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo
                INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma
                WHERE 1=1`;

    if (tipoFiltro === 'month' && data) {
      query = Prisma.sql`${query} AND EXTRACT(MONTH FROM data_prog) = ${parseInt(month)} AND EXTRACT(YEAR FROM data_prog) = ${parseInt(year)}`;
    }

    if (tipoFiltro === 'day' && data) {
      query = Prisma.sql`${query} AND data_prog = ${moment(data, 'DD/MM/YYYY', true).toDate()}`;
    }

    if (idRegional) {
      query = Prisma.sql`${query} AND municipios.id_regional = ${idRegional}`;
    }

    if (idMunicipio) {
      query = Prisma.sql`${query} AND municipios.id = ${idMunicipio}`;
    }

    if (idTipo) {
      query = Prisma.sql`${query} AND id_tipo = ${idTipo}`;
    }

    if (idParceira) {
      query = Prisma.sql`${query} AND id_turma = ${idParceira}`;
    }

    if (idGrupo) {
      query = Prisma.sql`${query} AND tipos.id_grupo = ${idGrupo}`;
    }

    if (executado) {
      query = Prisma.sql`${query} AND exec IS NOT NULL`;
    } else {
      query = Prisma.sql`${query} AND exec IS NULL`;
    }

    query = Prisma.sql`${query} ORDER BY data_prog, ovnota`;

    const result = await this.prisma.$queryRaw(query);

    return calculateTotals(result, {
      total_mo_planejada: true,
      total_qtde_planejada: true,
    });
  }
}
