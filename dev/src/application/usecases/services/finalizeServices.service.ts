import {
  IWorkServicesExecutionRepository,
  WORK_SERVICES_EXECUTION_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesExecutionRepository';
import { PerformServicesDTO } from 'src/interface/dtos/workServicesDTO';

import { Inject, Injectable } from '@nestjs/common';

interface ScheduleTotals {
  prog: number;
  exec: number;
}

interface FinalizationData {
  id: number;
  idWork: number;
  dataProg: Date;
  prog: number;
  exec: number;
  idExecutionRestriction: number;
  responsibility: string;
  executionObservation: string;
}

@Injectable()
export class FinalizeServicesService {
  constructor(
    @Inject(WORK_SERVICES_EXECUTION_REPOSITORY)
    private readonly worksServicesExecutionRepository: IWorkServicesExecutionRepository,
  ) {}

  async performServices(data: PerformServicesDTO[]): Promise<void> {
    if (data.length === 0) return;

    await this.worksServicesExecutionRepository.performServices(data);
  }

  async finalizeServices(
    data: FinalizationData,
    pendingIds: number[],
    tx: any,
  ): Promise<void> {
    await this.worksServicesExecutionRepository.finalizeServices(
      data,
      pendingIds,
      tx,
    );
  }

  sumServiceQuantities(services: any[]): number {
    return services.reduce(
      (sum, service) =>
        sum + (service.viabilizado ?? 0) + (service.qtde_adicional ?? 0),
      0,
    );
  }

  calculateScheduleTotals(history: any[], scheduleId: number): ScheduleTotals {
    return history
      .filter((service) => service.id_programacao === scheduleId)
      .reduce(
        (acc, service) => ({
          exec: acc.exec + (service.real ?? 0),
          prog: acc.prog + (service.prog ?? 0),
        }),
        { prog: 0, exec: 0 },
      );
  }

  getPendingExecServices(history: any[], scheduleId: number): number[] {
    return history
      .filter(
        (service) =>
          service.id_programacao === scheduleId && service.real == null,
      )
      .map((service) => service.id_servico);
  }

  buildFinalizationData(
    services: any[],
    history: any[],
    updateData: any,
  ): FinalizationData {
    const validServices = services.filter((s) => s.qtde_real !== 0);
    const totalPlanned = this.sumServiceQuantities(validServices);
    const scheduleTotals = this.calculateScheduleTotals(
      history,
      updateData.idSchedule,
    );

    const calculatePercentage = (value: number) =>
      Math.round(totalPlanned > 0 ? (value / totalPlanned) * 100 : 0);

    return {
      id: updateData.idSchedule,
      idWork: updateData.workId,
      dataProg: history[0].programacoes.data_prog,
      prog: Math.min(calculatePercentage(scheduleTotals.prog)),
      exec: Math.min(calculatePercentage(scheduleTotals.exec)),
      idExecutionRestriction: updateData.idExecutionRestriction,
      responsibility: updateData.responsibility,
      executionObservation: updateData.executionObservation,
    };
  }

  sumExecutionValues(values: any[]): { exec: number; prog: number } {
    return values.reduce(
      (total, item) => ({
        exec: total.exec + (item.exec ?? 0),
        prog: total.prog + (item.prog ?? 0),
      }),
      { exec: 0, prog: 0 },
    );
  }
}
