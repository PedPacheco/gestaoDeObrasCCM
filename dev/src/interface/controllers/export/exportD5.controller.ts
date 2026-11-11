import { Response } from 'express';

import { AreaViewGuard } from 'src/core/guards/newPermission.guard';

import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';

import {
  applyPartnerFilters,
  ExportRequest,
  setXlsxHeaders,
} from './export.helpers';
import { FindD5NotesService } from 'src/application/usecases/d5Notes/notes/findD5Notes.service';
import { D5NotesFiltersDTO } from 'src/interface/dtos/d5NotesDTO';
import { ExportD5NotesService } from 'src/application/usecases/export/exportD5Notes.service';

@Controller('exportacao')
export class ExportD5NotesController {
  constructor(
    private readonly findD5NotesService: FindD5NotesService,
    private readonly exportD5NotesService: ExportD5NotesService,
  ) {}

  @Get('notas-d5')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async exportD5Notes(
    @Query() workFilters: D5NotesFiltersDTO,
    @Res() res: Response,
    @Req() req: ExportRequest,
  ) {
    const filters = applyPartnerFilters(workFilters, req);
    const worksData = await this.findD5NotesService.get(filters);

    setXlsxHeaders(res, 'Exportação Notas D5');
    return this.exportD5NotesService.export(worksData, res);
  }
}
