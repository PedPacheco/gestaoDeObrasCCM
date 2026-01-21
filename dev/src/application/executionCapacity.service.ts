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

  async getFinancialValue(year: string) {
    const data = await this.executionCapacityRepository.getFinancialValue(year);

    const financialValues = data.reduce((acc, item) => {
      const key = `${item.regionais.regional}-${item.turmas.turma}`;

      if (!acc[key]) {
        acc[key] = {
          ano: item.ano,
          regional: item.regionais.regional,
          parceira: item.turmas.turma,
          jan: 0,
          fev: 0,
          mar: 0,
          abr: 0,
          mai: 0,
          jun: 0,
          jul: 0,
          ago: 0,
          set: 0,
          out: 0,
          nov: 0,
          dez: 0,
        };
      }

      acc[key].jan += item.should_cost * (item.jan ?? 0);
      acc[key].fev += item.should_cost * (item.fev ?? 0);
      acc[key].mar += item.should_cost * (item.mar ?? 0);
      acc[key].abr += item.should_cost * (item.abr ?? 0);
      acc[key].mai += item.should_cost * (item.mai ?? 0);
      acc[key].jun += item.should_cost * (item.jun ?? 0);
      acc[key].jul += item.should_cost * (item.jul ?? 0);
      acc[key].ago += item.should_cost * (item.ago ?? 0);
      acc[key].set += item.should_cost * (item.set ?? 0);
      acc[key].out += item.should_cost * (item.out ?? 0);
      acc[key].nov += item.should_cost * (item.nov ?? 0);
      acc[key].dez += item.should_cost * (item.dez ?? 0);

      return acc;
    }, {});

    return Object.values(financialValues);
  }

  async update(data: UpdateExecutionCapacityDTO[]) {
    await this.executionCapacityRepository.update(data);
  }
}
