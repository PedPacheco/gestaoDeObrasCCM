import { GoalsDTO } from 'src/config/dto/goalsDto';
import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { GoalsService } from './goals.service';
import { GoalsIntefaceController } from 'src/types/goalsInterface';

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
