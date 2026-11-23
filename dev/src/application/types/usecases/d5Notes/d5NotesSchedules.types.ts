import type { D5NoteInScheduleOutput } from './d5Notes.types';

// ═══ Inputs ════════════════════════════════════════════════════════

/**
 * Mesma estrutura do CreateProgramacaoD5Dto: o resto dos campos tem os nomes da entidade
 * (o fromCreateInput espalha-os diretamente nas props).
 * ⚠ Confirme com o DTO.
 */
/** Mesma estrutura do CreateProgramacaoD5Dto. */
export interface CreateD5ScheduleInput {
  d5NoteId: number;
  scheduledDate: string; // ISO
  prog: number;
  exec?: number | null;
  observation?: string | null;
  numDp?: string | null;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  lmTeam?: number;
  regulTeam?: number;
  lvTeam?: number;
  temporaryKey?: boolean;
  serviceType?: string;
  chi?: number;
  technicalId?: number; // opcional, como no DTO
  restrictionId?: number; // opcional, como no DTO
  restrictionResponsible?: string | null;
  executionObservation?: string | null;
  creatorUserId: number;
  modifyingUserId: number;
  fiscalization?: boolean;
}

/** Mesma estrutura do UpdateScheduleD5Dto (PartialType + OmitType). */
export type UpdateD5ScheduleInput = Partial<
  Omit<CreateD5ScheduleInput, 'd5NoteId' | 'creatorUserId' | 'modifyingUserId'>
> & {
  keptFiles?: string[];
  rejected?: boolean;
};

/** Mesma estrutura do RejectD5ScheduleDTO. */
export interface RejectD5ScheduleInput {
  id: number;
  restrictionId: number;
  description: string;
}

/** Mesma estrutura do D5NotesSchedulesFiltersDTO. */
export interface D5SchedulesFilterInput {
  dataInicial?: string; // DD/MM/YYYY
  dataFinal?: string; // DD/MM/YYYY
  idRegional?: number[];
  idMunicipio?: number[];
  idGrupo?: number[];
  idTipo?: number[];
  idParceira?: number[];
  idOvnota?: number[];
  statusSap?: string;
  idNotaD5?: number[];
  id?: number[];
  pendente?: boolean;
  executado?: boolean;
  reprovada?: boolean;
  page?: number;
}

// ═══ Outputs (formato atual da API) ════════════════════════════════

export interface D5ScheduleListFieldsOutput {
  data_prog: Date;
  hora_ini: Date | null;
  hora_ter: Date | null;
  prog: number;
  exec: number | null;
  equipe_lm: number;
  equipe_lv: number;
  equipe_reg: number;
  chave_provisoria: boolean;
  chi: number;
  num_dp: string | null;
  tipo_servico: string | null;
  observacao_programacao: string | null;
  precisaDp: boolean;
  tecnico: string | null;
}

export type D5NoteScheduleListItemOutput = D5ScheduleListFieldsOutput &
  D5NoteInScheduleOutput;

export interface D5SchedulesTotalsOutput {
  total: number;
  totalMoRetida: number;
  totalMoProgramada: number;
}

export interface D5SchedulesListOutput {
  d5Notes: D5NoteScheduleListItemOutput[];
  totals: D5SchedulesTotalsOutput;
}

export interface D5NoteScheduleOutput {
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
  usuarioModificador: string | null;
  usuarioCriador: string | null;
  idTecnico: number | null;
  tecnico: string | null;
  idRestricao: number | null;
  restricao: string | null;
  responsavel_restricao: string | null;
  caminhos_arquivos: string[];
  reprovada: boolean;
  fiscalizacao: boolean;
}

export interface D5RejectionListItemOutput {
  id: number;
  dataReprovacao: Date | null;
  dataProgramacao: Date | null;
  horaInicio: Date | null;
  horaTermino: Date | null;
  programacao: number | null;
  descricao: string | null;
  tipoServico: string | null;
  chaveProvisoria: boolean | null;
  chi: number | null;
  numDp: string | null;
  observacaoProgramacao: string | null;
  equipeLm: number | null;
  equipeLv: number | null;
  equipeReg: number | null;
  restricao: string;
  reprovadoPor: string | null;
}
