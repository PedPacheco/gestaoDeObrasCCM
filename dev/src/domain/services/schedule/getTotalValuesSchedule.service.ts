import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetTotalValuesScheduleDTO } from 'src/interface/dtos/scheduleDTO';

import { Inject, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  GET_TOTAL_SCHEDULE_VALUES_REPOSITORY,
  IGetTotalScheduleValuesRepository,
} from 'src/domain/repositories/schedule/IGetTotalValuesScheduleRepository';

@Injectable()
export class GetTotalValuesScheduleService {
  constructor(
    @Inject(GET_TOTAL_SCHEDULE_VALUES_REPOSITORY)
    private readonly getTotalScheduleValuesRepository: IGetTotalScheduleValuesRepository,
  ) {}

  async getTotalValues(filters: GetTotalValuesScheduleDTO) {
    const response =
      await this.getTotalScheduleValuesRepository.getTotalValues(filters);

    const months = [
      'jan',
      'fev',
      'mar',
      'abr',
      'mai',
      'jun',
      'jul',
      'ago',
      'set',
      'out',
      'nov',
      'dez',
      'total',
    ];

    const sum = response.reduce((acc, result) => {
      const turma = result.turma;

      const turmaObj = {
        turma,
      };

      months.forEach((month) => {
        turmaObj[month] = {
          prog: result[`${month}_prog`] || 0,
          exec: result[`${month}_exec`] || 0,
        };
      });

      acc.push(turmaObj);
      return acc;
    }, []);

    return sum;
  }
}
