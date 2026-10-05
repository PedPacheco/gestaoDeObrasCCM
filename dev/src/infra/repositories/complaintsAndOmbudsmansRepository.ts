import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { IComplaintsAndOmbudsmansOfficeRepository } from 'src/domain/repositories/IComplaintsAndOmbudsmansOfficeRepository';

import { PrismaService } from '../prisma/prisma.service';

// `select` (e não `include`) para trazer só o que o cálculo usa.
const SELECT = {
  id: true,
  nota: true,
  status: true,
  status_prazo: true,
  tipo_reclamacao: true,
  causa_raiz: true,
  observacao: true,
  procedente_improcedente: true,
  data_abertura: true,
  data_vencimento: true,
  data_conclusao: true,
  municipios: {
    select: { municipio: true, regionais: { select: { regional: true } } },
  },
  turmas: { select: { turma: true } },
} satisfies Prisma.reclamacoes_ouvidoriaSelect;

type Row = Prisma.reclamacoes_ouvidoriaGetPayload<{ select: typeof SELECT }>;

// Timestamp sem timezone: o Prisma lê como UTC, então slice(0, 10) devolve a data gravada.
const toIsoDate = (d: Date | null): string | null =>
  d ? d.toISOString().slice(0, 10) : null;

// 'improcedente' contém 'procedente': a ordem dos testes importa.
// Conferir: SELECT DISTINCT procedente_improcedente FROM reclamacoes_ouvidoria;
function toBucket(value: string | null): ResultadoBucket {
  const s = (value ?? '').trim().toLowerCase();
  if (s.startsWith('improcedente')) return 'improcedente';
  if (s.startsWith('procedente')) return 'procedente';
  return 'indefinido';
}

@Injectable()
export class ComplaintsAndOmbudsmansOfficeRepository implements IComplaintsAndOmbudsmansOfficeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(where: Record<string, any>): Promise<Reclamacao[]> {
    const rows = await this.prisma.reclamacoes_ouvidoria.findMany({
      where,
      select: SELECT,
    });
    return rows.map(this.toDomain);
  }

  private toDomain = (r: Row): Reclamacao => ({
    id: String(r.id),
    nota: r.nota,
    empreiteira: r.turmas.turma, // confirmar que bate com canonicalEmpreiteira (ver resposta)
    regional: r.municipios.regionais.regional,
    municipio: r.municipios.municipio,
    status: r.status,
    statusPrazo: r.status_prazo ?? '',
    tipoReclamacao: r.tipo_reclamacao ?? '',
    causaRaiz: r.causa_raiz,
    observacao: r.observacao,
    resultadoBucket: toBucket(r.procedente_improcedente),
    resultadoLabel: r.procedente_improcedente ?? '',
    valorMulta: null, // sem coluna no schema
    transgressao: '', // sem coluna no schema
    dataAbertura: toIsoDate(r.data_abertura),
    dataConclusao: toIsoDate(r.data_conclusao),
    dataVencimento: toIsoDate(r.data_vencimento),
  });
}
