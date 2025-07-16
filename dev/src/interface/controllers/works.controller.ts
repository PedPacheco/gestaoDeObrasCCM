import { PermissionGuard } from 'src/core/guards/permission.guard';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import { GetAllWorksService } from 'src/domain/services/works/getAllWorks.service';
import { GetCompletedWorksService } from 'src/domain/services/works/getCompletedWorks.service';
import { GetWorkDetailsService } from 'src/domain/services/works/getWorkDetails.service';
import { GetWorksInPortfolioService } from 'src/domain/services/works/getWorksInPortfolio.service';
import { InsertWorksService } from 'src/domain/services/works/InsertWorks.service';
import { UpdateWorkService } from 'src/domain/services/works/updateWork.service';
import {
  GetAllWorksDTO,
  GetWorksDTO,
  UpdateWorkDTO,
} from 'src/interface/dtos/worksDto';

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { InsertMarketWorksDTO, InsertNotesDTO } from '../dtos/auxiliaryBaseDTO';

@Controller('obras')
export class WorksController {
  constructor(
    private getWorksInPortfolioService: GetWorksInPortfolioService,
    private getAllWorksService: GetAllWorksService,
    private getCompletedWorksService: GetCompletedWorksService,
    private getWorkDetailsService: GetWorkDetailsService,
    private insertWorksService: InsertWorksService,
    private updateWorkService: UpdateWorkService,
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
    const { insertedCount, message, skipped } =
      await this.insertWorksService.insertMarketWorks(marketWorksParameters);

    return {
      statusCode: HttpStatus.OK,
      message,
      insertedCount,
      skipped,
    };
  }

  @Post('inserir-notas')
  @UseGuards(PermissionGuard)
  async InsertNotes(@Body() data: InsertNotesDTO[]) {
    await this.insertWorksService.insertNotes(data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Notas inseridas com sucesso',
    };
  }

  @Patch(':id')
  @UseGuards(PermissionGuard)
  async Update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateWorkDTO,
  ) {
    await this.updateWorkService.update(data, id);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Obras atualizada com sucesso',
    };
  }
}
