import { Response } from 'express';
import { Controller, Get, Res, UseGuards } from '@nestjs/common';

import { AreaViewGuard } from 'src/core/guards/newPermission.guard';

import { ExportWorksInPortfolioBI } from 'src/application/usecases/export/BI/exportWorkInPortfolioBI.service';
import { ExportCompletedWorksBIService } from 'src/application/usecases/export/BI/exportCompletedWorksBI.service';
import { ExportSchedulesBIService } from 'src/application/usecases/export/BI/exportSchedulesBI.service';

import { setXlsxHeaders } from './export.helpers';

@Controller('exportacao')
@UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
export class ExportBIController {
  constructor(
    private readonly exportWorksInPortfolioBIService: ExportWorksInPortfolioBI,
    private readonly exportCompletedWorksBIService: ExportCompletedWorksBIService,
    private readonly exportSchedulesBIService: ExportSchedulesBIService,
  ) {}

  @Get('obras-carteira-bi')
  async exportWorksInPortfolioBI(@Res() res: Response) {
    setXlsxHeaders(res, 'Exportação obras em carteira');
    return this.exportWorksInPortfolioBIService.export(res);
  }

  @Get('obras-executadas-bi')
  async exportCompletedWorksBI(@Res() res: Response) {
    setXlsxHeaders(res, 'Exportação obras executadas');
    return this.exportCompletedWorksBIService.export(res);
  }

  @Get('programacoes-bi')
  async exportSchedulesBI(@Res() res: Response) {
    setXlsxHeaders(res, 'Exportação programações');
    return this.exportSchedulesBIService.export(res);
  }
}
