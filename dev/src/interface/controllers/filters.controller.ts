import { Request } from 'express';
import { FiltersService } from 'src/application/usecases/filters.service';
import { FiltersDto } from 'src/interface/dtos/filtersDto';

import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';

@Controller('filters')
export class FiltersController {
  constructor(private filtersService: FiltersService) {}

  @Get()
  @UseGuards(AreaViewGuard())
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
