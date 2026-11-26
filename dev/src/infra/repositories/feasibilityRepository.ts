import moment from 'moment';
import { IFeasibilityRepository } from 'src/domain/contracts/IFeasibilityRepository';

import { Injectable } from '@nestjs/common';

import {
  FeasibilityExportWork,
  FeasibilityFiles,
  FeasibilityFileType,
  FeasibilityRejection,
  FeasibilityReport,
  FeasibleItemUpdate,
  RejectFeasibilityData,
  StatusFeasibility,
} from 'src/domain/types';
import { Prisma } from '../generated/prisma/client';
import {
  toFeasibilityExportWork,
  toFeasibilityFiles,
  toFeasibilityRejection,
  toFeasibilityReport,
} from '../mappers/feasibility.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { workIdentifierWhere } from '../shared/workIdentifierWhere';
import {
  FEASIBILITY_EXPORT_SELECT,
  FEASIBILITY_FILES_SELECT,
  FEASIBILITY_MISSING_STATUS,
  FEASIBILITY_REJECTION_SELECT,
} from '../types/repositories/feasibility.types';

@Injectable()
export class FeasibilityRepository implements IFeasibilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<FeasibilityReport | null> {
    const row = await this.prisma.relatorio_viabilidade.findFirst({
      where: { obras: workIdentifierWhere(id) },
    });

    return row && toFeasibilityReport(row);
  }

  async getProjectDate(workId: number): Promise<Date | null> {
    const row = await this.prisma.obras.findUnique({
      where: { id: workId },
      select: { data_empreitamento: true },
    });
    return row?.data_empreitamento ?? null;
  }

  async getRejections(workId: number): Promise<FeasibilityRejection[]> {
    const rows = await this.prisma.reprovacoes_viabilidade.findMany({
      where: { relatorio_viabilidade: { id_obra: workId } },
      select: FEASIBILITY_REJECTION_SELECT,
    });
    return rows.map(toFeasibilityRejection);
  }

  async exportFeasibility(
    statusId: number,
    partnerIds: number[] = [],
  ): Promise<FeasibilityExportWork[]> {
    const rows = await this.prisma.obras.findMany({
      where: {
        programacao_ponto_a_ponto: true,
        id_status: statusId,
        ...(partnerIds.length ? { id_turma: { in: partnerIds } } : {}),
      },
      select: FEASIBILITY_EXPORT_SELECT,
    });
    return rows.map(toFeasibilityExportWork);
  }

  async makeItemsFeasible(
    items: FeasibleItemUpdate[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    if (!items.length) return; // evita "IN ()", que dá erro de SQL

    const cases = items.map(
      (item) => Prisma.sql`WHEN id = ${item.id} THEN ${item.feasibleQuantity}`,
    );
    const ids = items.map((item) => item.id);

    await tx.$executeRaw`
    UPDATE servicos
    SET viabilizado = CASE
      ${Prisma.join(cases, ' ')}
      ELSE viabilizado
    END
    WHERE id IN (${Prisma.join(ids)})
  `;
  }

  async saveFiles(
    workId: number,
    userId: number,
    status: StatusFeasibility,
    paths: string[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const data = {
      caminhos_arquivos: paths,
      id_usuario: userId,
      data_envio: moment.utc().toDate(),
      prazo_viabilidade: status,
    };

    await tx.relatorio_viabilidade.upsert({
      where: { id_obra: workId },
      create: { id_obra: workId, ...data },
      update: data,
    });
  }

  async updateFiles(
    workId: number,
    paths: string[],
    type: FeasibilityFileType,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const data =
      type === 'technical'
        ? { caminhos_arquivos: paths }
        : { arquivos_complementares: paths };

    await tx.relatorio_viabilidade.update({
      where: { id_obra: workId },
      data,
    });
  }

  async findFiles(workId: number): Promise<FeasibilityFiles | null> {
    const row = await this.prisma.relatorio_viabilidade.findUnique({
      where: { id_obra: workId },
      select: FEASIBILITY_FILES_SELECT,
    });
    return row && toFeasibilityFiles(row);
  }

  async reject(
    data: RejectFeasibilityData,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.reprovacoes_viabilidade.create({
      data: {
        descricao: data.description,
        motivo: data.reason,
        id_relatorio_viabilidade: data.feasibilityReportId,
        id_usuario: data.userId,
      },
    });

    await tx.relatorio_viabilidade.update({
      where: { id: data.feasibilityReportId },
      data: {
        data_envio: null,
        prazo_viabilidade: FEASIBILITY_MISSING_STATUS,
      },
    });
  }

  async approve(
    workId: number,
    userId: number,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.relatorio_viabilidade.update({
      where: { id_obra: workId },
      data: {
        data_aprovacao: moment.utc().toDate(),
        aprovada: true,
        id_usuario_aprovador: userId,
      },
    });
  }
}
