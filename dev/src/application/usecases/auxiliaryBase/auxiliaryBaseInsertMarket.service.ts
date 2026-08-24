import { InsertAuxiliaryMarketInput } from 'src/application/types';
import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from 'src/domain/contracts/IAuxiliaryBaseRepository';
import { OperationType } from 'src/interface/types/baseAuxiliaryInterface';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { FindExistingWorksService } from '../works/findExistingWorks.service';

@Injectable()
export class AuxiliaryMarketInsertService {
  constructor(
    @Inject(AUXILIARY_BASE_REPOSITORY)
    private readonly auxiliaryBaseRepository: IAuxiliaryBaseRepository,
    private readonly findExistingWorksService: FindExistingWorksService,
  ) {}

  async execute(
    data: InsertAuxiliaryMarketInput[],
    operation: OperationType,
  ): Promise<void> {
    if (!data?.length) {
      throw new BadRequestException('Nenhum dado enviado.');
    }

    await this.auxiliaryBaseRepository.delete('baseOv');

    const uniqueWorks = this.extractUniqueWorks(data);
    const existingOvs =
      await this.findExistingWorksService.findExistingWorks(uniqueWorks);

    if (operation === 'insert') {
      const newData = this.filterNewData(data, existingOvs);

      if (newData.length === 0) {
        const existingWorksStr = existingOvs.map((ov) => ov.ovnota).join(', ');
        throw new BadRequestException(
          `Todas as obras já existem no banco de dados: ${existingWorksStr}`,
        );
      }

      await this.auxiliaryBaseRepository.insertMarket(newData);
    }

    if (operation === 'update') {
      const missingWorks = uniqueWorks.filter(
        (obra) => !existingOvs.some((ov) => ov.ovnota === obra),
      );

      if (missingWorks.length > 0) {
        throw new BadRequestException(
          `Não foi possível atualizar. Obras não encontradas: ${missingWorks.join(
            ', ',
          )}`,
        );
      }

      await this.auxiliaryBaseRepository.insertMarket(data);
    }
  }

  private extractUniqueWorks(data: InsertAuxiliaryMarketInput[]): string[] {
    return Array.from(new Set(data.map((item) => item.obra)));
  }

  private filterNewData(
    data: InsertAuxiliaryMarketInput[],
    existingOvs: { ovnota: string }[],
  ): InsertAuxiliaryMarketInput[] {
    const existingOvsSet = new Set(existingOvs.map((ov) => ov.ovnota));
    return data.filter((item) => !existingOvsSet.has(item.obra));
  }
}
