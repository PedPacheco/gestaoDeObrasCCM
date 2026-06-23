import { ContingencyService } from 'src/application/usecases/contingency.service';

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import {
  CreateContingencyDTO,
  DashboardFilterDTO,
} from '../dtos/contingencyDTO';

@Controller('recursos-contingencia')
export class ContingencyController {
  constructor(private readonly contingencyService: ContingencyService) {}

  @Post()
  async create(
    @Req() req: any,
    @Body() data: CreateContingencyDTO,
  ): Promise<any> {
    const { id: idUser } = req.user;

    await this.contingencyService.create(data, idUser);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Resposta registrada com sucesso',
    };
  }

  @Get('dashboard')
  async getDashboard(@Query() query: DashboardFilterDTO): Promise<any> {
    const response = await this.contingencyService.getDashboard(query);

    return {
      statusCode: HttpStatus.OK,
      message: 'Dashboard de contingência retornado com sucesso',
      data: response,
    };
  }
}
