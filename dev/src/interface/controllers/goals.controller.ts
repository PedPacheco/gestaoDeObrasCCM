import { GoalsService } from 'src/domain/services/goals.service';
import { GoalsDTO } from 'src/interface/dtos/goalsDto';
import { GoalsIntefaceController } from 'src/interface/types/goalsInterface';

import { Controller, Get, HttpStatus, Query } from '@nestjs/common';

@Controller('metas')
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  @Get()
  async getGoals(
    @Query()
    goalsFilter: GoalsDTO,
  ): Promise<GoalsIntefaceController> {
    const response = await this.goalsService.getGoals(goalsFilter);

    return {
      statusCode: HttpStatus.OK,
      message: 'Metas trazidas com sucesso',
      data: response,
    };
  }
}
