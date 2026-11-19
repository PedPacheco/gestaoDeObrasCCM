import { ScheduleState } from 'src/domain/types';
import { ScheduleSnapshotRow } from 'src/infra/types';

// src/infra/mappers/schedule.mapper.ts
export const toScheduleSnapshot = (r: ScheduleSnapshotRow): ScheduleState => ({
  id: r.id,
  workId: r.id_obra,
  statusId: r.id_status_programacao,
  scheduledFinishTime: r.hora_ter,
  rejected: r.reprovada,
});
