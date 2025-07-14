import {
  IUpdateWorkRepository,
  UPDATE_WORK_REPOSITORY,
} from 'src/domain/repositories/works/IUpdateWorkRepository';
import { UpdateWorkDTO } from 'src/interface/dtos/worksDto';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';

@Injectable()
export class UpdateWorkService {
  constructor(
    @Inject(UPDATE_WORK_REPOSITORY)
    private readonly updateWorkRepository: IUpdateWorkRepository,
  ) {}

  async update(data: UpdateWorkDTO, id: number) {
    if (!data) {
      throw new BadRequestException(
        'Valores não inseridos para edição da obra.',
      );
    }

    await this.updateWorkRepository.update(data, id);
  }
}
