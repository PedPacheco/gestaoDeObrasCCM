import { Prisma } from 'src/infra/generated/prisma/client';

// src/infra/types/repositories/schedule.types.ts
export const SCHEDULE_SNAPSHOT_SELECT = {
  id: true,
  id_obra: true,
  id_status_programacao: true,
  hora_ini: true,
  hora_ter: true,
  data_prog: true,
  reprovada: true,
  // + colunas descobertas no passo 3
} satisfies Prisma.programacoesSelect;

export type ScheduleSnapshotRow = Prisma.programacoesGetPayload<{
  select: typeof SCHEDULE_SNAPSHOT_SELECT;
}>;
