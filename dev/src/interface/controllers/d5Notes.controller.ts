import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { FindD5NotesService } from 'src/application/usecases/d5Notes/notes/findD5Notes.service';
import { ManageD5NoteService } from 'src/application/usecases/d5Notes/notes/manageD5Note.service';
import { FindD5SchedulesService } from 'src/application/usecases/d5Notes/schedules/findD5Schedules.service';
import { ManageD5NoteScheduleService } from 'src/application/usecases/d5Notes/schedules/manageD5NoteSchedule.service';
import {
  AreaEditGuard,
  AreaViewGuard,
} from 'src/core/guards/newPermission.guard';
import {
  CreateProgramacaoD5Dto,
  D5NotesFiltersDTO,
  D5NotesSchedulesFiltersDTO,
  RejectD5ScheduleDTO,
  UpdateD5NoteDTO,
  UpdateScheduleD5Dto,
} from '../dtos/d5NotesDTO';

interface CustomRequest extends Request {
  idParceira?: number;
  user: any;
}

@Controller('notas-d5')
export class D5NotesController {
  constructor(
    private findD5NotesService: FindD5NotesService,
    private findD5NotesSchedules: FindD5SchedulesService,
    private manageD5NoteScheduleService: ManageD5NoteScheduleService,
    private manageD5NoteService: ManageD5NoteService,
  ) {}

  private applyFilters<T extends { idParceira?: number | number[] }>(
    filters: T,
    req: CustomRequest,
  ): T {
    if (req.user.tipo_usuario === 'PARCEIRA') {
      return { ...filters, idParceira: req.idParceira };
    }

    return filters;
  }

  @Get()
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getAll(
    @Query() d5NoteFilters: D5NotesFiltersDTO,
    @Req() req: CustomRequest,
  ) {
    const filters = this.applyFilters(d5NoteFilters, req);
    const response = await this.findD5NotesService.get(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Notas D5 retornadas com sucesso',
      data: response,
    };
  }

  @Get('/programacoes')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getSchedules(
    @Query() d5NoteFilters: D5NotesSchedulesFiltersDTO,
    @Req() req: CustomRequest,
  ) {
    const filters = this.applyFilters(d5NoteFilters, req);

    const response =
      await this.findD5NotesSchedules.findD5NotesSchedules(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Programações da Nota D5 retornado com sucesso',
      data: response,
    };
  }

  @Get('/reprovacoes/:id')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getRejections(@Param('id', ParseIntPipe) id: number) {
    const response = await this.findD5NotesSchedules.findRejectionsByD5Note(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Reprovações da nota D5 retornadas com sucesso',
      data: response,
    };
  }

  @Get(':id')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getById(@Param('id', ParseIntPipe) id: number) {
    const response = await this.findD5NotesService.getById(id);

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
  @UseGuards(AreaEditGuard({ allowedAreas: [8, 1] }))
  async createD5NoteSchedule(@Body() data: CreateProgramacaoD5Dto) {
    await this.manageD5NoteScheduleService.create(data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Programação para Nota D5 criada com sucesso',
    };
  }

  @Patch(':id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async updateD5Notes(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateD5NoteDTO,
    @Req() req: any,
  ) {
    await this.manageD5NoteService.update(id, data, req.user.sub);

    return {
      statusCode: HttpStatus.OK,
      message: 'Nota D5 atualizada com sucesso',
    };
  }

  @Put('/programacoes/:id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  @UseInterceptors(FilesInterceptor('files', 5))
  async updateD5NotesSchedule(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() data: UpdateScheduleD5Dto,
    @Req() req: any,
  ) {
    await this.manageD5NoteScheduleService.update(
      id,
      data,
      files,
      req.user.sub,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Programação atualizada com sucesso',
    };
  }

  @Delete('/programacoes/:id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async deleteSchedule(@Param('id', ParseIntPipe) id: number) {
    await this.manageD5NoteScheduleService.delete(id);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Relatório excluído com sucesso',
    };
  }

  @Patch('/reprovar/:id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async rejectD5Schedules(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: RejectD5ScheduleDTO[],
    @Req() req: any,
  ) {
    await this.manageD5NoteScheduleService.reject(id, data, req.user.sub);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Programação reprovada com sucesso',
    };
  }
}
