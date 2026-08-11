import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { GetMonthlySummaryForecastInterface } from 'src/interface/types/schedule/monthlySummaryForecastInterface';
import { GetMonthlySummaryInterface } from 'src/interface/types/schedule/monthlySummaryInterface';

const MONTH_FIELDS = [
  'jan',
  'fev',
  'mar',
  'abr',
  'mai',
  'jun',
  'jul',
  'ago',
  'set',
  'out',
  'nov',
  'dez',
];

@Injectable()
export class TeamAggregationService {
  buildTotalTeamsMap(
    data: GetMonthlySummaryForecastInterface[] | GetMonthlySummaryInterface[],
  ): Map<string, number> {
    return data.reduce((map, item) => {
      const dateKey = moment.utc(item.data_prog).format('DD/MM/YYYY');

      const teams =
        (item.equipe_linha_morta ?? 0) +
        (item.equipe_linha_viva ?? 0) +
        (item.equipe_regularizacao ?? 0);

      map.set(dateKey, (map.get(dateKey) ?? 0) + teams);

      return map;
    }, new Map<string, number>());
  }

  buildExecutionCapacityTeams(
    initialDate: string,
    endDate: string,
    data: any[],
  ): { rfpTeams: number | null; executionCapacityTeams: number | null } {
    const initial = moment(initialDate, 'DD/MM/YYYY', true);
    const end = moment(endDate, 'DD/MM/YYYY', true);

    const sameMonth = initial.month() === end.month();
    const sameYear = initial.year() === end.year();

    if (!sameMonth || !sameYear) {
      return { rfpTeams: null, executionCapacityTeams: null };
    }

    const totals = data.reduce(
      (acc, item: any) => {
        const monthField = MONTH_FIELDS[initial.month()];

        if (Number(item.ano) === initial.year()) {
          acc.rfpTeams += item.qtd_equipes_rfp ?? 0;

          acc.executionCapacityTeams += item[monthField] ?? 0;
        }

        return acc;
      },
      {
        rfpTeams: 0,
        executionCapacityTeams: 0,
      },
    );

    return totals;
  }
}
