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

  async exists(idWork: number): Promise<any[]> {
    const value = idWork.toString();

    const data = await this.prisma.relatorio_viabilidade.findMany({
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
    return data;
  }

  async getProjectDate(idWork: number): Promise<{ data_empreitamento: Date }> {
    return await this.prisma.obras.findUnique({
      select: { data_empreitamento: true },
      where: { id: idWork },
    });
  }

  async getRejections(idWork: number): Promise<any[]> {
    return await this.prisma.reprovacoes_viabilidade.findMany({
      where: { id_obra: idWork },
      select: {
        descricao: true,
        motivo: true,
        criado_em: true,
        novo_tabela_usuarios: { select: { nome: true } },
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
    files: Express.Multer.File[],
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const data = files.map((file) => ({
      id_obra: idWork,
      caminho_arquivo: file.filename,
      id_usuario: idUser,
    }));

    await tx.relatorio_viabilidade.createMany({
      data,
    });
  }

  async findFiles(
    idWork: number,
  ): Promise<{ id: number; caminho_arquivo: string; id_obra: number }[]> {
    const value = idWork.toString();

    return await this.prisma.relatorio_viabilidade.findMany({
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
      select: { id: true, caminho_arquivo: true, id_obra: true },
    });
  }

  async deleteFiles(idWork: number): Promise<void> {
    await this.prisma.relatorio_viabilidade.deleteMany({
      where: { id_obra: idWork },
    });
  }

  async reject(
    data: RejectFeasibilityDTO,
    tx: Prisma.TransactionClient,
  ): Promise<void> {
    const { description, idWork, reason, idUser } = data;

    await tx.reprovacoes_viabilidade.create({
      data: {
        descricao: description,
        motivo: reason,
        id_obra: idWork,
        id_usuario: idUser,
      },
    });
  }

  async approve(idWork: number, status: StatusFeasibility): Promise<void> {
    await this.prisma.obras.update({
      where: { id: idWork },
      data: {
        id_status: 1,
        data_viabilidade: moment.utc().toDate(),
        prazo_viabilidade: status,
      },
    });
  }
}
