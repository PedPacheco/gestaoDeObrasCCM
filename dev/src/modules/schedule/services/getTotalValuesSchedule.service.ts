import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GetTotalValuesScheduleDTO } from 'src/config/dto/scheduleDTO';
import { PrismaService } from 'src/config/prisma/prisma.service';

@Injectable()
export class GetTotalValuesScheduleService {
  constructor(private prisma: PrismaService) {}

  async getTotalValues(filters: GetTotalValuesScheduleDTO) {
    const {
      idCircuito,
      idGrupo,
      idMunicipio,
      idParceira,
      idRegional,
      idTipo,
      ano,
    } = filters;

    let query = Prisma.sql`SELECT turma, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 1 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS jan_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 1 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS jan_exec, 
    SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 2 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS fev_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 2 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS fev_exec,  
    SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 3 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS mar_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 3 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS mar_exec,  
    SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 4 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS abr_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 4 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS abr_exec,  
    SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 5 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS mai_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 5 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS mai_exec,  
    SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 6 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS jun_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 6 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS jun_exec,  
    SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 7 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS jul_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 7 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS jul_exec,  
    SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 8 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS ago_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 8 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS ago_exec, 
    SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 9 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS set_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 9 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS set_exec,  
    SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 10 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS out_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 10 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS out_exec,  
    SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 11 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS nov_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 11 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS nov_exec,  
    SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 12 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*prog/100 ELSE mo_planejada*prog/100 END ELSE 0 END) AS dez_prog, SUM(CASE WHEN EXTRACT(MONTH FROM data_prog) = 12 THEN CASE WHEN mo_final IS NOT NULL THEN mo_final*exec/100 ELSE mo_planejada*exec/100 END ELSE 0 END) AS dez_exec,  
    SUM(COALESCE(mo_final, mo_planejada)*prog/100) AS total_prog, SUM(COALESCE(mo_final, mo_planejada)*exec/100) AS total_exec, EXTRACT(YEAR FROM data_prog) AS ano  
    FROM construcao_sp.obras INNER JOIN construcao_sp.programacoes ON programacoes.id_obra = obras.id INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm
    INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo INNER JOIN construcao_sp.grupos ON grupos.id = tipos.id_grupo
    WHERE 1=1`;

    if (idRegional) {
      query = Prisma.sql`${query} AND municipios.id_regional = ${idRegional}`;
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

    if (idMunicipio) {
      query = Prisma.sql`${query} AND municipios.id = ${idMunicipio}`;
    }

    if (idCircuito) {
      query = Prisma.sql`${query} AND id_circuito = ${idCircuito}`;
    }

    if (ano) {
      query = Prisma.sql`${query} AND EXTRACT(YEAR FROM data_prog) = ${ano}`;
    }

    query = Prisma.sql`${query} GROUP BY turma, EXTRACT(YEAR FROM data_prog) ORDER BY turma;`;

    const response: any[] = await this.prisma.$queryRaw(query);

    const months = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
      'total',
    ];

    const sum = response.reduce((acc, result) => {
      const turma = result.turma;

      if (!acc[turma]) {
        acc[turma] = {};
      }

      months.forEach((month) => {
        if (!acc[turma][month]) {
          acc[turma][month] = {
            prog: 0,
            exec: 0,
          };
        }

        acc[turma][month].prog = result[`${month}_prog`] || 0;
        acc[turma][month].exec = result[`${month}_exec`] || 0;
      });

      return acc;
    }, {});

    return sum;
  }
}
