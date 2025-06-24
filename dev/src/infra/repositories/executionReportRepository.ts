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
    return await this.prisma.relatorio_execucao.findMany({
      where: { id_obra: idWork },
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
        equipamentos_retirados: true,
        potencia_equipamento_retirado: true,
        patrimonio_equipamento_retirado: true,
        alteracoes_execucao: true,
        observacoes_gerais: true,
        chave_provisoria_instalada: true,
        referencia_chave_provisoria: true,
        chave_provisoria_retirada: true,
        motivo: true,
        usuario: { select: { nome_usuario: true } },
        obras: {
          select: {
            ovnota: true,
            ordem_dci: true,
            tipos: { select: { tipo_obra: true } },
          },
        },
      },
    });
  }
}
