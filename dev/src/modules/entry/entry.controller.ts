import { Controller, Get, HttpStatus, Query } from '@nestjs/common';
import {
  GetEntryOfWorksByDayDTO,
  GetEntryOfWorksDTO,
} from 'src/config/dto/entryDto';
import { EntryService } from './entry.service';

@Controller('entrada')
export class EntryController {
  constructor(private entryService: EntryService) {}

  @Get()
  async getEntry(@Query() entryFilters: GetEntryOfWorksDTO) {
    const response = await this.entryService.getValuesFromEntry(entryFilters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores de entrada trazidos com sucesso',
      data: response,
    };
  }

  @Get('data')
  async getEntryByDay(@Query() entryFilters: GetEntryOfWorksByDayDTO) {
    const response = await this.entryService.getEntryOfWorksByDay(entryFilters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Valores de entrada trazidos com sucesso',
      data: response,
    };
  }
}
