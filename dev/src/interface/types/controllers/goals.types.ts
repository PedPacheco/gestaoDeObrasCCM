import { GoalGroupedResponse } from 'src/application/types';

export interface GoalsIntefaceController {
  statusCode: number;
  message: string;
  data: GoalGroupedResponse[];
}
