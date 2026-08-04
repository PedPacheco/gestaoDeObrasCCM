import * as moment from 'moment';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetExecMonitoringDTO } from 'src/interface/dtos/scheduleDTO';
import {
  ExecMonitoringRow,
  IExecMonitoringRepository,
} from 'src/domain/contracts/schedule/IExecMonitoringRepository';

import { Injectable } from '@nestjs/common';

@Injectable()
export class ExecMonitoringRepository implements IExecMonitoringRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getData(filters: GetExecMonitoringDTO): Promise<ExecMonitoringRow[]> {
    const {
      dataInicial,
      dataFinal,
      idRegional,
      idTecnico,
      idParceira,
      idTipo,
    } = filters;

    const startDate = moment.utc(dataInicial, 'DD/MM/YYYY').toDate();
    const endDate = moment.utc(dataFinal, 'DD/MM/YYYY').toDate();

    let query = Prisma.sql`
      SELECT
        TO_CHAR(p.data_prog, 'MM/YYYY') AS mes,
        r.regional,
        r.id::int AS id_regional,
        t.turma,
        COUNT(*)::int AS total,
        SUM(CASE WHEN p.id_tecnico != 1 THEN 1 ELSE 0 END)::int AS acompanhado,
        SUM(CASE WHEN p.id_tecnico = 1 THEN 1 ELSE 0 END)::int AS nao_acompanhado
      FROM construcao_sp.programacoes p
      INNER JOIN construcao_sp.obras o ON o.id = p.id_obra
      INNER JOIN construcao_sp.municipios m ON m.id = o.id_gpm
      INNER JOIN construcao_sp.regionais r ON r.id = m.id_regional
      INNER JOIN construcao_sp.turmas t ON t.id = o.id_turma
      WHERE p.id_status_programacao IN (4, 6)
        AND p.data_prog >= ${startDate}
        AND p.data_prog <= ${endDate}
    `;

    if (idRegional?.length > 0) {
      query = Prisma.sql`${query} AND m.id_regional IN (${Prisma.join(idRegional)})`;
    }
    if (idTecnico?.length > 0) {
      query = Prisma.sql`${query} AND p.id_tecnico IN (${Prisma.join(idTecnico)})`;
    }
    if (idParceira?.length > 0) {
      query = Prisma.sql`${query} AND o.id_turma IN (${Prisma.join(idParceira)})`;
    }
    if (idTipo?.length > 0) {
      query = Prisma.sql`${query} AND o.id_tipo IN (${Prisma.join(idTipo)})`;
    }

    query = Prisma.sql`${query}
      GROUP BY TO_CHAR(p.data_prog, 'MM/YYYY'), r.regional, r.id, t.turma
      ORDER BY MIN(p.data_prog), r.regional
    `;

    return this.prisma.$queryRaw<ExecMonitoringRow[]>(query);
  }
}
