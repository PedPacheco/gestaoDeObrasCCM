import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';
import { FindD5NotesService } from 'src/application/usecases/d5Notes/notes/findD5Notes.service';
import { CreateProgramacaoD5Dto, D5NotesFiltersDTO } from '../dtos/d5NotesDTO';
import { FindD5NoteByIdService } from 'src/application/usecases/d5Notes/notes/findD5NotesById.service';
import { FindD5SchedulesService } from 'src/application/usecases/d5Notes/schedules/findD5SchedulesById.service';
import { CreateD5NoteScheduleService } from 'src/application/usecases/d5Notes/schedules/createD5NoteSchedule.service';

@Controller('notas-d5')
export class D5NotesController {
  constructor(
    private findD5NotesService: FindD5NotesService,
    private findD5NoteByIdService: FindD5NoteByIdService,
    private findD5NotesSchedules: FindD5SchedulesService,
    private createD5NoteScheduleService: CreateD5NoteScheduleService,
  ) {}

  @Get()
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getAll(@Query() filters: D5NotesFiltersDTO) {
    const response = await this.findD5NotesService.get(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Notas D5 retornadas com sucesso',
      data: response,
    };
  }

  @Get(':id')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getById(@Param('id', ParseIntPipe) id: number) {
    const response = await this.findD5NoteByIdService.getById(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Detalhes da nota D5 retornado com sucesso',
      data: response,
    };
  }

  @Get('/programacoes/:id')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getSchedulesByD5NoteId(@Param('id', ParseIntPipe) id: number) {
    const response = await this.findD5NotesSchedules.findByD5NoteId(id);
    return {
      statusCode: HttpStatus.OK,
      message: 'Programações da Nota D5 retornado com sucesso',
      data: response,
    };
  }

  @Post('/programacoes')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async createD5NoteSchedule(@Body() data: CreateProgramacaoD5Dto) {
    const response = await this.createD5NoteScheduleService.create(data);
    return {
      statusCode: HttpStatus.OK,
      message: 'Programações da Nota D5 retornado com sucesso',
      data: response,
    };
  }
}
