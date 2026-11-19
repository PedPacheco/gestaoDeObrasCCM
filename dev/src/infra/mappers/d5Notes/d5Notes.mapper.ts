import {
  D5NoteDetail,
  D5NoteFilter,
  D5NoteListItem,
  D5NoteSummary,
  DateRange,
  UpdateD5NoteData,
} from 'src/domain/types';

import type { Prisma } from 'src/infra/generated/prisma/client';
import { toWorkOrderNumbers } from 'src/infra/shared/workOrderNumbers';
import { toNumberOrNull } from 'src/utils/toNumberToNull';
import type {
  D5NoteByIdRow,
  D5NoteListRow,
  D5NoteSummaryRow,
} from '../../types/repositories/d5Notes/d5Notes.types';

// ─── Filtro → where (antigo buildWhereClause do service) ───────────

export const toDateWhere = (
  range?: DateRange,
): Prisma.DateTimeFilter | undefined =>
  range && { gte: range.from, lt: range.toExclusive };

export const toD5NoteWhere = (f: D5NoteFilter): Prisma.notas_d5WhereInput => {
  const where: Prisma.notas_d5WhereInput = {};

  if (f.regionIds?.length)
    where.municipios = { id_regional: { in: f.regionIds } };
  if (f.statusIds?.length) where.id_status = { in: f.statusIds };
  if (f.municipalityIds?.length) where.id_municipio = { in: f.municipalityIds };
  if (f.groupIds?.length) where.tipos = { id_grupo: { in: f.groupIds } };
  if (f.typeIds?.length) where.id_tipo = { in: f.typeIds };
  if (f.partnerIds?.length) where.id_parceira = { in: f.partnerIds };
  if (f.workIds?.length) where.id_obra = { in: f.workIds };
  if (f.noteIds?.length) where.id = { in: f.noteIds };
  if (f.sapStatus) where.status_sap = f.sapStatus;

  const createdAt = toDateWhere(f.createdAt);
  if (createdAt) where.criado_em = createdAt;

  const completedAt = toDateWhere(f.completedAt);
  if (completedAt) where.conclusao_nota = completedAt;

  return where;
};

// ─── Rows → domínio ────────────────────────────────────────────────

/** Também usado pelo mapper das programações (programacoes_d5 → notas_d5). */
export const toD5NoteSummary = (r: D5NoteSummaryRow): D5NoteSummary => ({
  id: r.id,
  installationSite: r.local_instalacao,
  createdAt: r.criado_em,
  completedAt: r.conclusao_nota,
  sapStatus: r.status_sap,
  plannedLabor: toNumberOrNull(r.mo_planejada) ?? 0,
  noteNumber: r.nota_d5,
  work: r.obras && toWorkOrderNumbers(r.obras),
  municipality: r.municipios?.mun_minusculo ?? null,
  region: r.municipios?.regionais?.regional ?? null,
  workType: r.tipos?.tipo_obra ?? null,
  partner: r.turmas?.turma ?? null,
  status: r.status?.status ?? null,
  responsibleName: r.novo_tabela_usuarios?.nome ?? null,
});

export const toD5NoteListItem = (r: D5NoteListRow): D5NoteListItem => ({
  ...toD5NoteSummary(r),
  annualValidation: r.validacao_anual,
  reasonIds: r.motivo_d5,
});

export const toD5NoteDetail = (r: D5NoteByIdRow): D5NoteDetail => ({
  ...toD5NoteListItem(r),
  partnerId: r.id_parceira,
  statusId: r.id_status,
  description: r.descricao,
  schedules: r.programacoes_d5.map((s) => ({
    planned: s.prog,
    executed: s.exec,
  })),
});

// ─── Domínio → Prisma ──────────────────────────────────────────────

/** ⚠ Copie o mapeamento atual do repositório (campos do UpdateD5NoteDTO). */
export const toD5NoteUpdateInput = (
  d: UpdateD5NoteData,
  modifyingUserId: number,
): Prisma.notas_d5UncheckedUpdateInput => ({
  ...(d.partnerId !== undefined && { id_parceira: d.partnerId }),
  ...(d.statusId !== undefined && { id_status: d.statusId }),
  ...(d.description !== undefined && { descricao: d.description }),
  id_usuario_modificador: modifyingUserId, // ⚠ confirme a coluna (id_usuario ou id_usuario_modificador)
});
