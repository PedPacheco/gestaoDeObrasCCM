import { Inject, Injectable } from '@nestjs/common';
import {
  CONTRACT_UPDATE_REPOSITORY,
  IContractUpdateRepository,
} from 'src/domain/repositories/works/IContractUpdateService';

@Injectable()
export class ContractUpdateService {
  constructor(
    @Inject(CONTRACT_UPDATE_REPOSITORY)
    private readonly contractUpdateRepository: IContractUpdateRepository,
  ) {}

  async update(data: any[]) {
    const workWithOrderType = data.map((work) => {
      const { ordem } = work;

      if (ordem.substring(0, 3) === '170') {
        work = { ...work, tipoOrdem: 'DCI' };
      }

      if (ordem.substring(0, 3) === '190') {
        work = { ...work, tipoOrdem: 'DCD' };
      }

      if (ordem.substring(0, 3) === '150') {
        work = { ...work, tipoOrdem: 'DCA' };
      }

      if (ordem.substring(0, 3) === '180') {
        work = { ...work, tipoOrdem: 'DCIM' };
      }
    });

    return await this.contractUpdateRepository.update(workWithOrderType);
  }
}
