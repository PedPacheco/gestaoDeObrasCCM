import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { FiltersService } from './filters.service';
import { FiltersDto } from 'src/config/dto/filtersDto';
import { PermissionGuard } from 'src/common/guards/permission.guard';

@Controller('filters')
export class FiltersController {
  constructor(private filtersService: FiltersService) {}

  @Get()
  @UseGuards(PermissionGuard)
  async getFilters(@Query() query: FiltersDto, @Req() req): Promise<any> {
    const filters = await this.filtersService.getFilters(
      query,
      req.query.idRegional,
    );

    return filters;
  }
}
