// ═══ Notas ══════════════════════════════════════════════════════════

import { DateRange } from '../../shared/shared.types';
import { WorkOrderNumbers } from '../../shared/workOrder.types';

export interface D5NoteFilter {
  regionIds?: number[];
  statusIds?: number[];
  municipalityIds?: number[];
  groupIds?: number[];
  typeIds?: number[];
  partnerIds?: number[];
  workIds?: number[];
  noteIds?: number[];
  sapStatus?: string;
  createdAt?: DateRange;
  completedAt?: DateRange;
}

export interface D5NoteTotals {
  total: number;
  totalMoRetida: number;
}

/** Dados da nota com as relações: usado na lista de notas e na lista de programações. */
export interface D5NoteSummary {
  id: number;
  installationSite: string | null; // local_instalacao
  createdAt: Date; // criado_em
  completedAt: Date | null; // conclusao_nota
  sapStatus: string; // status_sap
  plannedLabor: number; // mo_planejada (Decimal → number)
  noteNumber: string; // nota_d5
  work: WorkOrderNumbers | null; // obras
  municipality: string; // municipios.mun_minusculo
  region: string; // municipios.regionais.regional
  workType: string; // tipos.tipo_obra
  partner: string; // turmas.turma
  status: string; // status.status
  responsibleName: string | null; // novo_tabela_usuarios.nome
}

export interface D5NoteListItem extends D5NoteSummary {
  annualValidation: boolean | null; // validacao_anual
  reasonIds: number[]; // motivo_d5
}

export interface D5NoteDetail extends D5NoteListItem {
  partnerId: number; // id_parceira
  statusId: number; // id_status
  description: string | null; // descricao
  schedules: { planned: number; executed: number }[]; // programacoes_d5 ⚠ exec nullable?
}

/** ⚠ Completar com os campos do UpdateD5NoteDTO. */
export interface UpdateD5NoteData {
  partnerId?: number;
  statusId?: number;
  description?: string;
}
