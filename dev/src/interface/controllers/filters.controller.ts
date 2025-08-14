import { Request } from 'express';
import { FiltersService } from 'src/application/filters.service';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import { FiltersDto } from 'src/interface/dtos/filtersDto';

import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';

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
