import { UpdateWorkDTO } from 'src/interface/dtos/worksDto';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  IUpdateWorkRepository,
  UPDATE_WORK_REPOSITORY,
} from 'src/domain/repositories/works/IUpdateWorkRepository';
import { Prisma } from '@prisma/client';

@Injectable()
export class UpdateWorkService {
  constructor(
    @Inject(UPDATE_WORK_REPOSITORY)
    private readonly updateWorkRepository: IUpdateWorkRepository,
  ) {}

  async update(data: UpdateWorkDTO, id: number, tx: Prisma.TransactionClient) {
    if (!data) {
      throw new BadRequestException(
        'Valores não inseridos para edição da obra.',
      );
    }

    if (data.observ_obra.trim() === '') {
      data.observ_obra = null;
    }

    await this.updateWorkRepository.update(data, id, tx);
  }
}
