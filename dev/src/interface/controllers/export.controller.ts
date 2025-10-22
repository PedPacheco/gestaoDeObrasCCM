import { Response } from 'express';
import { ExportCompletedWorksService } from 'src/application/export/exportCompletedWorks.service';
import { ExportScheduleService } from 'src/application/export/exportSchedule.service';
import { ExportWorksInPortfolioService } from 'src/application/export/exportWorksInPortfolio.service';
import { GetScheduleValuesService } from 'src/application/schedule/getScheduleValues.service';
import { GetCompletedWorksService } from 'src/application/works/getCompletedWorks.service';
import { GetWorksInPortfolioService } from 'src/application/works/getWorksInPortfolio.service';
import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';

import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';

interface CustomRequest extends Request {
  idParceira?: number;
  insufficientPermission?: boolean;
}

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

  private applyFilters<
    T extends {
      idParceira?: number | number[];
      insufficientPermission?: boolean;
    },
  >(filters: T, req: CustomRequest): T {
    if (req.idParceira) {
      filters.idParceira = req.idParceira;
    }
    if (req.insufficientPermission !== undefined) {
      filters.insufficientPermission = req.insufficientPermission;
    }
    return filters;
  }

  @Get('programacao')
  @UseGuards(VisualizationGuard)
  async exportSchedule(
    @Query() filters: GetScheduleValuesDTO,
    @Res() res: Response,
    @Req() req: any,
  ) {
    if (req.idParceira) {
      filters.idParceira = req.idParceira;
    }

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
  @UseGuards(VisualizationGuard)
  async exportWorksInPortfolio(
    @Query() workFilters: GetWorksDTO,
    @Res() res: Response,
    @Req() req: CustomRequest,
  ) {
    const filters = this.applyFilters(workFilters, req);
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
  @UseGuards(VisualizationGuard)
  async exportCompletedWorks(
    @Query() workFilters: GetWorksDTO,
    @Res() res: Response,
    @Req() req: CustomRequest,
  ) {
    const filters = this.applyFilters(workFilters, req);
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
