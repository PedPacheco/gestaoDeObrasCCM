import { EntryService } from 'src/application/usecases/entry.service';
import {
  GetEntryOfWorksByDayDTO,
  GetEntryOfWorksDTO,
} from 'src/interface/dtos/entryDto';

import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';

@Controller('entrada')
export class EntryController {
  constructor(private entryService: EntryService) {}

  @Get()
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 2], blockPartner: true }))
  async getEntry(@Query() entryFilters: GetEntryOfWorksDTO) {
    const response = await this.entryService.getValuesFromEntry(entryFilters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores de entrada trazidos com sucesso',
      data: response,
    };
  }

  @Get('data')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 2], blockPartner: true }))
  async getEntryByDay(@Query() entryFilters: GetEntryOfWorksByDayDTO) {
    const response = await this.entryService.getEntryOfWorksByDay(entryFilters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores de entrada trazidos com sucesso',
      data: response,
    };
  }
}
