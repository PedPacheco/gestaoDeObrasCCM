import { Controller, Get, Query } from '@nestjs/common';
import { FiltersService } from './filters.service';
import { FiltersDto } from 'src/config/dto/filtersDto';

@Controller('filters')
export class FiltersController {
  constructor(private filtersService: FiltersService) {}

  @Get()
  async getFilters(@Query() query: FiltersDto): Promise<any> {
    const { parceira, regional, tipo, circuito, grupo, municipio, status } =
      query;

    const filters = await this.filtersService.getFilters({
      regional,
      parceira,
      tipo,
      circuito,
      grupo,
      municipio,
      status,
    });

    return filters;
  }
}
