import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { FindExistingWorksService } from 'src/application/works/findExistingWorks.service';
import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from 'src/domain/repositories/IAuxiliaryBaseRepository';
import { InsertBaseAuxiliaryMarketDTO } from 'src/interface/dtos/auxiliaryBaseDTO';
import { OperationType } from 'src/interface/types/baseAuxiliaryInterface';

@Injectable()
export class AuxiliaryMarketInsertService {
  constructor(
    @Inject(AUXILIARY_BASE_REPOSITORY)
    private readonly auxiliaryBaseRepository: IAuxiliaryBaseRepository,
    private readonly findExistingWorksService: FindExistingWorksService,
  ) {}

  async execute(
    data: InsertBaseAuxiliaryMarketDTO[],
    operation: OperationType,
  ): Promise<void> {
    if (!data?.length) {
      throw new BadRequestException('Nenhum dado enviado.');
    }

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

  private extractUniqueWorks(data: InsertBaseAuxiliaryMarketDTO[]): string[] {
    return Array.from(new Set(data.map((item) => item.obra)));
  }

  private filterNewData(
    data: InsertBaseAuxiliaryMarketDTO[],
    existingOvs: any[],
  ): InsertBaseAuxiliaryMarketDTO[] {
    const existingOvsSet = new Set(existingOvs.map((ov) => ov.ovnota));
    return data.filter((item) => !existingOvsSet.has(item.obra));
  }
}
