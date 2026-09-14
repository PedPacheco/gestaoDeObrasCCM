import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  DELETE_SCHEDULES_REPOSITORY,
  IDeleteSchedulesRepository,
} from 'src/domain/contracts/schedule/IDeleteSchedulesRepository';

@Injectable()
export class DeleteSchedulesService {
  constructor(
    @Inject(DELETE_SCHEDULES_REPOSITORY)
    private readonly deleteSchedulesRepository: IDeleteSchedulesRepository,
  ) {}

  async delete(id: number) {
    if (!id) {
      throw new BadRequestException(
        'Nenhuma programação fornecida para exclusão.',
      );
    }

    await this.deleteSchedulesRepository.delete(id);
  }
}
