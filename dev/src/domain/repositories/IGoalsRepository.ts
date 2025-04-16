import { GoalsDTO } from 'src/interface/dtos/goalsDto';
import { Goals } from 'src/interface/types/goalsInterface';

export interface IGoalsRepository {
  getGoals(filters: GoalsDTO): Promise<Goals[]>;
}

export const GOALS_REPOSITORY = Symbol('GoalsRepository');
