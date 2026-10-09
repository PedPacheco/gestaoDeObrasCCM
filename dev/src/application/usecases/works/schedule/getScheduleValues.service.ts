import {
  GET_SCHEDULE_VALUES_REPOSITORY,
  IGetScheduleValuesRepository,
} from 'src/domain/repositories/schedule/IGetScheduleValuesRepository';
import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';
import { GetScheduleValuesResponse } from 'src/interface/types/schedule/getScheduleValuesInterface';

import { Inject, Injectable } from '@nestjs/common';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';
import { QueriesServicesService } from '../../services/queriesServices.service';
import { PointByPointCostService } from 'src/domain/services/pointByPointCost.service';

@Injectable()
export class GetScheduleValuesService {
  constructor(
    @Inject(GET_SCHEDULE_VALUES_REPOSITORY)
    private readonly getScheduleValuesRepository: IGetScheduleValuesRepository,
    private readonly deadlineStatusService: DeadlineStatusService,
    private readonly workServicesQueryService: QueriesServicesService,
    private readonly pointByPointCostService: PointByPointCostService,
  ) {}

  async getValues(
    filters: GetScheduleValuesDTO,
  ): Promise<GetScheduleValuesResponse> {
    const { works, resultTotals } =
      await this.getScheduleValuesRepository.getValues(filters);

    const totals = this.buildTotals(resultTotals);

    const totalExec =
      totals.total_obras > 0
        ? this.calculateTotalExec(works) / totals.total_obras
        : 0;

    const allServices =
      await this.workServicesQueryService.getServiceScheduleHistoryByIdSchedule(
        works.map((w) => w.id_programacao),
      );

    const servicesByWorkId =
      this.pointByPointCostService.groupByScheduleId(allServices);

    const worksWithRestrictionVerification = works.map((work) => {
      const services = servicesByWorkId.get(work.id_programacao) ?? [];

      const forecast = this.calculateForecast(work);
      const costPointByPoint = this.pointByPointCostService.calculate(services);

      return {
        ...work,
        restricao_aberta: this.hasOpenRestriction(work),
        status_prazo: this.deadlineStatusService.calculate(work),
        moPlanejadaPontoAPonto: costPointByPoint.planejado,
        moExecutadoPontoAPonto: costPointByPoint.executado,

        mo_forecast: forecast.serviceCapexForecast,
        mat_forecast: forecast.materialCapexForecast,
        forecast_total: forecast.forecastTotal,
      };
    });

    const pointByPointTotals = this.calculatePointByPointTotals(
      worksWithRestrictionVerification,
    );

    const response: GetScheduleValuesResponse = {
      works: worksWithRestrictionVerification,
      totals: {
        ...totals,
        total_exec: totalExec,
        total_ponto_a_ponto_programado: pointByPointTotals.planejado,
        total_ponto_a_ponto_executado: pointByPointTotals.executado,
      },
    };

    return response;
  }

  private calculateForecast(work: any) {
    const { prog, exec, executado, capex_mat_pend, capex_mo_pend } = work;

    const progRate = prog / 100;
    const totalExecRate = executado / 100;

    const execTotal =
      exec == null
        ? Math.min(1, totalExecRate + progRate)
        : totalExecRate < 1
          ? progRate
          : totalExecRate;

    const factor = execTotal >= 1 ? 1 : progRate;
    const serviceCapexForecast = capex_mo_pend * factor;
    const materialCapexForecast = capex_mat_pend * factor;

    return {
      serviceCapexForecast,
      materialCapexForecast,
      forecastTotal: serviceCapexForecast + materialCapexForecast,
    };
  }

  private buildTotals(rawTotals: any) {
    if (!rawTotals) {
      return {
        total_obras: 0,
        total_mo_planejada: 0,
        total_mo_exec: 0,
        total_qtde_planejada: 0,
      };
    }

    return {
      total_obras: Number(rawTotals.total_obras),
      total_mo_planejada: rawTotals.total_mo_planejada,
      total_mo_exec: rawTotals.total_mo_exec,
      total_qtde_planejada: rawTotals.total_qtde_planejada,
    };
  }

  private calculatePointByPointTotals(
    works: {
      moPlanejadaPontoAPonto?: number;
      moExecutadoPontoAPonto?: number;
    }[],
  ) {
    const totals = works.reduce(
      (acc, work) => {
        acc.planejado += Number(work.moPlanejadaPontoAPonto) || 0;
        acc.executado += Number(work.moExecutadoPontoAPonto) || 0;
        return acc;
      },
      { planejado: 0, executado: 0 },
    );

    return {
      planejado: Math.round(totals.planejado * 100) / 100,
      executado: Math.round(totals.executado * 100) / 100,
    };
  }

  private calculateTotalExec(works: any[]) {
    return works.reduce((acc, work) => acc + work.exec, 0);
  }

  private hasOpenRestriction(work: any): boolean {
    const {
      id_restricao_prog1,
      id_restricao_prog2,
      status_restricao1,
      status_restricao2,
      data_resolucao1,
      data_resolucao2,
    } = work;

    const hasRestriction1 = id_restricao_prog1 !== 1;
    const isUnresolved1 = hasRestriction1 && status_restricao1 !== 'Resolvido';
    const hasNoResolutionDate1 = hasRestriction1 && !data_resolucao1;

    const hasRestriction2 = id_restricao_prog2 !== 1;
    const isUnresolved2 = hasRestriction2 && status_restricao2 !== 'Resolvido';
    const hasNoResolutionDate2 = hasRestriction2 && !data_resolucao2;

    if (!hasRestriction1 && !hasRestriction2) {
      return false;
    }

    const restriction1Open =
      hasRestriction1 && isUnresolved1 && hasNoResolutionDate1;
    const restriction2Open =
      hasRestriction2 && isUnresolved2 && hasNoResolutionDate2;

    return restriction1Open || restriction2Open;
  }
}
