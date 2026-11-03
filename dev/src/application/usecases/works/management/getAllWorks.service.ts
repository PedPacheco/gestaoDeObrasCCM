import {
  GET_ALL_WORKS_REPOSITORY,
  IGetAllWorksRepository,
} from 'src/domain/contracts/works/IGetAllWorksRepository';
import { GetAllWorksDTO } from 'src/interface/dtos/worksDto';
import { getALlWorksResponseService } from 'src/interface/types/works/getAllWorks';

import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class GetAllWorksService {
  constructor(
    @Inject(GET_ALL_WORKS_REPOSITORY)
    private getAllWorksRepository: IGetAllWorksRepository,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getAllWorks(
    filters: GetAllWorksDTO,
  ): Promise<getALlWorksResponseService> {
    const cacheKey = `works-${JSON.stringify(filters)}`;

    const responseData: getALlWorksResponseService =
      await this.cacheManager.get(cacheKey);

    if (responseData) {
      return responseData;
    }

    const { works, total } =
      await this.getAllWorksRepository.getAllWorks(filters);

    const totalRecords = Number(total[0].total_obras);

    const response = {
      works,
      totalRecords,
    };

    await this.cacheManager.set(cacheKey, response, 1800000);

    return response;
  }
}
