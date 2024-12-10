import { Controller, Get, Query, Res } from '@nestjs/common';
import { GetScheduleValuesService } from '../schedule/services/getScheduleValues.service';
import { GetScheduleValuesDTO } from 'src/config/dto/scheduleDTO';
import { Response } from 'express';
import { ExportScheduleService } from './services/exportSchedule.service';
import { GetWorksDTO } from 'src/config/dto/worksDto';
import { GetWorksInPortfolioService } from '../works/services/getWorksInPortfolio.service';
import { exportWorksInPortfolioService } from './services/exportWorksInPortfolio.service';

@Controller('exportacao')
export class ExportController {
  constructor(
    private getScheduleValuesService: GetScheduleValuesService,
    private exportScheduleService: ExportScheduleService,
    private getWorksInPortfolioService: GetWorksInPortfolioService,
    private exportWorksInPortfolioService: exportWorksInPortfolioService,
  ) {}

  @Get('programacao')
  async exportSchedule(
    @Query() filters: GetScheduleValuesDTO,
    @Res() res: Response,
  ) {
    const scheduleData = await this.getScheduleValuesService.getValues(filters);

    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Exportação Programação"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    return await this.exportScheduleService.export(scheduleData, res);
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
}
