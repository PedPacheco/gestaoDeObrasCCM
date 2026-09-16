import {
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';
import { D5NotesService } from 'src/application/usecases/d5Notes.service';
import { D5NotesFiltersDTO } from '../dtos/d5NotesDTO';

@Controller('notas-d5')
export class D5NotesController {
  constructor(private d5NotesService: D5NotesService) {}

  @Get()
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getAll(@Query() filters: D5NotesFiltersDTO) {
    const response = await this.d5NotesService.get(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Notas D5 retornadas com sucesso',
      data: response,
    };
  }

  @Get(':id')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getById(@Param('id', ParseIntPipe) id: number) {
    const response = await this.d5NotesService.getById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Detalhes da nota D5 retornado com sucesso',
      data: response,
    };
  }
}
