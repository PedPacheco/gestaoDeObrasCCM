import { EntryService } from 'src/application/services/entry.service';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import {
  GetEntryOfWorksByDayDTO,
  GetEntryOfWorksDTO,
} from 'src/interface/dtos/entryDto';

import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';

@Controller('entrada')
export class EntryController {
  constructor(private entryService: EntryService) {}

  @Get()
  @UseGuards(PermissionGuard)
  async getEntry(@Query() entryFilters: GetEntryOfWorksDTO) {
    const response = await this.entryService.getValuesFromEntry(entryFilters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores de entrada trazidos com sucesso',
      data: response,
    };
  }

  @Get('data')
  @UseGuards(PermissionGuard)
  async getEntryByDay(@Query() entryFilters: GetEntryOfWorksByDayDTO) {
    const response = await this.entryService.getEntryOfWorksByDay(entryFilters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores de entrada trazidos com sucesso',
      data: response,
    };
  }
}
