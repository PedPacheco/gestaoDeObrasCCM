import { IForecastSnapshotRepository } from 'src/domain/contracts/IForecastSnapshotRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { CreateForecastSnapshotDTO } from 'src/interface/dtos/forecastSnapshotDTO';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  ForecastSnapshotDailyItem,
  ForecastSnapshotFilters,
  ForecastSnapshotGetAllResponse,
  ForecastSnapshotGetResponse,
  ForecastSnapshotGroupItem,
} from 'src/domain/types';

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

  async get(id: number): Promise<ForecastSnapshotGetResponse> {
    const snapshot = await this.prisma.forecast_snapshot.findUnique({
      where: { id },
    });

    return {
      ...snapshot,
      filtros: snapshot.filtros as unknown as ForecastSnapshotFilters,
      diario: snapshot.diario as unknown as ForecastSnapshotDailyItem,
      grupo: snapshot.grupo as unknown as ForecastSnapshotGroupItem,
    };
  }

  async getAll(where: {
    gerado_em?: { lte: Date; gte: Date };
  }): Promise<ForecastSnapshotGetAllResponse[]> {
    const snapshots = await this.prisma.forecast_snapshot.findMany({
      where,
      select: {
        id: true,
        gerado_em: true,
        filtros: true,
      },
    });

    return snapshots.map((snapshot) => ({
      id: snapshot.id,
      gerado_em: snapshot.gerado_em,
      filtros: snapshot.filtros as unknown as ForecastSnapshotFilters,
    }));
  }
}
