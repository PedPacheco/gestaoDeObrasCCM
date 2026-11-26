import { Injectable } from '@nestjs/common';
import type { ID5NotesRepository } from 'src/domain/contracts/d5Notes/ID5notesRepository';
import { NotFoundError, ValidationError } from 'src/domain/errors/domain.error';
import type {
  D5NoteDetail,
  D5NoteFilter,
  D5NoteListItem,
  D5NoteTotals,
  Pagination,
  UpdateD5NoteData,
} from 'src/domain/types';
import { Prisma } from 'src/infra/generated/prisma/client';
import { PrismaService } from 'src/infra/prisma/prisma.service'; // ajuste ao caminho atual
import {
  toD5NoteDetail,
  toD5NoteListItem,
  toD5NoteUpdateInput,
  toD5NoteWhere,
} from '../../mappers/d5Notes/d5Notes.mapper';
import {
  D5_NOTE_BY_ID_SELECT,
  D5_NOTE_LIST_SELECT,
} from '../../types/repositories/d5Notes/d5Notes.types';

@Injectable()
export class D5NotesRepository implements ID5NotesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(
    filter: D5NoteFilter,
    pagination?: Pagination,
  ): Promise<D5NoteListItem[]> {
    const rows = await this.prisma.notas_d5.findMany({
      where: toD5NoteWhere(filter),
      select: D5_NOTE_LIST_SELECT,
      orderBy: { criado_em: 'desc' }, // ⚠ copie o orderBy atual
      ...pagination,
    });
    return rows.map(toD5NoteListItem);
  }

  /** ⚠ Confirme com o corpo atual: total de notas e soma da mo_planejada. */
  async getTotals(filter: D5NoteFilter): Promise<D5NoteTotals> {
    const where = toD5NoteWhere(filter);
    const [total, sum] = await Promise.all([
      this.prisma.notas_d5.count({ where }),
      this.prisma.notas_d5.aggregate({ where, _sum: { mo_planejada: true } }),
    ]);
    return {
      total,
      totalMoRetida: Number(sum._sum.mo_planejada ?? 0),
    };
  }

  async getById(id: number): Promise<D5NoteDetail | null> {
    const row = await this.prisma.notas_d5.findUnique({
      where: { id },
      select: D5_NOTE_BY_ID_SELECT,
    });
    return row && toD5NoteDetail(row);
  }

  async update(
    id: number,
    data: UpdateD5NoteData,
    modifyingUserId: number,
  ): Promise<void> {
    try {
      await this.prisma.notas_d5.update({
        where: { id },
        data: toD5NoteUpdateInput(data, modifyingUserId),
      });
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025')
          throw new NotFoundError('Nota D5 não encontrada.');
        if (e.code === 'P2003')
          throw new ValidationError('Parceira ou status inexistente.');
      }
      throw e;
    }
  }
}
