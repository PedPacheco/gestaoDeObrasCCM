import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { FindExistingWorksService } from './findExistingWorks.service';
import {
  IUpdateOvRepository,
  UPDATE_OV_REPOSITORY,
} from 'src/domain/contracts/works/IUpdateOvRepository';
import { MarketWork } from 'src/domain/entities/works.entity';
import { UpdateMarketWorksInput } from 'src/application/types';

@Injectable()
export class UpdateOvService {
  constructor(
    @Inject(UPDATE_OV_REPOSITORY)
    private readonly updateOvRepository: IUpdateOvRepository,
    private readonly findExistingWorksService: FindExistingWorksService,
  ) {}

  async update(data: UpdateMarketWorksInput[]): Promise<void> {
    if (!data?.length) {
      throw new BadRequestException('Nenhum dado enviado.');
    }

    const uniquesWorks = Array.from(new Set(data.map((item) => item.obra)));

    const existingOvs =
      await this.findExistingWorksService.findExistingWorks(uniquesWorks);

    const ovMap = new Map(existingOvs.map((ov) => [ov.ovnota, ov.id]));

    const dataWithIds = data.reduce((acc, item) => {
      const id = ovMap.get(item.obra);
      if (id) {
        const work = MarketWork.create({ ...item, id }).toPrismaUpdate();
        acc.push(work);
      }
      return acc;
    }, []);

    await this.updateOvRepository.update(dataWithIds);
  }
}
