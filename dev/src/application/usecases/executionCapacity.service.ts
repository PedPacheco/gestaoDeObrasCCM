import {
  EXECUTION_CAPACITY_REPOSITORY,
  IExecutionCapacityRepository,
} from 'src/domain/repositories/IExecutionCapacityRepository';
import {
  ExecutionCapacityDTO,
  UpdateExecutionCapacityDTO,
} from 'src/interface/dtos/executionCapacityDTO';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ExecutionCapacityService {
  constructor(
    @Inject(EXECUTION_CAPACITY_REPOSITORY)
    private readonly executionCapacityRepository: IExecutionCapacityRepository,
  ) {}

  async get(filters: ExecutionCapacityDTO) {
    const data = await this.executionCapacityRepository.get(filters);

    const formattedData = data.map(({ regionais, turmas, ...rest }) => ({
      regional: regionais?.regional,
      parceira: turmas?.turma,
      ...rest,
    }));

    return formattedData;
  }

  async getFinancialValue(filters: ExecutionCapacityDTO) {
    const data =
      await this.executionCapacityRepository.getFinancialValue(filters);

    const financialValues = data.reduce((acc, item) => {
      const key = `${item.regionais.regional}-${item.turmas.turma}`;

      if (!acc[key]) {
        acc[key] = {
          ano: item.ano,
          regional: item.regionais.regional,
          parceira: item.turmas.turma,
          total_rfp: 0,
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

      acc[key].total_rfp += item.should_cost * item.qtd_equipes_rfp;
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
