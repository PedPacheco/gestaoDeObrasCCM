import { IExecutionReportRepository } from 'src/domain/repositories/IExecutionReportRepository';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExecutionReportRepository implements IExecutionReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async update(
    idExecutionReport: number,
    data: Prisma.relatorio_execucaoUpdateInput,
  ): Promise<void> {
    await this.prisma.relatorio_execucao.update({
      where: { id: idExecutionReport },
      data,
    });
  }

  async create(
    data: Prisma.relatorio_execucaoUncheckedCreateInput,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.relatorio_execucao.create({ data });
  }

  async delete(id: number, idSchedule: number) {
    await this.prisma.$transaction(async (tx) => {
      const schedule = await tx.programacoes.findUnique({
        where: { id: idSchedule },
        select: { exec: true, id_obra: true },
      });

      await tx.programacoes.update({
        where: { id: idSchedule },
        data: {
          exec: null,
          id_status_programacao: 3,
        },
      });

      await tx.obras.update({
        where: { id: schedule.id_obra },
        data: {
          id_status: 35,
          data_conclusao: null,
          executado: { decrement: schedule.exec },
        },
      });

      await tx.relatorio_execucao.delete({
        where: { id },
      });
    });
  }

  async findByScheduleId(
    idSchedule: number,
    tx: Prisma.TransactionClient,
  ): Promise<any> {
    return await tx.relatorio_execucao.findFirst({
      where: { id_programacao: idSchedule },
    });
  }

  async findByWorkId(idWork: number): Promise<any> {
    const value = idWork.toString();

    return await this.prisma.relatorio_execucao.findMany({
      where: {
        obras: {
          OR: [
            { id: value.length >= 10 ? undefined : idWork },
            { ovnota: value },
            { ordem_dci: value },
            { ordem_dcd: value },
            { ordem_dca: value },
            { ordem_dcim: value },
            { diagrama: value },
          ],
        },
      },
      select: {
        id: true,
        criado_em: true,
        id_usuario: true,
        supervisor: true,
        liberado_ligacao_parcial: true,
        hora_inicio: true,
        hora_conclusao: true,
        contato_inicio: true,
        contato_termino: true,
        atraso: true,
        justificativa_atraso: true,
        possui_equipamentos_instalados: true,
        equipamentos_aplicados: true,
        potencia_equipamento_aplicado: true,
        patrimonio_equipamento_aplicado: true,
        instalacao_equipamento_aplicado: true,
        possui_equipamentos_retirados: true,
        equipamentos_retirados: true,
        potencia_equipamento_retirado: true,
        patrimonio_equipamento_retirado: true,
        instalacao_equipamento_retirado: true,
        alteracoes_execucao: true,
        observacoes_gerais: true,
        chave_provisoria_instalada: true,
        referencia_chave_provisoria: true,
        chave_provisoria_retirada: true,
        referencia_chave_provisoria_retirada: true,
        motivo: true,
        caminho_arquivo: true,
        usuario: { select: { nome_usuario: true } },
        obras: {
          select: {
            ovnota: true,
            ordem_dci: true,
            tipos: { select: { tipo_obra: true } },
            status: { select: { status: true } },
          },
        },
        programacoes: {
          select: {
            data_prog: true,
            prog: true,
            exec: true,
            num_dp: true,
            hora_ini: true,
            hora_ter: true,
            chave_provisoria: true,
          },
        },
      },
    });
  }

  async findById(idExecutionReport: number): Promise<any> {
    return await this.prisma.relatorio_execucao.findFirst({
      select: { id: true, id_programacao: true, caminho_arquivo: true },
      where: { id: idExecutionReport },
    });
  }
}
