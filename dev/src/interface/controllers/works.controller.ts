import { PermissionGuard } from 'src/core/guards/permission.guard';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';

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
  Req,
  UseGuards,
} from '@nestjs/common';

import { InsertMarketWorksDTO, InsertNotesDTO } from '../dtos/auxiliaryBaseDTO';
import { GetWorksInPortfolioService } from 'src/application/works/getWorksInPortfolio.service';
import { GetAllWorksService } from 'src/application/works/getAllWorks.service';
import { GetCompletedWorksService } from 'src/application/works/getCompletedWorks.service';
import { GetWorkDetailsService } from 'src/application/works/getWorkDetails.service';
import { InsertWorksService } from 'src/application/works/InsertWorks.service';
import { HandleWorkUpdateService } from 'src/application/orchestrators/handleWorkUpdate.service';

@Controller('obras')
export class WorksController {
  constructor(
    private getWorksInPortfolioService: GetWorksInPortfolioService,
    private getAllWorksService: GetAllWorksService,
    private getCompletedWorksService: GetCompletedWorksService,
    private getWorkDetailsService: GetWorkDetailsService,
    private insertWorksService: InsertWorksService,
    private handleWorkUpdateService: HandleWorkUpdateService,
  ) {}

  @Get()
  @UseGuards(PermissionGuard)
  async getAllWorks(@Query() worksFilters: GetAllWorksDTO, @Req() req: any) {
    if (req.idRegional) {
      worksFilters.idRegional = req.idRegional;
    }

    if (req.insufficientPermission !== undefined) {
      worksFilters.insufficientPermission = req.insufficientPermission;
    }

    const response = await this.getAllWorksService.getAllWorks(worksFilters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Todas as obras retornadas com sucesso',
      data: response,
    };
  }

  @Get('obras-carteira')
  @UseGuards(VisualizationGuard)
  async getWorksInPortfolio(
    @Query() worksFilters: GetWorksDTO,
    @Req() req: any,
  ) {
    if (req.idRegional) {
      worksFilters.idRegional = req.idRegional;
    }

    if (req.insufficientPermission !== undefined) {
      worksFilters.insufficientPermission = req.insufficientPermission;
    }

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
  async GetCompletedWorks(@Query() worksFilters: GetWorksDTO, @Req() req: any) {
    if (req.idRegional) {
      worksFilters.idRegional = req.idRegional;
    }

    if (req.insufficientPermission !== undefined) {
      worksFilters.insufficientPermission = req.insufficientPermission;
    }

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
  @UseGuards(VisualizationGuard)
  async Update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateWorkDTO,
    @Req() req: any,
  ) {
    const insufficientPermission = req.insufficientPermission;

    await this.handleWorkUpdateService.update(data, id, insufficientPermission);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Obras atualizada com sucesso',
    };
  }
}
