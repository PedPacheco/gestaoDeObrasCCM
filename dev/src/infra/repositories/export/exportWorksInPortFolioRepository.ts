import { Injectable } from '@nestjs/common';
import { IExportWorksInPortFolioRepository } from 'src/domain/repositories/IExportRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class ExportWorksInPortfolioRepository
  implements IExportWorksInPortFolioRepository
{
  constructor(private prisma: PrismaService) {}

  async export(): Promise<any> {
    return await this.prisma.exportacao_obras_carteira.findMany();
  }
}
