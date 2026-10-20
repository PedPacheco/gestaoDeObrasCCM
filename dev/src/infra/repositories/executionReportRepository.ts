import { Injectable } from '@nestjs/common';
import { IExecutionReportRepository } from 'src/domain/repositories/IExecutionReportRepository';
import { Prisma } from 'src/generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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
        usuario: { select: { nome: true } },
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

  findScheduleWorkMode(idSchedule: number, tx: Prisma.TransactionClient) {
    return tx.programacoes.findUnique({
      where: { id: idSchedule },
      select: {
        id_obra: true,
        obras: { select: { programacao_ponto_a_ponto: true } },
      },
    });
  }

  async findScheduledServiceIds(
    idSchedule: number,
    tx: Prisma.TransactionClient,
  ): Promise<number[]> {
    const rows = await tx.programacoes_servicos.findMany({
      where: { id_programacao: idSchedule },
      select: { id_servico: true },
      distinct: ['id_servico'],
    });
    return rows.map((row) => row.id_servico);
  }

  async resetScheduleExecution(
    idSchedule: number,
    scheduleStatus: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await Promise.all([
      tx.programacoes_servicos.updateMany({
        where: { id_programacao: idSchedule },
        data: { real: null },
      }),
      tx.programacoes.update({
        where: { id: idSchedule },
        data: { exec: null, id_status_programacao: scheduleStatus },
      }),
    ]);
  }

  async clearServicesReal(
    serviceIds: number[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.servicos.updateMany({
      where: { id: { in: serviceIds } },
      data: { qtde_real: null },
    });
  }

  async sumWorkSchedulesExec(
    workId: number,
    tx: Prisma.TransactionClient,
  ): Promise<number> {
    const result = await tx.programacoes.aggregate({
      where: { id_obra: workId, exec: { not: null } },
      _sum: { exec: true },
    });
    return Number(result._sum.exec);
  }

  async updateWorkStatusAfterReset(
    workId: number,
    data: { status: number; executed?: number },
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.obras.update({
      where: { id: workId },
      data: {
        id_status: data.status,
        data_conclusao: null,
        ...(data.executed !== undefined && { executado: data.executed }),
      },
    });
  }

  async deleteReport(id: number, tx: Prisma.TransactionClient): Promise<void> {
    await tx.relatorio_execucao.delete({ where: { id } });
  }
}
