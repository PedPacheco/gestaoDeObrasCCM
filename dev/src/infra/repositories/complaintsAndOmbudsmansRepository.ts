import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Complaint } from 'src/domain/entities/complaints/complaints.entity';
import {
  ComplaintsFilter,
  IComplaintsAndOmbudsmansOfficeRepository,
} from 'src/domain/repositories/IComplaintsAndOmbudsmansOfficeRepository';
import { PrismaService } from '../prisma/prisma.service';

// `select` (not `include`) to fetch only what the entity uses.
const SELECT = {
  id: true,
  nota: true,
  status: true,
  tipo_reclamacao: true,
  causa_raiz: true,
  observacao: true,
  procedente_improcedente: true,
  reclamacao_ou_ouvidoria: true,
  data_abertura: true,
  data_vencimento: true,
  data_conclusao: true,
  municipios: {
    select: { municipio: true, regionais: { select: { regional: true } } },
  },
  turmas: { select: { turma: true } },
} satisfies Prisma.reclamacoes_ouvidoriaSelect;

type Row = Prisma.reclamacoes_ouvidoriaGetPayload<{ select: typeof SELECT }>;

// Timestamp without timezone: Prisma reads it as UTC, so slice(0, 10) returns the stored date.
const toIsoDate = (d: Date | null): string | null =>
  d ? d.toISOString().slice(0, 10) : null;

@Injectable()
export class ComplaintsAndOmbudsmansOfficeRepository implements IComplaintsAndOmbudsmansOfficeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(filter: ComplaintsFilter): Promise<Complaint[]> {
    const rows = await this.prisma.reclamacoes_ouvidoria.findMany({
      where: this.buildWhere(filter),
      select: SELECT,
    });
    return rows.map(this.toDomain);
  }

  // Only the repository knows the schema paths (e.g. the region lives on municipios).
  private buildWhere(
    f: ComplaintsFilter,
  ): Prisma.reclamacoes_ouvidoriaWhereInput {
    const where: Prisma.reclamacoes_ouvidoriaWhereInput = {};
    if (f.idRegional?.length)
      where.municipios = { id_regional: { in: f.idRegional } };
    if (f.idMunicipio?.length) where.id_municipio = { in: f.idMunicipio };
    if (f.idParceira?.length) where.id_parceira = { in: f.idParceira };
    return where;
  }

  // Column -> property translation only; the entity owns every business rule.
  private toDomain = (r: Row): Complaint =>
    Complaint.restore({
      id: String(r.id),
      note: r.nota,
      contractor: r.turmas.turma, // partner name (fk_parceiras: id_parceira -> turmas.id)
      region: r.municipios.regionais.regional,
      municipality: r.municipios.municipio,
      status: r.status,
      complaintType: r.tipo_reclamacao,
      rootCause: r.causa_raiz,
      observation: r.observacao,
      outcomeLabel: r.procedente_improcedente,
      recordTypeLabel: r.reclamacao_ou_ouvidoria,
      openedDate: toIsoDate(r.data_abertura),
      completionDate: toIsoDate(r.data_conclusao),
      dueDate: toIsoDate(r.data_vencimento),
    });
}
