import { Injectable } from '@nestjs/common';
import { IFeasibilityRepository } from 'src/domain/repositories/IFeasibilityRepository';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { ServiceMaterialItemDto } from 'src/interface/dtos/workServicesDTO';
import { RejectFeasibilityDTO } from 'src/interface/dtos/feasibilityDTO';
import { StatusFeasibility } from 'src/application/usecases/feasibility.service';
import moment from 'moment';

@Injectable()
export class FeasibilityRepository implements IFeasibilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async exists(idWork: number): Promise<any> {
    const value = idWork.toString();

    return await this.prisma.relatorio_viabilidade.findFirst({
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
    });
  }

  async getProjectDate(idWork: number): Promise<{ data_empreitamento: Date }> {
    return await this.prisma.obras.findUnique({
      select: { data_empreitamento: true },
      where: { id: idWork },
    });
  }

  async getRejections(workId: number): Promise<any[]> {
    return await this.prisma.reprovacoes_viabilidade.findMany({
      where: { relatorio_viabilidade: { id_obra: workId } },
      select: {
        descricao: true,
        motivo: true,
        criado_em: true,
        novo_tabela_usuarios: { select: { nome: true } },
      },
    });
  }

  async exportFeasibility(
    idStatus: number,
    idPartner?: number[],
  ): Promise<any[]> {
    return this.prisma.obras.findMany({
      where: {
        programacao_ponto_a_ponto: true,
        id_status: idStatus,
        ...(idPartner.length > 0 ? { id_turma: { in: idPartner } } : {}),
      },
      select: {
        ovnota: true,
        diagrama: true,
        ordem_dci: true,
        ordem_dca: true,
        ordem_dcd: true,
        ordem_dcim: true,
        relatorio_viabilidade: { select: { data_envio: true } },
        servicos: {
          select: {
            operacao: true,
            ponto: true,
            qtde_plan: true,
            viabilizado: true,
            descricao_operacao: true,
            numero_operacao: true,
            materiais: {
              select: {
                codigo: true,
                descricao: true,
                preco: true,
              },
            },
            servicos_contratos: {
              select: {
                material: true,
                texto_breve: true,
                preco: true,
              },
            },
          },
        },
      },
    });
  }

  async makeItemsFeasible(
    items: ServiceMaterialItemDto[],
    tx: Prisma.TransactionClient,
  ) {
    const cases = items.map(
      (item) => Prisma.sql`WHEN id = ${item.id} THEN ${item.viabilizado}`,
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
    idWork: number,
    idUser: number,
    status: StatusFeasibility,
    paths: string[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    await tx.relatorio_viabilidade.upsert({
      where: { id_obra: idWork },
      create: {
        id_obra: idWork,
        caminhos_arquivos: paths,
        id_usuario: idUser,
        data_envio: moment.utc().toDate(),
        prazo_viabilidade: status,
      },
      update: {
        caminhos_arquivos: paths,
        id_usuario: idUser,
        data_envio: moment.utc().toDate(),
        prazo_viabilidade: status,
      },
    });
  }

  async updateFiles(
    workId: number,
    paths: string[],
    type: 'technical' | 'complementary',
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const data =
      type === 'technical'
        ? { caminhos_arquivos: paths }
        : { arquivos_complementares: paths };

    await tx.relatorio_viabilidade.update({
      where: {
        id_obra: workId,
      },
      data,
    });
  }

  async findFiles(idWork: number): Promise<{
    id: number;
    caminhos_arquivos: string[];
    arquivos_complementares: string[];
  }> {
    return await this.prisma.relatorio_viabilidade.findUnique({
      where: {
        id_obra: idWork,
      },
      select: {
        id: true,
        caminhos_arquivos: true,
        arquivos_complementares: true,
      },
    });
  }

  async reject(
    data: RejectFeasibilityDTO,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const { description, feasibilityReportId, reason, userId } = data;

    await tx.reprovacoes_viabilidade.create({
      data: {
        descricao: description,
        motivo: reason,
        id_relatorio_viabilidade: feasibilityReportId,
        id_usuario: userId,
      },
    });

    await tx.relatorio_viabilidade.update({
      where: { id: feasibilityReportId },
      data: {
        data_envio: null,
        prazo_viabilidade: 'FALTA VIABILIDADE',
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
