import { Prisma } from 'src/infra/generated/prisma/client';

// src/infra/types/repositories/schedule.types.ts
export const SCHEDULE_SNAPSHOT_SELECT = {
  id: true,
  id_obra: true,
  id_status_programacao: true,
  hora_ini: true,
  hora_ter: true,
  data_prog: true,
  prog: true,
  exec: true,
  num_dp: true,
  equip_desligado: true,
  equipe_linha_viva: true,
  equipe_linha_morta: true,
  equipe_regularizacao: true,
  tipo_servico: true,
  observacao_programacao: true,
  reprovada: true,
  // + colunas descobertas no passo 3
} satisfies Prisma.programacoesSelect;

export type ScheduleSnapshotRow = Prisma.programacoesGetPayload<{
  select: typeof SCHEDULE_SNAPSHOT_SELECT;
}>;
