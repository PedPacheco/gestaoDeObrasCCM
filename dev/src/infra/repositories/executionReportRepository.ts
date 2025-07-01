import { IExecutionReportRepository } from 'src/domain/repositories/IExecutionReportRepository';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class ExecutionReportRepository implements IExecutionReportRepository {
  constructor(private readonly prisma: PrismaService) {}

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
        possui_equipamentos_retirados: true,
        equipamentos_retirados: true,
        potencia_equipamento_retirado: true,
        patrimonio_equipamento_retirado: true,
        alteracoes_execucao: true,
        situacao_obra: true,
        observacoes_gerais: true,
        referencia_chave_provisoria: true,
        chave_provisoria_retirada: true,
        motivo: true,
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
}
