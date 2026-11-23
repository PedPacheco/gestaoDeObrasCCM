// ═══ Programações ═══════════════════════════════════════════════════

import { DateRange } from '../../shared/shared.types';
import { D5NoteFilter, D5NoteSummary } from './d5Notes.types';

export type D5ScheduleState =
  | 'upcoming' // sem execução, a partir de hoje e não reprovada (comportamento por omissão)
  | 'rejected' // reprovada
  | 'executed' // com execução
  | 'pending'; // sem execução e com a data já passada

/** ⚠ Substitui o where: any. Os critérios definem-se quando vir o service. */
export interface D5ScheduleStateFilter {
  /** Os estados combinam-se em AND, como hoje. */
  states: D5ScheduleState[];
  /** Data de referência para "a partir de hoje" e "já passou". */
  today: Date;
}

export interface D5ScheduleFilter {
  scheduledDate?: DateRange; // período sobre data_prog
  note?: D5NoteFilter; // critérios aplicados a notas_d5
  noteIds?: number[]; // id_nota_d5
  scheduleIds?: number[]; // id
  state?: D5ScheduleStateFilter;
}

/** Campos comuns a todas as leituras de programação. */
export interface D5ScheduleFields {
  scheduledDate: Date; // data_prog
  startTime: Date; // hora_ini   ⚠ nullable?
  endTime: Date; // hora_ter   ⚠ nullable?
  planned: number; // prog
  executed: number; // exec       ⚠ nullable?
  lmTeams: number; // equipe_lm
  lvTeams: number; // equipe_lv
  regTeams: number; // equipe_reg
  provisionalKey: boolean; // chave_provisoria
  chi: number;
  dpNumber: string | null; // num_dp
  serviceType: string | null; // tipo_servico
  scheduleNote: string | null; // observacao_programacao
}

/** Por id: usada no update e na reprovação. */
export interface D5Schedule extends D5ScheduleFields {
  id: number;
  noteId: number; // id_nota_d5
  executionNote: string | null; // observacao_execucao
  restrictionOwner: string | null; // responsavel_restricao
  creatorId: number; // id_usuario_criador
  modifierId: number; // id_usuario_modificador
  restrictionId: number; // id_restricao
  technicianId: number; // id_tecnico
  filePaths: string[]; // caminhos_arquivos
  rejected: boolean; // reprovada
  inspection: boolean; // fiscalizacao
}

/** Por nota: com os nomes das relações. */
export interface D5ScheduleDetail extends D5ScheduleFields {
  id: number;
  d5NoteId: number;
  createdAt: Date;
  executionNote: string | null;
  restrictionOwner: string | null;
  creatorName: string | null; // usuario_criador.nome
  modifierName: string | null; // usuario_modificador.nome
  restriction: { id: number; name: string };
  technician: { id: number; name: string };
  filePaths: string[];
  rejected: boolean;
  inspection: boolean;
}

/** Listagem: a programação com os dados da nota. */
export interface D5ScheduleWithNote extends D5ScheduleFields {
  technicianName: string; // tecnicos.tecnico
  note: D5NoteSummary; // notas_d5
}

export interface CreateD5ScheduleData {
  noteId: number;
  scheduledDate: Date;
  planned: number;
  executed?: number;
  startTime?: Date;
  endTime?: Date;
  scheduleNote?: string;
  executionNote?: string;
  dpNumber?: string;
  serviceType?: string;
  chi?: number;
  lvTeams: number;
  lmTeams: number;
  regTeams: number;
  provisionalKey: boolean;
  technicianId: number;
  restrictionId: number;
  restrictionOwner?: string;
  creatorId: number;
  modifierId: number;
}

export type UpdateD5ScheduleData = Omit<
  CreateD5ScheduleData,
  'noteId' | 'creatorId'
> & {
  filePaths: string[];
};

/** ⚠ Confirme quem o produz (repositório → domínio; service → application). */
export interface NoteScheduledWork {
  noteId: number;
  moRetida: number;
  progs: number[]; // % programada de cada programação da nota que cumpre o filtro
}

// ═══ Reprovações de programação ═════════════════════════════════════

export interface CreateD5ScheduleRejectionData {
  d5NoteId: number;
  description: string;
  scheduledDate: Date;
  planned: number;
  startTime: Date;
  endTime: Date;
  lmTeams: number;
  lvTeams: number;
  regTeams: number;
  provisionalKey: boolean;
  chi: number;
  dpNumber: string | null; // ⚠ hoje é string, mas a origem pode ser null
  serviceType: string | null; // ⚠
  scheduleNote: string | null; // ⚠
  rejectedByUserId: number; // id_usuario_reprovador
  restrictionId: number;
}

export interface D5ScheduleRejection {
  id: number;
  rejectedAt: Date; // data_reprovacao
  scheduledDate: Date;
  startTime: Date;
  endTime: Date;
  planned: number;
  description: string;
  lmTeams: number;
  lvTeams: number;
  regTeams: number;
  serviceType: string;
  provisionalKey: boolean;
  chi: number;
  dpNumber: string;
  scheduleNote: string;
  restriction: string; // restricoes.restricao
  rejectedBy: string; // novo_tabela_usuarios.nome
}

export type D5ScheduleRejectionSource = D5ScheduleFields & { d5NoteId: number };
