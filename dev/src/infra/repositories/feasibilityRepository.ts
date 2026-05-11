import { Injectable } from '@nestjs/common';
import { IFeasibilityRepository } from 'src/domain/repositories/IFeasibilityRepository';
import { PrismaService } from '../prisma/prisma.service';

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

  async saveFiles(idWork: number, files: Express.Multer.File[]): Promise<void> {
    const data = files.map((file) => ({
      id_obra: idWork,
      caminho_arquivo: file.filename,
    }));

    await this.prisma.relatorio_viabilidade.createMany({
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
}
