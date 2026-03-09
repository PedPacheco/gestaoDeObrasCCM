import { Response } from 'express';
import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';

// Guards
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';

// DTOs
import {
  GetMonthlySummaryDTO,
  GetScheduleValuesDTO,
} from 'src/interface/dtos/scheduleDTO';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';

// Services - Schedule
import { GetScheduleValuesService } from 'src/application/services/schedule/getScheduleValues.service';
import { GetMonthlySummaryService } from 'src/application/services/schedule/getMonthlySummary.service';
import { GetMonthlySummaryForecastService } from 'src/application/services/schedule/getMonthlySummaryForecast.service';

// Services - Works
import { GetWorksInPortfolioService } from 'src/application/services/works/getWorksInPortfolio.service';
import { GetCompletedWorksService } from 'src/application/services/works/getCompletedWorks.service';

// Services - Export (Standard)
import { ExportScheduleService } from 'src/application/services/export/exportSchedule.service';
import { ExportWorksInPortfolioService } from 'src/application/services/export/exportWorksInPortfolio.service';
import { ExportCompletedWorksService } from 'src/application/services/export/exportCompletedWorks.service';
import { ExportFinedWorksService } from 'src/application/services/export/exportFinedWorks.service';
import { ExportExecutionCapacityService } from 'src/application/services/export/exportExecutionCapacity.service';
import { ExportSuspensionsService } from 'src/application/services/export/exportSuspensions.service';
import { ExportExecutionReportService } from 'src/application/services/export/exportExecutionReport.service';
import { ExportForecastService } from 'src/application/services/export/exportForecast.service';
import { ExportRejectionsService } from 'src/application/services/export/exportRejections.service';
import { ExportMonthlyMOSummaryService } from 'src/application/services/export/exportMonthlySummary.service';
import { ExportMonthlyForecastSummaryService } from 'src/application/services/export/exportMonthlyForecastSummary.service';

// Services - Export (BI)
import { ExportWorksInPortfolioBI } from 'src/application/services/export/BI/exportWorkInPortfolioBI.service';
import { ExportCompletedWorksBIService } from 'src/application/services/export/BI/exportCompletedWorksBI.service';
import { ExportSchedulesBIService } from 'src/application/services/export/BI/exportSchedulesBI.service';

interface CustomRequest extends Request {
  idParceira?: number;
  insufficientPermission?: boolean;
}

type FiltersWithPermission = {
  idParceira?: number | number[];
  insufficientPermission?: boolean;
};

const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Controller('exportacao')
export class ExportController {
  constructor(
    // Schedule
    private readonly getScheduleValuesService: GetScheduleValuesService,
    private readonly monthlyMOSummary: GetMonthlySummaryService,
    private readonly monthlyForecastSummary: GetMonthlySummaryForecastService,

    // Works
    private readonly getWorksInPortfolioService: GetWorksInPortfolioService,
    private readonly getCompletedWorksService: GetCompletedWorksService,

    // Export - Standard
    private readonly exportScheduleService: ExportScheduleService,
    private readonly exportWorksInPortfolioService: ExportWorksInPortfolioService,
    private readonly exportCompletedWorksService: ExportCompletedWorksService,
    private readonly exportMonthlyMOSummaryService: ExportMonthlyMOSummaryService,
    private readonly exportMonthlyForecastSummaryService: ExportMonthlyForecastSummaryService,
    private readonly exportFinedWorksService: ExportFinedWorksService,
    private readonly exportExecutionCapacityService: ExportExecutionCapacityService,
    private readonly exportSuspensionsService: ExportSuspensionsService,
    private readonly exportExecutionReportService: ExportExecutionReportService,
    private readonly exportForecastService: ExportForecastService,
    private readonly exportRejectionsService: ExportRejectionsService,

    // Export - BI
    private readonly exportWorksInPortfolioBIService: ExportWorksInPortfolioBI,
    private readonly exportCompletedWorksBIService: ExportCompletedWorksBIService,
    private readonly exportSchedulesBIService: ExportSchedulesBIService,
  ) {}

  // ─────────────────────────────────────────────
  // Private helpers
  // ─────────────────────────────────────────────

  private applyFilters<T extends FiltersWithPermission>(
    filters: T,
    req: CustomRequest,
  ): T {
    if (req.idParceira) filters.idParceira = req.idParceira;
    if (req.insufficientPermission !== undefined)
      filters.insufficientPermission = req.insufficientPermission;
    return filters;
  }

  private setXlsxHeaders(res: Response, filename: string): void {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', XLSX_CONTENT_TYPE);
  }

  // ─────────────────────────────────────────────
  // Visualization routes
  // ─────────────────────────────────────────────

  @Get('programacao')
  @UseGuards(VisualizationGuard)
  async exportSchedule(
    @Query() filters: GetScheduleValuesDTO,
    @Res() res: Response,
    @Req() req: CustomRequest,
  ) {
    const appliedFilters = this.applyFilters(filters, req);
    const { works } =
      await this.getScheduleValuesService.getValues(appliedFilters);
    this.setXlsxHeaders(res, 'Exportação Programação');

    return this.exportScheduleService.export(works, res);
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

    this.setXlsxHeaders(res, 'Exportação obras em carteira');
    return this.exportWorksInPortfolioService.export(worksData, res);
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

    this.setXlsxHeaders(res, 'Exportação obras executadas');
    return this.exportCompletedWorksService.export(worksData, res);
  }

  @Get('resumo-mensal')
  @UseGuards(VisualizationGuard)
  async exportMonthlyMOSummary(
    @Query() summaryFilters: GetMonthlySummaryDTO,
    @Res() res: Response,
    @Req() req: CustomRequest,
  ) {
    const filters = this.applyFilters(summaryFilters, req);

    const [firstSummary, secondSummary] = await Promise.all([
      this.monthlyMOSummary.getSummary(filters),
      this.monthlyMOSummary.getSecondSummary(filters),
    ]);

    this.setXlsxHeaders(res, 'Exportação Resumo Mensal - Mão de Obra');
    return this.exportMonthlyMOSummaryService.export(
      firstSummary,
      secondSummary,
      res,
    );
  }

  @Get('resumo-mensal-forecast')
  @UseGuards(VisualizationGuard)
  async exportMonthlyForecastSummary(
    @Query() summaryFilters: GetMonthlySummaryDTO,
    @Res() res: Response,
    @Req() req: CustomRequest,
  ) {
    const filters = this.applyFilters(summaryFilters, req);

    const [firstSummary, secondSummary] = await Promise.all([
      this.monthlyForecastSummary.getSummary(filters),
      this.monthlyForecastSummary.getSecondSummary(filters),
    ]);

    this.setXlsxHeaders(res, 'Exportação Resumo Mensal - Forecast');
    return this.exportMonthlyForecastSummaryService.export(
      firstSummary,
      secondSummary,
      res,
    );
  }

  // ─────────────────────────────────────────────
  // BI routes (PermissionGuard - no filters)
  // ─────────────────────────────────────────────

  @Get('obras-carteira-bi')
  @UseGuards(PermissionGuard)
  async exportWorksInPortfolioBI(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação obras em carteira');
    return this.exportWorksInPortfolioBIService.export(res);
  }

  @Get('obras-executadas-bi')
  @UseGuards(PermissionGuard)
  async exportCompletedWorksBI(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação obras executadas');
    return this.exportCompletedWorksBIService.export(res);
  }

  @Get('programacoes-bi')
  @UseGuards(PermissionGuard)
  async exportSchedulesBI(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação programações');
    return this.exportSchedulesBIService.export(res);
  }

  // ─────────────────────────────────────────────
  // Permission routes (PermissionGuard - with optional filters)
  // ─────────────────────────────────────────────

  @Get('obras-multas')
  @UseGuards(PermissionGuard)
  async exportFinedWorks(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.setXlsxHeaders(res, 'Exportação a serem multadas');
    return this.exportFinedWorksService.export(res, startDate, endDate);
  }

  @Get('capacidade-execucao')
  @UseGuards(PermissionGuard)
  async exportExecutionCapacity(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação capacidade de execução');
    return this.exportExecutionCapacityService.export(res);
  }

  @Get('suspensoes')
  @UseGuards(PermissionGuard)
  async exportSuspensions(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação Suspensões');
    return this.exportSuspensionsService.export(res);
  }

  @Get('relatorio-execucao')
  @UseGuards(PermissionGuard)
  async exportExecutionReport(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação Relatório de Execução');
    return this.exportExecutionReportService.export(res);
  }

  @Get('forecast')
  @UseGuards(PermissionGuard)
  async exportForecast(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação do Forecast');
    return this.exportForecastService.export(res);
  }

  @Get('reprovacoes')
  @UseGuards(PermissionGuard)
  async exportRejections(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação das reprovações');
    return this.exportRejectionsService.export(res);
  }
}
