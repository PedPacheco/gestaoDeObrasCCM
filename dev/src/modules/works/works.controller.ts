import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import { GetAllWorksDTO } from 'src/config/dto/worksDto';
import { WorksService } from './works.service';

@Controller('obras')
export class WorksController {
  constructor(private worksService: WorksService) {}

  @Get()
  async getAllWorks(@Query() worksFilters: GetAllWorksDTO) {
    const response = await this.worksService.getAllWorks(worksFilters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Todas as obras retornadas com sucesso',
      data: response,
    };
  }

  @Get('obras-carteira')
  async getWorksInPortfolio(@Query() worksFilters: GetAllWorksDTO) {
    const response = await this.worksService.getWorksInPortfolio(worksFilters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Obras em carteira retornadas com sucesso',
      data: response,
    };
  }
}
