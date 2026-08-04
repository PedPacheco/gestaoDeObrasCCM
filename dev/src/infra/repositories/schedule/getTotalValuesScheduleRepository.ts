import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { IGetTotalScheduleValuesRepository } from 'src/domain/contracts/schedule/IGetTotalValuesScheduleRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetTotalValuesScheduleDTO } from 'src/interface/dtos/scheduleDTO';
import { GetTotalValuesScheduleResponse } from 'src/interface/types/schedule/getTotalValuesScheduleInterface';

@Injectable()
export class GetTotalValueScheduleRepository implements IGetTotalScheduleValuesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getTotalValues(
    filters: GetTotalValuesScheduleDTO,
  ): Promise<GetTotalValuesScheduleResponse[]> {
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

    if (idRegional && idRegional.length > 0) {
      query = Prisma.sql`${query} AND municipios.id_regional IN (${Prisma.join(idRegional)})`;
    }

    if (idTipo && idTipo.length > 0) {
      query = Prisma.sql`${query} AND id_tipo IN (${Prisma.join(idTipo)})`;
    }

    if (idParceira && idParceira.length > 0) {
      query = Prisma.sql`${query} AND id_turma IN (${Prisma.join(idParceira)})`;
    }

    if (idGrupo && idGrupo.length > 0) {
      query = Prisma.sql`${query} AND tipos.id_grupo IN (${Prisma.join(idGrupo)})`;
    }

    if (idMunicipio && idMunicipio.length > 0) {
      query = Prisma.sql`${query} AND municipios.id IN (${Prisma.join(idMunicipio)})`;
    }

    if (idCircuito && idCircuito.length > 0) {
      query = Prisma.sql`${query} AND id_circuito IN (${Prisma.join(idCircuito)})`;
    }

    if (ano) {
      query = Prisma.sql`${query} AND EXTRACT(YEAR FROM data_prog) = ${ano}`;
    }

    query = Prisma.sql`${query} GROUP BY turma, EXTRACT(YEAR FROM data_prog) ORDER BY turma;`;

    return await this.prisma.$queryRaw(query);
  }
}
