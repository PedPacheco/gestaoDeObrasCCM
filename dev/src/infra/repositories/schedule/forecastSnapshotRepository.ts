import { IForecastSnapshotRepository } from 'src/domain/contracts/IForecastSnapshotRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateForecastSnapshotDTO } from 'src/interface/dtos/forecastSnapshotDTO';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class ForecastSnapshotRepository implements IForecastSnapshotRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateForecastSnapshotDTO) {
    await this.prisma.forecast_snapshot.create({
      data: {
        filtros: (data.filtros ?? {}) as Prisma.InputJsonValue,
        diario: data.diario as unknown as Prisma.InputJsonValue,
        grupo: data.grupo as unknown as Prisma.InputJsonValue,
      },
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.forecast_snapshot.delete({
      where: { id },
    });
  }

  async get(id: number): Promise<any> {
    return await this.prisma.forecast_snapshot.findUnique({
      where: { id },
    });
  }

  async getAll(where: any): Promise<any> {
    return await this.prisma.forecast_snapshot.findMany({
      where,
      select: {
        id: true,
        gerado_em: true,
        filtros: true,
      },
    });
  }
}
