import { D5NotePagination } from 'src/domain/repositories/d5Notes/ID5notesRepository';
import { ID5NotesSchedulesRepository } from 'src/domain/repositories/d5Notes/ID5NotesSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  D5NoteScheduleCreateData,
  D5NoteScheduleUpdateData,
  D5ScheduleRejectionData,
  FindRejectionsByD5NotesQueryResult,
  NoteScheduledWork,
  SchedulesD5NotesByIdQueryResult,
  SchedulesD5NotesByNoteIdQueryResult,
  SchedulesD5NotesQueryResult,
} from 'src/interface/types/d5notes/types';

import { Injectable } from '@nestjs/common';

@Injectable()
export class D5NotesSchedulesRepository implements ID5NotesSchedulesRepository {
  private readonly baseScheduleSelect = {
    data_prog: true,
    hora_ini: true,
    hora_ter: true,
    prog: true,
    exec: true,
    equipe_lm: true,
    equipe_lv: true,
    equipe_reg: true,
    chave_provisoria: true,
    chi: true,
    num_dp: true,
    tipo_servico: true,
    observacao_programacao: true,
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async get(
    where: Record<string, any>,
    pagination?: D5NotePagination,
  ): Promise<SchedulesD5NotesQueryResult[]> {
    return await this.prisma.programacoes_d5.findMany({
      where,
      take: pagination?.take,
      skip: pagination?.skip,
      select: {
        ...this.baseScheduleSelect,
        tecnicos: { select: { tecnico: true } },
        notas_d5: {
          select: {
            id: true,
            local_instalacao: true,
            criado_em: true,
            conclusao_nota: true,
            status_sap: true,
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
          },
        },
      },
    });
  }

  async getById(id: number): Promise<SchedulesD5NotesByIdQueryResult | null> {
    return await this.prisma.programacoes_d5.findUnique({
      where: { id },
      select: {
        id: true,
        id_nota_d5: true,
        ...this.baseScheduleSelect,
        observacao_execucao: true,
        responsavel_restricao: true,
        id_usuario_criador: true,
        id_usuario_modificador: true,
        id_restricao: true,
        id_tecnico: true,
        caminhos_arquivos: true,
        reprovada: true,
      },
    });
  }

  async getByD5NoteId(
    id: number,
  ): Promise<SchedulesD5NotesByNoteIdQueryResult[]> {
    return await this.prisma.programacoes_d5.findMany({
      where: { id_nota_d5: id },
      select: {
        id: true,
        id_nota_d5: true,
        ...this.baseScheduleSelect,
        tecnicos: { select: { id: true, tecnico: true } },
        criado_em: true,
        observacao_execucao: true,
        responsavel_restricao: true,
        restricoes: { select: { id: true, restricao: true } },
        usuario_criador: { select: { nome: true } },
        usuario_modificador: { select: { nome: true } },
        caminhos_arquivos: true,
        reprovada: true,
      },
    });
  }

  async findRejections(
    id: number,
  ): Promise<FindRejectionsByD5NotesQueryResult[]> {
    return await this.prisma.programacoes_d5_reprovacoes.findMany({
      where: { id_nota_d5: id },
      select: {
        id: true,
        data_reprovacao: true,
        data_prog: true,
        hora_ini: true,
        hora_ter: true,
        prog: true,
        descricao: true,
        equipe_lm: true,
        equipe_lv: true,
        equipe_reg: true,
        tipo_servico: true,
        chave_provisoria: true,
        chi: true,
        num_dp: true,
        observacao_programacao: true,
        restricoes: { select: { restricao: true } },
        novo_tabela_usuarios: { select: { nome: true } },
      },
    });
  }

  async getTotals(where: Record<string, any>): Promise<NoteScheduledWork[]> {
    const d5Notes = await this.prisma.notas_d5.findMany({
      where: { programacoes_d5: { some: where } },
      select: {
        id: true,
        mo_planejada: true,
        programacoes_d5: {
          where,
          select: { prog: true },
        },
      },
    });

    return d5Notes.map((note) => ({
      noteId: note.id,
      moRetida: Number(note.mo_planejada ?? 0),
      progs: note.programacoes_d5.map((p) => Number(p.prog ?? 0)),
    }));
  }

  async create(id: number, data: D5NoteScheduleCreateData): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.notas_d5.update({
        where: { id },
        data: { id_status: 35 },
      });

      await tx.programacoes_d5.create({
        data,
      });
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.programacoes_d5.delete({
      where: { id },
    });
  }

  async updateAndSyncWorkStatus(
    id: number,
    data: D5NoteScheduleUpdateData,
    d5NoteId: number,
    isRejectedD5Note: boolean,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.programacoes_d5.update({
        where: { id },
        data: { reprovada: false, ...data },
      });

      // recalcula já com o valor gravado
      const result = await tx.programacoes_d5.aggregate({
        where: { id_nota_d5: d5NoteId },
        _sum: { exec: true },
      });

      const totalExec = Number(result._sum.exec ?? 0);

      if (totalExec >= 100) {
        await tx.notas_d5.update({
          where: { id: d5NoteId },
          data: {
            id_status: 2,
            conclusao_nota: data.data_prog,
          },
        });
      }

      if (isRejectedD5Note) {
        await tx.notas_d5.update({
          where: { id: d5NoteId },
          data: {
            id_status: 35,
          },
        });
      }
    });
  }

  async rejectMany(
    ids: number[],
    rejections: D5ScheduleRejectionData[],
    d5NoteId: number,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.programacoes_d5_reprovacoes.createMany({
        data: rejections,
      });

      await tx.programacoes_d5.updateMany({
        where: { id: { in: ids } },
        data: { reprovada: true },
      });

      await tx.notas_d5.update({
        where: { id: d5NoteId },
        data: { id_status: 1 },
      });
    });
  }
}
