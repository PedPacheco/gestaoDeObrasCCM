import { GoalsDTO } from 'src/interface/dtos/goalsDto';
import { GetGoalsResponse } from '../types';

export interface IGoalsRepository {
  getGoals(filters: GoalsDTO): Promise<GetGoalsResponse[]>;
}

export const GOALS_REPOSITORY = Symbol('GoalsRepository');
