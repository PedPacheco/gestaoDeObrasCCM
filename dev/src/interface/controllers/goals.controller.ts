import { GoalsService } from 'src/application/usecases/goals.service';
import { GoalsDTO } from 'src/interface/dtos/goalsDto';
import { GoalsIntefaceController } from 'src/interface/types/goalsInterface';

import {
  Controller,
  Get,
  HttpStatus,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { AreaViewGuard } from 'src/core/guards/newPermission.guard';

@Controller('metas')
export class GoalsController {
  constructor(private goalsService: GoalsService) {}

  @Get()
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 2] }))
  async getGoals(
    @Query() filters: GoalsDTO,
    @Req() req: any,
  ): Promise<GoalsIntefaceController> {
    if (req.idParceira) {
      filters.parceira = req.idParceira;
    }

    const response = await this.goalsService.getGoals(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Metas trazidas com sucesso',
      data: response,
    };
  }
}
