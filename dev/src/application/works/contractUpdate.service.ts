import { Inject, Injectable } from '@nestjs/common';
import {
  CONTRACT_UPDATE_REPOSITORY,
  IContractUpdateRepository,
} from 'src/domain/repositories/works/IContractUpdateRepository';
import { ContractUpdateDTO } from 'src/interface/dtos/worksDto';

@Injectable()
export class ContractUpdateService {
  constructor(
    @Inject(CONTRACT_UPDATE_REPOSITORY)
    private readonly contractUpdateRepository: IContractUpdateRepository,
  ) {}

  async update(data: ContractUpdateDTO[]) {
    const workWithOrderType = data.map((work) => {
      const { ordemDiagrama } = work;

      let ordemField: string = null;
      if (ordemDiagrama.startsWith('170')) ordemField = 'ordem_dci';
      if (ordemDiagrama.startsWith('190')) ordemField = 'ordem_dcd';
      if (ordemDiagrama.startsWith('150')) ordemField = 'ordem_dca';
      if (ordemDiagrama.startsWith('180')) ordemField = 'ordem_dcim';
      if (ordemDiagrama.startsWith('200')) ordemField = 'diagrama';

      if (!ordemField) {
        throw new Error(`Ordem inválida: ${ordemDiagrama}`);
      }

      return {
        ...work,
        ordemField,
      };
    });

    return await this.contractUpdateRepository.update(workWithOrderType);
  }
}
