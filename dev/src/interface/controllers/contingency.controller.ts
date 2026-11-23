import { ContingencyService } from 'src/application/usecases/contingency.service';

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  CreateContingencyDTO,
  DashboardFilterDTO,
} from '../dtos/contingencyDTO';
import {
  AreaEditGuard,
  AreaViewGuard,
} from 'src/core/guards/newPermission.guard';

@Controller('recursos-contingencia')
export class ContingencyController {
  constructor(private readonly contingencyService: ContingencyService) {}

  @Post()
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  async create(@Body() data: CreateContingencyDTO): Promise<any> {
    await this.contingencyService.create(data);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Resposta registrada com sucesso',
    };
  }

  @Get('dashboard')
  @UseGuards(AreaViewGuard({ allowedAreas: [8] }))
  async getDashboard(@Query() query: DashboardFilterDTO): Promise<any> {
    const response = await this.contingencyService.getDashboard(query);

    return {
      statusCode: HttpStatus.OK,
      message: 'Dashboard de contingência retornado com sucesso',
      data: response,
    };
  }
}
