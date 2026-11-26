import type { mapMotivosD5 } from 'src/domain/constants/d5Notes/reasonsD5';
import type { D5NoteTotals, UpdateD5NoteData } from 'src/domain/types';

export type D5Reasons = ReturnType<typeof mapMotivosD5>;

// ═══ Inputs ════════════════════════════════════════════════════════

/** Mesma estrutura do D5NotesFiltersDTO: até à 5C o controller passa o DTO diretamente. */
export interface D5NotesFilterInput {
  idRegional?: number[];
  idStatus?: number[];
  idMunicipio?: number[];
  idGrupo?: number[];
  idTipo?: number[];
  idParceira?: number[];
  idOvnota?: number[];
  idNotaD5?: number[];
  statusD5Sap?: string;
  dataCriacaoInicial?: string;
  dataCriacaoFinal?: string;
  dataConclusaoInicial?: string;
  dataConclusaoFinal?: string;
  page?: number;
}

export type UpdateD5NoteInput = UpdateD5NoteData;

// ═══ Auxiliares partilhados com as programações ════════════════════

/** Métricas de prazo calculadas pelo TimeMetricsService. */
export interface D5NoteTimeInfo {
  tmAberto: number | null;
  tmExecucao: number | null;
  statusPrazo: string | null;
}

export interface D5NoteScheduleTotals {
  totalProgramado: number;
  totalExecutado: number;
}

// ═══ Outputs (formato atual da API) ════════════════════════════════

export interface D5NoteListItemOutput extends D5NoteTimeInfo {
  id: number;
  local_instalacao: string | null;
  criado_em: Date;
  conclusao_nota: Date | null;
  status_sap: string;
  validacao_anual: boolean | null;
  mo_planejada: number;
  nota_d5: string;
  moRetida: number;
  ordemDiagrama: string | null;
  obra: string | null;
  municipio: string;
  regional: string;
  parceira: string;
  tipoObra: string;
  status: string;
  usuarioModificador: string | null;
  motivos: D5Reasons;
}

export interface D5NotesListOutput {
  d5Notes: D5NoteListItemOutput[];
  totals: D5NoteTotals;
}

export interface D5NoteDetailOutput extends D5NoteScheduleTotals {
  id: number;
  id_parceira: number;
  id_status: number;
  local_instalacao: string | null;
  criado_em: Date;
  conclusao_nota: Date | null;
  status_sap: string;
  validacao_anual: boolean | null;
  mo_planejada: number;
  nota_d5: string;
  descricao: string | null;
  obra: string | null;
  ordemDiagrama: string | null;
  municipio: string;
  regional: string;
  parceira: string;
  tipoObra: string;
  status: string;
  moRetida: number;
  usuarioModificador: string | null;
  observacao: string | null;
  prazo: Date;
  motivos: D5Reasons;
}

/** Parte da nota dentro da listagem de programações (nomes diferentes da lista de notas). */
export interface D5NoteInScheduleOutput extends D5NoteTimeInfo {
  id: number;
  nota_d5: string;
  local_instalacao: string | null;
  criado_em: Date;
  conclusao_nota: Date | null;
  status_sap: string;
  moRetida: number;
  municipio: string;
  regional: string;
  tipo_obra: string;
  turma: string;
  status: string;
  responsavel: string | null;
  ovnota: string | null;
  ordemDiagrama: string | null;
}
