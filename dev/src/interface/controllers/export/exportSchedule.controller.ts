import { Response } from 'express';
import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';

import { AreaViewGuard } from 'src/core/guards/newPermission.guard';
import {
  GetMonthlySummaryDTO,
  GetScheduleValuesDTO,
} from 'src/interface/dtos/scheduleDTO';
import { GoalsDTO } from 'src/interface/dtos/goalsDto';

import { GetScheduleValuesService } from 'src/application/usecases/works/schedule/getScheduleValues.service';
import { MonthlySummaryService } from 'src/application/usecases/works/schedule/getMonthlySummary.service';
import { GetMonthlySummaryForecastService } from 'src/application/usecases/works/schedule/getMonthlySummaryForecast.service';
import { GoalsService } from 'src/application/usecases/goals.service';
import { ExportScheduleService } from 'src/application/usecases/export/exportSchedule.service';
import { ExportMonthlyMOSummaryService } from 'src/application/usecases/export/exportMonthlySummary.service';
import { ExportMonthlyForecastSummaryService } from 'src/application/usecases/export/exportMonthlyForecastSummary.service';
import { ExportExecutionCapacityService } from 'src/application/usecases/export/exportExecutionCapacity.service';
import { ExportExecutionReportService } from 'src/application/usecases/export/exportExecutionReport.service';
import { ExportForecastService } from 'src/application/usecases/export/exportForecast.service';
import { ExportGoalsService } from 'src/application/usecases/export/exportGoals.service';

import {
  ExportRequest,
  applyPartnerFilters,
  setXlsxHeaders,
} from './export.helpers';

@Controller('exportacao')
export class ExportScheduleController {
  constructor(
    private readonly getScheduleValuesService: GetScheduleValuesService,
    private readonly monthlyMOSummary: MonthlySummaryService,
    private readonly monthlyForecastSummary: GetMonthlySummaryForecastService,
    private readonly getGoalsService: GoalsService,
    private readonly exportScheduleService: ExportScheduleService,
    private readonly exportMonthlyMOSummaryService: ExportMonthlyMOSummaryService,
    private readonly exportMonthlyForecastSummaryService: ExportMonthlyForecastSummaryService,
    private readonly exportExecutionCapacityService: ExportExecutionCapacityService,
    private readonly exportExecutionReportService: ExportExecutionReportService,
    private readonly exportForecastService: ExportForecastService,
    private readonly exportGoalsService: ExportGoalsService,
  ) {}

  @Get('programacao')
  @UseGuards(AreaViewGuard())
  async exportSchedule(
    @Query() filters: GetScheduleValuesDTO,
    @Res() res: Response,
    @Req() req: ExportRequest,
  ) {
    const appliedFilters = applyPartnerFilters(filters, req);
    const { works } =
      await this.getScheduleValuesService.getValues(appliedFilters);

    setXlsxHeaders(res, 'Exportação Programação');
    return this.exportScheduleService.export(works, res);
  }

  @Get('resumo-mensal')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportMonthlyMOSummary(
    @Query() summaryFilters: GetMonthlySummaryDTO,
    @Res() res: Response,
    @Req() req: ExportRequest,
  ) {
    const filters = applyPartnerFilters(summaryFilters, req);
    const [firstSummary, secondSummary] = await Promise.all([
      this.monthlyMOSummary.getSummary(filters),
      this.monthlyMOSummary.getSecondSummary(filters),
    ]);

    setXlsxHeaders(res, 'Exportação Resumo Mensal - Mão de Obra');
    return this.exportMonthlyMOSummaryService.export(
      firstSummary.summary,
      secondSummary.summary,
      res,
    );
  }

  @Get('resumo-mensal-forecast')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportMonthlyForecastSummary(
    @Query() summaryFilters: GetMonthlySummaryDTO,
    @Res() res: Response,
    @Req() req: ExportRequest,
  ) {
    const filters = applyPartnerFilters(summaryFilters, req);
    const [firstSummary, secondSummary] = await Promise.all([
      this.monthlyForecastSummary.getSummary(filters),
      this.monthlyForecastSummary.getSecondSummary(filters),
    ]);

    setXlsxHeaders(res, 'Exportação Resumo Mensal - Forecast');
    return this.exportMonthlyForecastSummaryService.export(
      firstSummary.summary,
      secondSummary.summary,
      res,
    );
  }

  @Get('metas')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportGoals(
    @Query() filters: GoalsDTO,
    @Res() res: Response,
    @Req() req: ExportRequest,
  ) {
    const appliedFilters = applyPartnerFilters(filters, req);
    const goalsData = await this.getGoalsService.getGoals(appliedFilters);

    setXlsxHeaders(res, 'Exportação Metas');
    return this.exportGoalsService.export(goalsData, res);
  }

  @Get('forecast')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportForecast(@Res() res: Response) {
    setXlsxHeaders(res, 'Exportação do Forecast');
    return this.exportForecastService.export(res);
  }

  @Get('capacidade-execucao')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportExecutionCapacity(@Res() res: Response) {
    setXlsxHeaders(res, 'Exportação capacidade de execução');
    return this.exportExecutionCapacityService.export(res);
  }

  @Get('relatorio-execucao')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1, 7], blockPartner: true }))
  async exportExecutionReport(@Res() res: Response) {
    setXlsxHeaders(res, 'Exportação Relatório de Execução');
    return this.exportExecutionReportService.export(res);
  }
}
