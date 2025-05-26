import { PermissionGuard } from 'src/core/guards/permission.guard';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import { GetAllWorksService } from 'src/domain/services/works/getAllWorks.service';
import { GetCompletedWorksService } from 'src/domain/services/works/getCompletedWorks.service';
import { GetWorkDetailsService } from 'src/domain/services/works/getWorkDetails.service';
import { GetWorksInPortfolioService } from 'src/domain/services/works/getWorksInPortfolio.service';
import { InsertMarketWorksService } from 'src/domain/services/works/InsertMarketWorks.service';
import { GetAllWorksDTO, GetWorksDTO } from 'src/interface/dtos/worksDto';

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { InsertMarketWorksDTO } from '../dtos/entryDto';

@Controller('obras')
export class WorksController {
  constructor(
    private getWorksInPortfolioService: GetWorksInPortfolioService,
    private getAllWorksService: GetAllWorksService,
    private getCompletedWorksService: GetCompletedWorksService,
    private getWorkDetailsService: GetWorkDetailsService,
    private insertMarketWorksService: InsertMarketWorksService,
  ) {}

  @Get()
  @UseGuards(PermissionGuard)
  async getAllWorks(@Query() worksFilters: GetAllWorksDTO) {
    const response = await this.getAllWorksService.getAllWorks(worksFilters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Todas as obras retornadas com sucesso',
      data: response,
    };
  }

  @Get('obras-carteira')
  @UseGuards(VisualizationGuard)
  async getWorksInPortfolio(@Query() worksFilters: GetWorksDTO) {
    const response =
      await this.getWorksInPortfolioService.getWorksInPortfolio(worksFilters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Obras em carteira retornadas com sucesso',
      data: response,
    };
  }

  @Get('obras-executadas')
  @UseGuards(VisualizationGuard)
  async GetCompletedWorks(@Query() worksFilters: GetWorksDTO) {
    const response =
      await this.getCompletedWorksService.getCompletedWorks(worksFilters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Obras em executadas retornadas com sucesso',
      data: response,
    };
  }

  @Get(':id')
  async getWorkDetails(@Param('id', ParseIntPipe) id: number) {
    const response = await this.getWorkDetailsService.get(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornado os detalhes da obra',
      data: response,
    };
  }

  @Post('inserir-ov')
  @UseGuards(PermissionGuard)
  async InsertMarketWorks(
    @Body() marketWorksParameters: InsertMarketWorksDTO[],
  ) {
    const response = await this.insertMarketWorksService.insertMany(
      marketWorksParameters,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Obra de mercado inserida com sucesso',
      data: response,
    };
  }
}
