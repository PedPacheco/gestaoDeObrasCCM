import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { FiltersService } from './filters.service';
import { FiltersDto } from 'src/config/dto/filtersDto';
import { VisualizationGuard } from 'src/common/guards/visualization.guard';
import { Request } from 'express';

@Controller('filters')
export class FiltersController {
  constructor(private filtersService: FiltersService) {}

  @Get()
  @UseGuards(VisualizationGuard)
  async getFilters(
    @Query() query: FiltersDto,
    @Req() req: Request,
  ): Promise<any> {
    const filters = await this.filtersService.getFilters(
      query,
      req.query.idRegional,
    );

    return filters;
  }
}
