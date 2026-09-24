import { Injectable } from '@nestjs/common';
import {
  D5NotePagination,
  ID5NotesRepository,
} from 'src/domain/repositories/d5Notes/ID5notesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  D5NoteByIdQueryResult,
  FindD5NotesQueryResult,
} from 'src/interface/types/d5notes/types';

@Injectable()
export class D5NotesRepository implements ID5NotesRepository {
  private readonly baseServicesSelect = {
    id: true,
    local_instalacao: true,
    criado_em: true,
    conclusao_nota: true,
    status_sap: true,
    tme_executado: true,
    tme_abertura: true,
    validacao_anual: true,
    mo_planejada: true,
    nota_d5: true,
    obras: {
      select: {
        ovnota: true,
        diagrama: true,
        ordem_dci: true,
        ordem_dca: true,
        ordem_dcd: true,
        ordem_dcim: true,
      },
    },
    municipios: {
      select: {
        mun_minusculo: true,
        regionais: { select: { regional: true } },
      },
    },
    status: { select: { status: true } },
    tipos: { select: { tipo_obra: true } },
    turmas: { select: { turma: true } },
    novo_tabela_usuarios: { select: { nome: true } },
  };

  constructor(private readonly prisma: PrismaService) {}

  async get(
    where: Record<string, any>,
    pagination?: D5NotePagination,
  ): Promise<FindD5NotesQueryResult[]> {
    return await this.prisma.notas_d5.findMany({
      where,
      skip: pagination?.skip,
      take: pagination?.take,
      select: this.baseServicesSelect,
    });
  }

  async getTotals(
    where: Record<string, any>,
  ): Promise<{ total: number; totalMoPlanejada: number }> {
    const result = await this.prisma.notas_d5.aggregate({
      where,
      _count: { _all: true },
      _sum: { mo_planejada: true },
    });

    return {
      total: result._count._all,
      totalMoPlanejada: Number(result._sum.mo_planejada ?? 0),
    };
  }

  async getById(id: number): Promise<D5NoteByIdQueryResult | null> {
    return await this.prisma.notas_d5.findUnique({
      where: { id },
      select: {
        ...this.baseServicesSelect,
        programacoes_d5: { select: { prog: true, exec: true } },
      },
    });
  }
}
