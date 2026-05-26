import { ErrorsReportService } from 'src/application/usecases/errorsReport.service';

import {
  Controller,
  Get,
  HttpStatus,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';

@Controller('relatorio-erros')
export class ErrorsReportController {
  constructor(private readonly errorsReportService: ErrorsReportService) {}

  @Get('itens-nao-definidos')
  @UseGuards(AreaViewGuard({ allowedAreas: [8], blockPartner: true }))
  async searchWorksWithUndefiendItens(
    @Query('idRegional', new ParseIntPipe({ optional: true }))
    idRegional?: number,
  ) {
    const response =
      await this.errorsReportService.findUndefinedItems(idRegional);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornadas obras com itens não definidos',
      data: response,
    };
  }

  @Get('programacao')
  @UseGuards(AreaViewGuard({ allowedAreas: [8], blockPartner: true }))
  async getWorksWithScheduleError(
    @Query('idRegional', new ParseIntPipe({ optional: true }))
    idRegional?: number,
  ) {
    const response =
      await this.errorsReportService.findScheduleError(idRegional);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornadas obras com erros na programção',
      data: response,
    };
  }

  @Get('valor-zero')
  @UseGuards(AreaViewGuard({ allowedAreas: [8], blockPartner: true }))
  async getWorksZeroCapex(
    @Query('idRegional', new ParseIntPipe({ optional: true }))
    idRegional?: number,
  ) {
    const response = await this.errorsReportService.findZeroCapex(idRegional);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornadas obras com valor zerado',
      data: response,
    };
  }

  @Get('diferenca-executado')
  @UseGuards(AreaViewGuard({ allowedAreas: [8], blockPartner: true }))
  async getExecutionDifferential(
    @Query('idRegional', new ParseIntPipe({ optional: true }))
    idRegional?: number,
  ) {
    const response =
      await this.errorsReportService.findExecutionDifferential(idRegional);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornadas obras com diferencial de execução',
      data: response,
    };
  }

  @Get('conclusao-divergente')
  @UseGuards(AreaViewGuard({ allowedAreas: [8], blockPartner: true }))
  async getDivergentConclusion(
    @Query('idRegional', new ParseIntPipe({ optional: true }))
    idRegional?: number,
  ) {
    const response =
      await this.errorsReportService.findDivergentConclusion(idRegional);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornadas obras com conclusão divergente',
      data: response,
    };
  }

  @Get('ano-plano')
  @UseGuards(AreaViewGuard({ allowedAreas: [8], blockPartner: true }))
  async getWorksWithoutYearPlan(
    @Query('idRegional', new ParseIntPipe({ optional: true }))
    idRegional?: number,
  ) {
    const response =
      await this.errorsReportService.findWorksWithoutYearPlan(idRegional);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornadas obras sem ano do plano',
      data: response,
    };
  }

  @Get('obras-repetidas')
  @UseGuards(AreaViewGuard({ allowedAreas: [8], blockPartner: true }))
  async getRepeatedWorks(
    @Query('idRegional', new ParseIntPipe({ optional: true }))
    idRegional?: number,
  ) {
    const response =
      await this.errorsReportService.findRepeatedWorks(idRegional);

    return {
      statusCode: HttpStatus.OK,
      message: 'Retornadas obras duplicadas',
      data: response,
    };
  }
}
