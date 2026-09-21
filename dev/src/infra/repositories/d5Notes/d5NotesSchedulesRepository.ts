import { Injectable } from '@nestjs/common';
import { D5ScheduleProps } from 'src/domain/entities/schedules/D5NotesSchedule.entity';
import { D5NotePagination } from 'src/domain/repositories/d5Notes/ID5notesRepository';
import { ID5NotesSchedulesRepository } from 'src/domain/repositories/d5Notes/ID5NotesSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  D5NoteScheduleCreateData,
  SchedulesD5NotesByIdQueryResult,
  SchedulesD5NotesQueryResult,
} from 'src/interface/types/d5notes/types';

@Injectable()
export class D5NotesSchedulesRepository implements ID5NotesSchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(
    where: Record<string, any>,
    pagination?: D5NotePagination,
  ): Promise<SchedulesD5NotesQueryResult[]> {
    return await this.prisma.programacoes_d5.findMany({
      where,
      ...pagination,
      select: {
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
        tecnicos: { select: { tecnico: true } },
        notas_d5: {
          select: {
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
          },
        },
      },
    });
  }

  async getByD5NoteId(id: number): Promise<SchedulesD5NotesByIdQueryResult[]> {
    return await this.prisma.programacoes_d5.findMany({
      where: { id_nota_d5: id },
      select: {
        id: true,
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
        tecnicos: { select: { tecnico: true } },
        criado_em: true,
        observacao_execucao: true,
        responsavel_restricao: true,
        restricoes: { select: { restricao: true } },
        usuario_criador: { select: { nome: true } },
        usuario_modificador: { select: { nome: true } },
      },
    });
  }

  async create(data: D5NoteScheduleCreateData): Promise<void> {
    await this.prisma.programacoes_d5.create({
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.programacoes_d5.delete({
      where: { id },
    });
  }

  async update(id: number, data: any): Promise<void> {}
}
