import { Inject, Injectable } from '@nestjs/common';
import {
  EXEC_MONITORING_REPOSITORY,
  IExecMonitoringRepository,
} from 'src/domain/contracts/schedule/IExecMonitoringRepository';
import { GetExecMonitoringDTO } from 'src/interface/dtos/scheduleDTO';

@Injectable()
export class ExecMonitoringService {
  constructor(
    @Inject(EXEC_MONITORING_REPOSITORY)
    private readonly repository: IExecMonitoringRepository,
  ) {}

  async getData(filters: GetExecMonitoringDTO) {
    const rows = await this.repository.getData(filters);

    return rows.map((r) => ({
      mes: r.mes,
      regional: r.regional,
      id_regional: Number(r.id_regional),
      parceira: r.turma,
      total: Number(r.total),
      acompanhado: Number(r.acompanhado),
      naoAcompanhado: Number(r.nao_acompanhado),
      pct:
        Number(r.total) > 0
          ? Math.round((Number(r.acompanhado) / Number(r.total)) * 100)
          : 0,
    }));
  }
}
