import {
  FORECAST_SNAPSHOT,
  IForecastSnapshotRepository,
} from 'src/domain/repositories/schedule/IForecastSnapshotRepository';
import {
  CreateForecastSnapshotDTO,
  GetForecastSnapshotDTO,
} from 'src/interface/dtos/forecastSnapshotDTO';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ForecastSnapshotService {
  constructor(
    @Inject(FORECAST_SNAPSHOT)
    private readonly repository: IForecastSnapshotRepository,
  ) {}

  async execute(data: CreateForecastSnapshotDTO) {
    if (!data.diario?.length) {
      throw new Error('Snapshot diário não pode estar vazio');
    }

    if (!data.grupo?.length) {
      throw new Error('Snapshot de grupo não pode estar vazio');
    }

    return this.repository.create(data);
  }

  async get(params: GetForecastSnapshotDTO) {
    const snapshots = await this.repository.get(params);

    const data = snapshots.map((snapshot) => {
      const { filtros, diario, grupo, gerado_em, id } = snapshot;

      return {
        id: id,
        geradoEm: gerado_em,
        nomeArquivo: `forecast_período_${filtros.dataInicial}-${filtros.dataFinal}`,
        diario: this.formatDaily(diario),
        grupo: this.formatGroup(grupo),
      };
    });

    return data;
  }

  private formatDaily(data: any[]): any[] {
    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
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

      diff: Number(item.diff ?? 0),
    }));
  }

  private formatGroup(data: any[]): any[] {
    if (!Array.isArray(data)) return [];

    return data.map((item) => ({
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

      diff: Number(item.diff ?? 0),
    }));
  }
}
