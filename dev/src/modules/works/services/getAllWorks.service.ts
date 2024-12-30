import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { GetAllWorksDTO } from 'src/config/dto/worksDto';
import { PrismaService } from 'src/config/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class GetAllWorksService {
  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getAllWorks(filters: GetAllWorksDTO) {
    const {
      idGrupo,
      idMunicipio,
      idParceira,
      idRegional,
      idStatus,
      idTipo,
      limit,
      page,
    } = filters;

    const cacheKey = `works-${JSON.stringify({
      idGrupo,
      idMunicipio,
      idParceira,
      idRegional,
      idStatus,
      idTipo,
      limit,
      page,
    })}`;

    let works = await this.cacheManager.get(cacheKey);

    if (works) {
      return works;
    }

    let query = Prisma.sql`SELECT
        obras.id, obras.ovnota, COALESCE(diagrama, COALESCE(ordem_dci, ordem_dcim)) AS ordemdiagrama, status_ov_sap, pep, status_pep, diagrama, status_diagrama, ordem_dci, status_170, 
        status_usuario_170, ordem_dcd, status_190, status_usuario_190, ordem_dca, status_150, status_usuario_150, ordem_dcim, status_180, status_usuario_180, mun, tipo_obra, entrada, 
        entrada + prazo AS prazo_fim, qtde_planejada, mo_planejada, mo_final, turma, executado, data_conclusao, last_data_prog, status, observ_obra, referencia 
        FROM construcao_sp.obras 
        INNER JOIN construcao_sp.turmas ON turmas.id = obras.id_turma 
        INNER JOIN construcao_sp.municipios ON municipios.id = obras.id_gpm 
        INNER JOIN construcao_sp.tipos ON tipos.id = obras.id_tipo 
        INNER JOIN construcao_sp.status ON status.id = obras.id_status 
        LEFT JOIN construcao_sp.datas_programacao ON datas_programacao.id= obras.id
        WHERE 1=1`;

    if (idRegional) {
      query = Prisma.sql`${query} AND municipios.id_regional IN (${Prisma.join(idRegional)})`;
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

    if (idMunicipio) {
      query = Prisma.sql`${query} AND municipios.id IN (${Prisma.join(idMunicipio)})`;
    }

    if (idStatus) {
      query = Prisma.sql`${query} AND status.id IN (${Prisma.join(idStatus)})`;
    }

    query = Prisma.sql`${query} ORDER BY entrada DESC`;

    if (limit && page !== null) {
      query = Prisma.sql`${query} LIMIT ${limit} OFFSET ${page * limit};`;
    }

    works = await this.prisma.$queryRaw(query);

    const totalRecords = await this.prisma.obras.count({
      where: {
        municipios: {
          id_regional:
            idRegional && idRegional.length > 0
              ? { in: idRegional }
              : undefined,
        },
        id_tipo: idTipo && idTipo.length > 0 ? { in: idTipo } : undefined,
        id_turma:
          idParceira && idParceira.length > 0 ? { in: idParceira } : undefined,
        tipos: {
          id_grupo: idGrupo && idGrupo.length > 0 ? { in: idGrupo } : undefined,
        },
        id_gpm:
          idMunicipio && idMunicipio.length > 0
            ? { in: idMunicipio }
            : undefined,
        id_status:
          idStatus && idStatus.length > 0 ? { in: idStatus } : undefined,
      },
    });

    const response = {
      works,
      totalRecords,
    };

    await this.cacheManager.set(cacheKey, response, 1800000);

    return response;
  }
}
