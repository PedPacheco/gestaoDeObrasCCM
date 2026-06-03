import {
  FORECAST_SNAPSHOT,
  IForecastSnapshotRepository,
} from 'src/domain/repositories/IForecastSnapshotRepository';
import { CreateForecastSnapshotDTO } from 'src/interface/dtos/forecastSnapshotDTO';

import moment from 'moment';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ForecastSnapshotService {
  constructor(
    @Inject(FORECAST_SNAPSHOT)
    private readonly repository: IForecastSnapshotRepository,
  ) {}

  async execute(data: CreateForecastSnapshotDTO) {
    if (!data.diario?.summary.length) {
      throw new Error('Snapshot diário não pode estar vazio');
    }

    if (!data.grupo?.summary.length) {
      throw new Error('Snapshot de grupo não pode estar vazio');
    }

    await this.repository.create(data);
  }

  async get(params: number) {
    const snapshot = await this.repository.get(params);

    const { filtros, diario, grupo, gerado_em, id } = snapshot;

    const snapshotFormatted = {
      id: id,
      geradoEm: gerado_em,
      nomeArquivo: `forecast_período_${filtros.dataInicial}-${filtros.dataFinal}`,
      diario: this.formatDaily(diario),
      grupo: this.formatGroup(grupo),
    };

    return snapshotFormatted;
  }

  async getAll(filters?: { startDate?: string; endDate?: string }) {
    const where: any = {};

    if (filters?.startDate || filters?.endDate) {
      where.gerado_em = {
        ...(filters.startDate && {
          gte: moment(filters.startDate).startOf('day').toDate(),
        }),
        ...(filters.endDate && {
          lte: moment(filters.endDate).endOf('day').toDate(),
        }),
      };
    }

    const snapshots = await this.repository.getAll(where);

    return snapshots.map((snapshot) => {
      const { id, filtros, gerado_em } = snapshot;

      return {
        id: id,
        nomeArquivo: `Relatório do dia ${moment(gerado_em).format('DD/MM/YYYY HH:mm')}`,
        filtros,
      };
    });
  }

  async delete(id: number) {
    await this.repository.delete(id);
  }

  private formatDaily(data: any): any {
    if (!Array.isArray(data.summary)) return [];

    const formattedData = {
      totals: data.totals,
      summary: data.summary.map((item) => ({
        dataProg: item.dataProg,

        qtdeWorks: Number(item.qtdeWorks ?? 0),
        teams: Number(item.teams ?? 0),

        financialGoal: Number(item.financialGoal ?? 0),
        diaryGoal: Number(item.diaryGoal ?? 0),

        serviceMoProg: Number(item.serviceMoProg ?? 0),
        serviceMoPlan: Number(item.serviceMoPlan ?? 0),
        serviceMoPend: Number(item.serviceMoPend ?? 0),
        serviceMoExec: Number(item.serviceMoExec ?? 0),
        serviceMoForecast: Number(item.serviceMoForecast ?? 0),

        materialMoProg: Number(item.materialMoProg ?? 0),
        materialMoPlan: Number(item.materialMoPlan ?? 0),
        materialMoPend: Number(item.materialMoPend ?? 0),
        materialMoExec: Number(item.materialMoExec ?? 0),
        materialMoForecast: Number(item.materialMoForecast ?? 0),

        isServicePendLowerThanProg: Boolean(item.isServicePendLowerThanProg),
        isMaterialPendLowerThanProg: Boolean(item.isMaterialPendLowerThanProg),

        forecastTotal: Number(item.forecastTotal ?? 0),
        execTotal: Number(item.execTotal ?? 0),

        diff: Number(item.diff ?? 0),
      })),
    };

    return formattedData;
  }

  private formatGroup(data: any): any {
    if (!Array.isArray(data.summary)) return [];

    const formattedData = {
      totals: data.totals,
      summary: data.summary.map((item) => ({
        grupo: item.grupo,
        turma: item.turma,

        qtdeWorks: Number(item.qtdeWorks ?? 0),

        totalServiceMoProg: Number(item.totalServiceMoProg ?? 0),
        totalServiceMoPlan: Number(item.totalServiceMoPlan ?? 0),
        totalServiceMoPend: Number(item.totalServiceMoPend ?? 0),
        totalServiceMoPrev: Number(item.totalServiceMoPrev ?? 0),
        totalServiceMoExec: Number(item.totalServiceMoExec ?? 0),

        totalMaterialMoProg: Number(item.totalMaterialMoProg ?? 0),
        totalMaterialMoPlan: Number(item.totalMaterialMoPlan ?? 0),
        totalMaterialMoPend: Number(item.totalMaterialMoPend ?? 0),
        totalMaterialMoPrev: Number(item.totalMaterialMoPrev ?? 0),
        totalMaterialMoExec: Number(item.totalMaterialMoExec ?? 0),

        totalForecast: Number(item.totalForecast ?? 0),
        totalExec: Number(item.totalExec ?? 0),

        diff: Number(item.diff ?? 0),
      })),
    };

    return formattedData;
  }
}
