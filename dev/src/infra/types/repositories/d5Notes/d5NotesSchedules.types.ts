// ═══ Programações D5 ═══════════════════════════════════════════════

import { Prisma } from 'src/infra/generated/prisma/client';
import { D5_NOTE_SUMMARY_SELECT } from './d5Notes.types';

export const D5_SCHEDULE_BASE_SELECT = {
  data_prog: true,
  hora_ini: true,
  hora_ter: true,
  prog: true,
  exec: true,
  equipe_lm: true,
  equipe_lv: true,
  equipe_reg: true,
  chave_provisoria: true,
  chi: true,
  num_dp: true,
  tipo_servico: true,
  observacao_programacao: true,
} satisfies Prisma.programacoes_d5Select;

export type D5ScheduleFieldsRow = Prisma.programacoes_d5GetPayload<{
  select: typeof D5_SCHEDULE_BASE_SELECT;
}>;

export const D5_SCHEDULE_WITH_NOTE_SELECT = {
  ...D5_SCHEDULE_BASE_SELECT,
  tecnicos: { select: { tecnico: true } },
  notas_d5: { select: D5_NOTE_SUMMARY_SELECT },
} satisfies Prisma.programacoes_d5Select;
export type D5ScheduleWithNoteRow = Prisma.programacoes_d5GetPayload<{
  select: typeof D5_SCHEDULE_WITH_NOTE_SELECT;
}>;

export const D5_SCHEDULE_BY_ID_SELECT = {
  id: true,
  id_nota_d5: true,
  ...D5_SCHEDULE_BASE_SELECT,
  observacao_execucao: true,
  responsavel_restricao: true,
  id_usuario_criador: true,
  id_usuario_modificador: true,
  id_restricao: true,
  id_tecnico: true,
  caminhos_arquivos: true,
  reprovada: true,
  fiscalizacao: true,
} satisfies Prisma.programacoes_d5Select;
export type D5ScheduleRow = Prisma.programacoes_d5GetPayload<{
  select: typeof D5_SCHEDULE_BY_ID_SELECT;
}>;

export const D5_SCHEDULE_BY_NOTE_SELECT = {
  id: true,
  id_nota_d5: true,
  ...D5_SCHEDULE_BASE_SELECT,
  tecnicos: { select: { id: true, tecnico: true } },
  criado_em: true,
  observacao_execucao: true,
  responsavel_restricao: true,
  restricoes: { select: { id: true, restricao: true } },
  usuario_criador: { select: { nome: true } },
  usuario_modificador: { select: { nome: true } },
  caminhos_arquivos: true,
  reprovada: true,
  fiscalizacao: true,
} satisfies Prisma.programacoes_d5Select;
export type D5ScheduleByNoteRow = Prisma.programacoes_d5GetPayload<{
  select: typeof D5_SCHEDULE_BY_NOTE_SELECT;
}>;

export const D5_SCHEDULE_REJECTION_SELECT = {
  id: true,
  data_reprovacao: true,
  data_prog: true,
  hora_ini: true,
  hora_ter: true,
  prog: true,
  descricao: true,
  equipe_lm: true,
  equipe_lv: true,
  equipe_reg: true,
  tipo_servico: true,
  chave_provisoria: true,
  chi: true,
  num_dp: true,
  observacao_programacao: true,
  restricoes: { select: { restricao: true } },
  novo_tabela_usuarios: { select: { nome: true } },
} satisfies Prisma.programacoes_d5_reprovacoesSelect;
export type D5ScheduleRejectionRow =
  Prisma.programacoes_d5_reprovacoesGetPayload<{
    select: typeof D5_SCHEDULE_REJECTION_SELECT;
  }>;

export type NoteScheduledWorkRow = Prisma.notas_d5GetPayload<{
  select: {
    id: true;
    mo_planejada: true;
    programacoes_d5: { select: { prog: true } };
  };
}>;
