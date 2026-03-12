import * as moment from 'moment';
import { GetMonthlySummaryForecastInterface } from 'src/interface/types/schedule/getMonthlySummaryForecastInterface';

export function buildTotalTeamsMap(
  data: GetMonthlySummaryForecastInterface[],
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
