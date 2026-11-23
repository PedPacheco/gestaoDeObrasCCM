import type { Prisma } from 'src/infra/generated/prisma/client';
import {
  WORK_ORDER_NUMBERS_SELECT,
  WorkOrderNumbersRow,
} from 'src/infra/shared/workOrderNumbers';

// ═══════════════════════════════════════════════════════════════════
// Notas D5
// ═══════════════════════════════════════════════════════════════════

/** Relações da nota usadas na lista de notas e na lista de programações. */
export const D5_NOTE_RELATIONS_SELECT = {
  obras: { select: WORK_ORDER_NUMBERS_SELECT },
  municipios: {
    select: {
      mun_minusculo: true,
      regionais: { select: { regional: true } },
    },
  },
  tipos: { select: { tipo_obra: true } },
  turmas: { select: { turma: true } },
  status: { select: { status: true } },
  novo_tabela_usuarios: { select: { nome: true } },
} satisfies Prisma.notas_d5Select;

/** Resumo da nota: também usado em programacoes_d5 → notas_d5. */
export const D5_NOTE_SUMMARY_SELECT = {
  id: true,
  local_instalacao: true,
  criado_em: true,
  conclusao_nota: true,
  status_sap: true,
  mo_planejada: true,
  nota_d5: true,
  ...D5_NOTE_RELATIONS_SELECT,
} satisfies Prisma.notas_d5Select;

export type D5NoteSummaryRow = Prisma.notas_d5GetPayload<{
  select: typeof D5_NOTE_SUMMARY_SELECT;
}>;

/** Lista de notas (antigo FindD5NotesQueryResult). */
export const D5_NOTE_LIST_SELECT = {
  ...D5_NOTE_SUMMARY_SELECT,
  validacao_anual: true,
  motivo_d5: true,
} satisfies Prisma.notas_d5Select;

export type D5NoteListRow = Prisma.notas_d5GetPayload<{
  select: typeof D5_NOTE_LIST_SELECT;
}>;

/** Nota por id (antigo d5NoteByIdSelect / D5NoteByIdQueryResult). */
export const D5_NOTE_BY_ID_SELECT = {
  ...D5_NOTE_LIST_SELECT,
  id_parceira: true,
  id_status: true,
  descricao: true,
  programacoes_d5: { select: { prog: true, exec: true } },
} satisfies Prisma.notas_d5Select;

export type D5NoteByIdRow = Prisma.notas_d5GetPayload<{
  select: typeof D5_NOTE_BY_ID_SELECT;
}>;

// ═══════════════════════════════════════════════════════════════════
// Programações D5
// Rows escritas à mão, iguais aos *QueryResult atuais.
// Passam a select + GetPayload quando o repositório for revisto.
// ═══════════════════════════════════════════════════════════════════

/** Antigo SchedulesD5NotesByIdQueryResult. */
export type D5ScheduleRow = {
  id: number;
  id_nota_d5: number;
  data_prog: Date;
  hora_ini: Date;
  hora_ter: Date;
  prog: number;
  exec: number;
  equipe_lm: number;
  equipe_lv: number;
  equipe_reg: number;
  chave_provisoria: boolean;
  chi: number;
  num_dp: string | null;
  tipo_servico: string | null;
  observacao_execucao: string | null;
  observacao_programacao: string | null;
  responsavel_restricao: string | null;
  id_usuario_criador: number;
  id_usuario_modificador: number;
  id_restricao: number;
  id_tecnico: number;
  caminhos_arquivos: string[];
  reprovada: boolean;
  fiscalizacao: boolean;
};

/** Antigo SchedulesD5NotesByNoteIdQueryResult. */
export type D5ScheduleByNoteRow = {
  id: number;
  id_nota_d5: number;
  criado_em: Date;
  data_prog: Date;
  hora_ini: Date;
  hora_ter: Date;
  prog: number;
  exec: number;
  equipe_lm: number;
  equipe_lv: number;
  equipe_reg: number;
  chave_provisoria: boolean;
  chi: number;
  num_dp: string | null;
  tipo_servico: string | null;
  observacao_execucao: string | null;
  observacao_programacao: string | null;
  usuario_criador: { nome: string } | null;
  usuario_modificador: { nome: string } | null;
  restricoes: { id: number; restricao: string };
  tecnicos: { id: number; tecnico: string };
  responsavel_restricao: string | null;
  caminhos_arquivos: string[];
  reprovada: boolean;
  fiscalizacao: boolean;
};

/** Antigo SchedulesD5NotesQueryResult. A nota tem o mesmo formato do D5NoteSummaryRow. */
export type D5ScheduleWithNoteRow = {
  data_prog: Date;
  hora_ini: Date;
  hora_ter: Date;
  prog: number;
  exec: number;
  equipe_lm: number;
  equipe_lv: number;
  equipe_reg: number;
  chave_provisoria: boolean;
  chi: number;
  num_dp: string | null;
  tipo_servico: string | null;
  observacao_programacao: string | null;
  tecnicos: { tecnico: string };
  notas_d5: D5NoteSummaryRow;
};

/** Antigo FindRejectionsByD5NotesQueryResult. */
export type D5ScheduleRejectionRow = {
  id: number;
  data_reprovacao: Date;
  data_prog: Date;
  hora_ini: Date;
  hora_ter: Date;
  prog: number;
  descricao: string;
  equipe_lm: number;
  equipe_lv: number;
  equipe_reg: number;
  tipo_servico: string;
  chave_provisoria: boolean;
  chi: number;
  num_dp: string;
  observacao_programacao: string;
  restricoes: { restricao: string };
  novo_tabela_usuarios: { nome: string };
};

/** Reexportado para os mappers da infra. */
export type { WorkOrderNumbersRow };
