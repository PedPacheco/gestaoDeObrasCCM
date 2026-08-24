import {
  GetScheduleValuesResponseItem,
  GetScheduleValuesTotals,
} from 'src/domain/types';

export type GetScheduleValuesOutput = {
  works: GetScheduleValuesResponseItem[];
  totals: GetScheduleValuesTotals;
};
