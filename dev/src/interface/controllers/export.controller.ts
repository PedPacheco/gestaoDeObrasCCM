import { Response } from 'express';
import { ExportCompletedWorksService } from 'src/application/services/export/exportCompletedWorks.service';
import { ExportScheduleService } from 'src/application/services/export/exportSchedule.service';
import { ExportWorksInPortfolioService } from 'src/application/services/export/exportWorksInPortfolio.service';
import { GetScheduleValuesDTO } from 'src/interface/dtos/scheduleDTO';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';

import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { ExportWorksInPortfolioBI } from 'src/application/services/export/BI/exportWorkInPortfolioBI.service';
import { ExportCompletedWorksBIService } from 'src/application/services/export/BI/exportCompletedWorksBI.service';
import { ExportSchedulesBIService } from 'src/application/services/export/BI/exportSchedulesBI.service';
import { ExportFinedWorksService } from 'src/application/services/export/exportFinedWorks.service';
import { ExportExecutionCapacityService } from 'src/application/services/export/exportExecutionCapacity.service';
import { ExportSuspensionsService } from 'src/application/services/export/exportSuspensions.service';
import { ExportExecutionReportService } from 'src/application/services/export/exportExecutionReport.service';
import { ExportForecastService } from 'src/application/services/export/exportForecast.service';
import { ExportRejectionsService } from 'src/application/services/export/exportRejections.service';
import { GetScheduleValuesService } from 'src/application/services/schedule/getScheduleValues.service';
import { GetWorksInPortfolioService } from 'src/application/services/works/getWorksInPortfolio.service';
import { GetCompletedWorksService } from 'src/application/services/works/getCompletedWorks.service';

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
    private exportWorksInPortfolioBIService: ExportWorksInPortfolioBI,
    private exportCompletedWorksBIService: ExportCompletedWorksBIService,
    private exportSchedulesBIService: ExportSchedulesBIService,
    private exportFinedWorksService: ExportFinedWorksService,
    private exportExecutionCapacityService: ExportExecutionCapacityService,
    private exportSuspensionsService: ExportSuspensionsService,
    private exportExecutionReportService: ExportExecutionReportService,
    private exportForecastService: ExportForecastService,
    private exportRejectionsService: ExportRejectionsService,
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

  @Get('obras-carteira-bi')
  @UseGuards(PermissionGuard)
  async exportWorksInPortfolioBI(@Res() res: Response) {
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Exportação obras em carteira"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    return await this.exportWorksInPortfolioBIService.export(res);
  }

  @Get('obras-executadas-bi')
  @UseGuards(PermissionGuard)
  async exportCompletedWorksBI(@Res() res: Response) {
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Exportação obras executadas"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    return await this.exportCompletedWorksBIService.export(res);
  }

  @Get('programacoes-bi')
  @UseGuards(PermissionGuard)
  async exportSchedulesBI(@Res() res: Response) {
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Exportação programações"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    return await this.exportSchedulesBIService.export(res);
  }

  @Get('obras-multas')
  @UseGuards(PermissionGuard)
  async exportFinedWorks(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Exportação a serem multadas"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    return await this.exportFinedWorksService.export(res, startDate, endDate);
  }

  @Get('capacidade-execucao')
  @UseGuards(PermissionGuard)
  async exportExecutionCapacity(@Res() res: Response) {
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Exportação capacidade de execução"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    return await this.exportExecutionCapacityService.export(res);
  }

  @Get('suspensoes')
  @UseGuards(PermissionGuard)
  async exportSuspensions(@Res() res: Response) {
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Exportação Suspensões"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    return await this.exportSuspensionsService.export(res);
  }

  @Get('relatorio-execucao')
  @UseGuards(PermissionGuard)
  async exportExecutonReport(@Res() res: Response) {
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Exportação Suspensões"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    return await this.exportExecutionReportService.export(res);
  }

  @Get('forecast')
  @UseGuards(PermissionGuard)
  async exportForecast(@Res() res: Response) {
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Exportação do Forecast"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    return await this.exportForecastService.export(res);
  }

  @Get('reprovacoes')
  @UseGuards(PermissionGuard)
  async exportRejections(@Res() res: Response) {
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="Exportação das reprovações"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    return await this.exportRejectionsService.export(res);
  }
}
