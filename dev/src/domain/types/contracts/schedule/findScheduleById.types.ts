export interface ScheduleState {
  id: number;
  workId: number; // id_obra
  statusId: number; // id_status_programacao
  scheduledFinishTime: Date | null; // hora_ter
  rejected: boolean;
}
