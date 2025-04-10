import { Response } from 'express';
import { ExportCompletedWorksService } from 'src/domain/services/export/exportCompletedWorks.service';
import { ExportScheduleService } from 'src/domain/services/export/exportSchedule.service';
import { ExportWorksInPortfolioService } from 'src/domain/services/export/exportWorksInPortfolio.service';
import { GetScheduleValuesService } from 'src/domain/services/schedule/getScheduleValues.service';
import { GetCompletedWorksService } from 'src/domain/services/works/getCompletedWorks.service';
import { GetWorksInPortfolioService } from 'src/domain/services/works/getWorksInPortfolio.service';
import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';

import { Controller, Get, Query, Res } from '@nestjs/common';

@Controller('exportacao')
export class ExportController {
  constructor(
    private getScheduleValuesService: GetScheduleValuesService,
    private exportScheduleService: ExportScheduleService,
    private getWorksInPortfolioService: GetWorksInPortfolioService,
    private exportWorksInPortfolioService: ExportWorksInPortfolioService,
    private getCompletedWorksService: GetCompletedWorksService,
    private exportCompletedWorksService: ExportCompletedWorksService,
  ) {}

  @Get('programacao')
  async exportSchedule(
    @Query() filters: GetScheduleValuesDTO,
    @Res() res: Response,
  ) {
    const { works } = await this.getScheduleValuesService.getValues(filters);

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Exportação Programação"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    return await this.exportScheduleService.export(works, res);
  }

  @Get('obras-carteira')
  async exportWorksInPortfolio(
    @Query() filters: GetWorksDTO,
    @Res() res: Response,
  ) {
    const worksData =
      await this.getWorksInPortfolioService.getWorksInPortfolio(filters);

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Exportação obras em carteira"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    return await this.exportWorksInPortfolioService.export(worksData, res);
  }

  @Get('obras-executadas')
  async exportCompletedWorks(
    @Query() filters: GetWorksDTO,
    @Res() res: Response,
  ) {
    const worksData =
      await this.getCompletedWorksService.getCompletedWorks(filters);

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Exportação obras executadas"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    return await this.exportCompletedWorksService.export(worksData, res);
  }
}
