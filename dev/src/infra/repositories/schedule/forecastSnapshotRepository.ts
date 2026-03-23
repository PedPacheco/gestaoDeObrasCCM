import { IForecastSnapshotRepository } from 'src/domain/repositories/schedule/IForecastSnapshotRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  CreateForecastSnapshotDTO,
  GetForecastSnapshotDTO,
} from 'src/interface/dtos/forecastSnapshotDTO';

// prismaForecastSnapshot.repository.ts
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

  async get(params: GetForecastSnapshotDTO): Promise<any> {
    // const { dataInicial, dataFinal } = params;

    return await this.prisma.forecast_snapshot.findUnique({
      where: {
        id: params.idForecast,
      },
    });
  }
}
