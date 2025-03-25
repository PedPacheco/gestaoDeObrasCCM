import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetAllWorksDTO } from 'src/interface/dtos/worksDto';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class GetAllWorksService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  private applyFilters(query: Prisma.Sql, filters: GetAllWorksDTO) {
    const { idGrupo, idMunicipio, idParceira, idRegional, idStatus, idTipo } =
      filters;

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

    if (idStatus && idStatus.length > 0) {
      query = Prisma.sql`${query} AND status.id IN (${Prisma.join(idStatus)})`;
    }

    return query;
  }

  async getAllWorks(filters: GetAllWorksDTO) {
    const { page } = filters;

    const cacheKey = `works-${JSON.stringify(filters)}`;

    const responseData = await this.cacheManager.get(cacheKey);

    if (responseData) {
      return responseData;
    }

    const baseQuery = Prisma.sql`FROM construcao_sp.obras 
        INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma 
        INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm 
        INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo 
        INNER JOIN construcao_sp.status ON status.id = obras.id_status 
        LEFT JOIN construcao_sp.datas_programacao ON datas_programacao.id= obras.id
        WHERE 1=1`;

    let query = Prisma.sql`SELECT
        obras.id, obras.ovnota, COALESCE(diagrama, COALESCE(ordem_dci, ordem_dcim)) AS ordemdiagrama, status_ov_sap, pep, status_pep, diagrama, status_diagrama, ordem_dci, status_170, 
        status_usuario_170, ordem_dcd, status_190, status_usuario_190, ordem_dca, status_150, status_usuario_150, ordem_dcim, status_180, status_usuario_180, mun, tipo_obra, entrada, 
        entrada + prazo AS prazo_fim, qtde_planejada, mo_planejada, mo_final, turma, executado, data_conclusao, last_data_prog, status, observ_obra, referencia 
        ${baseQuery}`;

    let queryCount = Prisma.sql`SELECT COUNT(*) as total_obras ${baseQuery}`;

    query = this.applyFilters(query, filters);
    queryCount = this.applyFilters(queryCount, filters);

    query = Prisma.sql`${query} ORDER BY entrada DESC`;

    if (page !== null) {
      query = Prisma.sql`${query} LIMIT 200 OFFSET ${page * 200};`;
    }

    const [works, total] = await Promise.all([
      this.prisma.$queryRaw(query),
      this.prisma.$queryRaw<{ total_obras: number }[]>(queryCount),
    ]);

    const totalRecords = total.length > 0 ? Number(total[0].total_obras) : 0;

    const response = {
      works,
      totalRecords,
    };

    await this.cacheManager.set(cacheKey, response, 1800000);

    return response;
  }
}
