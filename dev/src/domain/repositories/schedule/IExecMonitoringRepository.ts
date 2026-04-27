import { GetExecMonitoringDTO } from 'src/interface/dtos/scheduleDTO';

export const EXEC_MONITORING_REPOSITORY = 'EXEC_MONITORING_REPOSITORY';

export interface ExecMonitoringRow {
  mes: string;
  regional: string;
  id_regional: number;
  total: number;
  acompanhado: number;
  nao_acompanhado: number;
}

export interface IExecMonitoringRepository {
  getData(filters: GetExecMonitoringDTO): Promise<ExecMonitoringRow[]>;
}
