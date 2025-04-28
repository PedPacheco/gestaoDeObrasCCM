import { GoalsDTO } from 'src/interface/dtos/goalsDto';
import { goalsInterfaceRepository } from 'src/interface/types/goalsInterface';

export interface IGoalsRepository {
  getGoals(filters: GoalsDTO): Promise<goalsInterfaceRepository[]>;
}

export const GOALS_REPOSITORY = Symbol('GoalsRepository');
