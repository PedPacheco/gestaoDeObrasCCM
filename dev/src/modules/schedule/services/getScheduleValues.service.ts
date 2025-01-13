import * as moment from 'moment';
import { GetScheduleValuesDTO } from 'src/config/dto/scheduleDTO';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { GetScheduleValuesResponse } from 'src/interfaces/getScheduleValuesInterface';
import { calculateTotals } from 'src/utils/calculateTotals';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class GetScheduleValuesService {
  constructor(private prisma: PrismaService) {}

  async getValues(
    filters: GetScheduleValuesDTO,
  ): Promise<GetScheduleValuesResponse> {
    const {
      data,
      page,
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
                mo_planejada, turma, executado, data_prog, prog, exec, observ_programacao, mo_planejada*prog/100 AS mo_prog, mo_planejada*COALESCE(exec, 100)/100 AS mo_exec,
                num_dp, hora_ini, hora_ter, equipe_linha_morta, equipe_linha_viva, equipe_regularizacao, id_tecnico, conjunto, circuito
                FROM construcao_sp.obras
                INNER JOIN construcao_sp.circuitos ON circuitos.id = obras.id_circuito
                INNER JOIN construcao_sp.conjuntos ON conjuntos.id = circuitos.id_conjunto
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
      query = Prisma.sql`${query} AND municipios.id_regional IN (${Prisma.join(idRegional)})`;
    }

    if (idMunicipio) {
      query = Prisma.sql`${query} AND municipios.id IN (${Prisma.join(idMunicipio)})`;
    }

    if (idTipo) {
      query = Prisma.sql`${query} AND id_tipo IN (${Prisma.join(idTipo)})`;
    }

    if (idParceira) {
      query = Prisma.sql`${query} AND id_turma IN (${Prisma.join(idParceira)})`;
    }

    if (idGrupo) {
      query = Prisma.sql`${query} AND tipos.id_grupo IN (${Prisma.join(idGrupo)})`;
    }

    if (executado) {
      query = Prisma.sql`${query} AND exec <> 0`;
    } else {
      query = Prisma.sql`${query} AND exec IS NULL`;
    }

    query = Prisma.sql`${query} ORDER BY data_prog, ovnota`;

    if (page) {
      query = Prisma.sql`${query} LIMIT 200 OFFSET ${page * 200}`;
    }

    const startDate = moment
      .utc(`${year}-${month}`, 'YYYY-MM')
      .startOf('month')
      .toDate();
    const endDate = moment
      .utc(`${year}-${month}`, 'YYYY-MM')
      .endOf('month')
      .toDate();

    const [result, totalRecords] = await Promise.all([
      this.prisma.$queryRaw(query),
      this.prisma.obras.count({
        where: {
          programacoes: {
            some: {
              exec: executado ? { not: null } : null,
              data_prog:
                tipoFiltro === 'month'
                  ? { gte: startDate, lte: endDate }
                  : { equals: data },
            },
          },
          municipios: {
            id_regional: idRegional ? { in: idRegional } : undefined,
          },
          id_tipo: idTipo ? { in: idTipo } : undefined,
          id_turma: idParceira ? { in: idParceira } : undefined,
          tipos: {
            id_grupo: idGrupo ? { in: idGrupo } : undefined,
          },
          id_gpm: idMunicipio ? { in: idMunicipio } : undefined,
        },
      }),
    ]);

    const works = calculateTotals(result, {
      total_mo_planejada: true,
      total_qtde_planejada: true,
    });

    const response: any = {
      works,
      totalRecords,
    };

    return response;
  }
}
