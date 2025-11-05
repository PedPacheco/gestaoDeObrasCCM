import { UpdateExecutionCapacityDTO } from './../interface/dtos/executionCapacityDTO';
import { Inject, Injectable } from '@nestjs/common';
import {
  EXECUTION_CAPACITY_REPOSITORY,
  IExecutionCapacityRepository,
} from 'src/domain/repositories/IExecutionCapacityRepository';
import { ExecutionCapacityDTO } from 'src/interface/dtos/executionCapacityDTO';
import { ExecutionCapacityFilter } from 'src/interface/types/executionCapacityInterface';

@Injectable()
export class ExecutionCapacityService {
  constructor(
    @Inject(EXECUTION_CAPACITY_REPOSITORY)
    private readonly executionCapacityRepository: IExecutionCapacityRepository,
  ) {}

  async get(filters: ExecutionCapacityDTO) {
    const { year, partnerId, regionalId, teams } = filters;

    const where: ExecutionCapacityFilter = { ano: year };

    if (partnerId) where.id_turma = partnerId;
    if (regionalId) where.id_regional = regionalId;
    if (teams) where.equipe = teams;

    const data = await this.executionCapacityRepository.get(where);

    const formattedData = data.map(({ regionais, turmas, ...rest }) => ({
      regional: regionais?.regional,
      parceira: turmas?.turma,
      ...rest,
    }));

    return formattedData;
  }

  async update(data: UpdateExecutionCapacityDTO[]) {
    await this.executionCapacityRepository.update(data);
  }
}
