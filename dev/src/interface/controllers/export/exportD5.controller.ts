import { Response } from 'express';

import { AreaViewGuard } from 'src/core/guards/newPermission.guard';

import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';

import { FindD5NotesService } from 'src/application/usecases/d5Notes/notes/findD5Notes.service';
import { FindD5SchedulesService } from 'src/application/usecases/d5Notes/schedules/findD5Schedules.service';
import { ExportD5NotesService } from 'src/application/usecases/export/exportD5Notes.service';
import { ExportD5NotesSchedulesService } from 'src/application/usecases/export/exportD5NotesSchedules.service';
import {
  D5NotesFiltersDTO,
  D5NotesSchedulesFiltersDTO,
} from 'src/interface/dtos/d5NotesDTO';
import {
  applyPartnerFilters,
  ExportRequest,
  setXlsxHeaders,
} from './export.helpers';

@Controller('exportacao')
export class ExportD5NotesController {
  constructor(
    private readonly findD5NotesService: FindD5NotesService,
    private readonly findD5NotesSchedules: FindD5SchedulesService,
    private readonly exportD5NotesService: ExportD5NotesService,
    private readonly exportD5NotesSchedules: ExportD5NotesSchedulesService,
  ) {}

  @Get('notas-d5')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async exportD5Notes(
    @Query() workFilters: D5NotesFiltersDTO,
    @Res() res: Response,
    @Req() req: ExportRequest,
  ) {
    const filters = applyPartnerFilters(workFilters, req);
    const response = await this.findD5NotesService.get(filters);

    setXlsxHeaders(res, 'Exportação Notas D5');
    return this.exportD5NotesService.export(response, res);
  }

  @Get('programacao/notas-d5')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async exportD5Schedules(
    @Query() workFilters: D5NotesSchedulesFiltersDTO,
    @Res() res: Response,
    @Req() req: ExportRequest,
  ) {
    const filters = applyPartnerFilters(workFilters, req);
    const response =
      await this.findD5NotesSchedules.findD5NotesSchedules(filters);

    setXlsxHeaders(res, 'Exportação Programações Notas D5');
    return this.exportD5NotesSchedules.export(response, res);
  }
}
