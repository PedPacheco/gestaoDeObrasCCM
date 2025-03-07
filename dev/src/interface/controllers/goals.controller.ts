import { GoalsService } from 'src/domain/services/services/goals.service';
import { RdaGoalsService } from 'src/domain/services/services/rdaGoals.service';
import { GoalsDTO, RdaGoalsDTO } from 'src/interface/dtos/goalsDto';
import { GoalsIntefaceController } from 'src/interface/types/goalsInterface';

import { Controller, Get, HttpStatus, Query } from '@nestjs/common';

@Controller('metas')
export class GoalsController {
  constructor(
    private goalsService: GoalsService,
    private rdaGoalsService: RdaGoalsService,
  ) {}

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

  @Get('rda')
  async getRdaGoals(@Query() filters: RdaGoalsDTO) {
    const response = await this.rdaGoalsService.get(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Metas RDA trazidas com sucesso',
      data: response,
    };
  }
}
