import { Response } from 'express';

import { AreaViewGuard } from 'src/core/guards/newPermission.guard';

import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';

import { ContingencyService } from 'src/application/usecases/contingency.service';
import { ExportContingencyService } from 'src/application/usecases/export/exportContingency.service';
import { DashboardFilterDTO } from 'src/interface/dtos/contingencyDTO';
import {
  applyPartnerFilters,
  ExportRequest,
  setXlsxHeaders,
} from './export.helpers';

@Controller('exportacao')
export class ExportContingencyController {
  constructor(
    private readonly contingencyService: ContingencyService,
    private readonly exportContingencyService: ExportContingencyService,
  ) {}

  @Get('contingencia')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async exportContingency(
    @Query() workFilters: DashboardFilterDTO,
    @Res() res: Response,
    @Req() req: ExportRequest,
  ) {
    const filters = applyPartnerFilters(workFilters, req);
    const response =
      await this.contingencyService.findContingencyResourceDispatches(filters);

    setXlsxHeaders(res, 'Exportação Recursos Contingência');
    return this.exportContingencyService.export(response, res);
  }
}
