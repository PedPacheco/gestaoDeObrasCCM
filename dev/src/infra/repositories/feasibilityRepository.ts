import { Injectable } from '@nestjs/common';
import { IFeasibilityRepository } from 'src/domain/repositories/IFeasibilityRepository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FeasibilityRepository implements IFeasibilityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async exists(idWork: number): Promise<boolean> {
    const count = await this.prisma.relatorio_viabilidade.count({
      where: { id_obra: idWork },
    });
    return count > 0;
  }

  async saveFiles(idWork: number, files: Express.Multer.File[]): Promise<void> {
    const data = files.map((file) => ({
      id_obra: idWork,
      caminho_arquivo: file.path,
    }));

    await this.prisma.relatorio_viabilidade.createMany({
      data,
    });
  }

  async findFiles(
    idWork: number,
  ): Promise<{ id: number; caminho_arquivo: string }[]> {
    return await this.prisma.relatorio_viabilidade.findMany({
      where: { id_obra: idWork },
      select: { id: true, caminho_arquivo: true },
    });
  }

  async deleteFiles(idWork: number): Promise<void> {
    await this.prisma.relatorio_viabilidade.deleteMany({
      where: { id_obra: idWork },
    });
  }
}
