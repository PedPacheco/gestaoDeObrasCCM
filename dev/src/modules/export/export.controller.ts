import { Controller, Get, Query, Res } from '@nestjs/common';
import { GetScheduleValuesService } from '../schedule/services/getScheduleValues.service';
import { GetScheduleValuesDTO } from 'src/config/dto/scheduleDTO';
import { Response } from 'express';
import { ExportScheduleService } from './services/exportSchedule.service';
import { GetWorksDTO } from 'src/config/dto/worksDto';
import { GetWorksInPortfolioService } from '../works/services/getWorksInPortfolio.service';
import { ExportWorksInPortfolioService } from './services/exportWorksInPortfolio.service';
import { GetCompletedWorksService } from '../works/services/getCompletedWorks.service';
import { ExportCompletedWorksService } from './services/exportCompletedWorks.service';

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
