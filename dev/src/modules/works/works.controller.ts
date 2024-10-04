import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { GetAllWorksDTO, GetWorksDTO } from 'src/config/dto/worksDto';
import { GetCompletedWorksService } from './services/getCompletedWorks.service';
import { GetAllWorksService } from './services/getAllWorks.service';
import { GetWorksInPortfolioService } from './services/getWorksInPortfolio.service';

@Controller('obras')
export class WorksController {
  constructor(
    private getWorksInPortfolioService: GetWorksInPortfolioService,
    private getAllWorksService: GetAllWorksService,
    private getCompletedWorksService: GetCompletedWorksService,
  ) {}

  @Get()
  async getAllWorks(@Query() worksFilters: GetAllWorksDTO) {
    const response = await this.getAllWorksService.getAllWorks(worksFilters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Todas as obras retornadas com sucesso',
      data: response,
    };
  }

  @Get('obras-carteira')
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
  async GetCompletedWorks(@Query() worksFilters: GetWorksDTO) {
    const response =
      await this.getCompletedWorksService.getCompletedWorks(worksFilters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Obras em executadas retornadas com sucesso',
      data: response,
    };
  }
}
