import { Response } from 'express';
import {
  Controller,
  Get,
  NotFoundException,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';

// Guards
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';

// DTOs
import {
  GetMonthlySummaryDTO,
  GetScheduleValuesDTO,
} from 'src/interface/dtos/scheduleDTO';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';

// Services - Schedule
import { GetScheduleValuesService } from 'src/application/usecases/works/schedule/getScheduleValues.service';
import { MonthlySummaryService } from 'src/application/usecases/works/schedule/getMonthlySummary.service';
import { GetMonthlySummaryForecastService } from 'src/application/usecases/works/schedule/getMonthlySummaryForecast.service';

// Services - Works
import { GetWorksInPortfolioService } from 'src/application/usecases/works/management/getWorksInPortfolio.service';
import { GetCompletedWorksService } from 'src/application/usecases/works/management/getCompletedWorks.service';

// Services - Export (Standard)
import { ExportScheduleService } from 'src/application/usecases/export/exportSchedule.service';
import { ExportWorksInPortfolioService } from 'src/application/usecases/export/exportWorksInPortfolio.service';
import { ExportCompletedWorksService } from 'src/application/usecases/export/exportCompletedWorks.service';
import { ExportFinedWorksService } from 'src/application/usecases/export/exportFinedWorks.service';
import { ExportExecutionCapacityService } from 'src/application/usecases/export/exportExecutionCapacity.service';
import { ExportSuspensionsService } from 'src/application/usecases/export/exportSuspensions.service';
import { ExportExecutionReportService } from 'src/application/usecases/export/exportExecutionReport.service';
import { ExportForecastService } from 'src/application/usecases/export/exportForecast.service';
import { ExportRejectionsService } from 'src/application/usecases/export/exportRejections.service';
import { ExportMonthlyMOSummaryService } from 'src/application/usecases/export/exportMonthlySummary.service';
import { ExportMonthlyForecastSummaryService } from 'src/application/usecases/export/exportMonthlyForecastSummary.service';

// Services - Export (BI)
import { ExportWorksInPortfolioBI } from 'src/application/usecases/export/BI/exportWorkInPortfolioBI.service';
import { ExportCompletedWorksBIService } from 'src/application/usecases/export/BI/exportCompletedWorksBI.service';
import { ExportSchedulesBIService } from 'src/application/usecases/export/BI/exportSchedulesBI.service';
import { GoalsDTO } from '../dtos/goalsDto';
import { ExportGoalsService } from 'src/application/usecases/export/exportGoals.service';
import { GoalsService } from 'src/application/usecases/goals.service';
import { ExportOrdersService } from 'src/application/usecases/export/exportOrders.service';
import { GetRestrictionsDTO } from '../dtos/restrictionsDTO';
import { RestrictionsService } from 'src/application/usecases/restrictions.service';
import { ExportPublicationRestrictionService } from 'src/application/usecases/export/exportPublicationRestriction.service';
import { ExportReportToPubliationService } from 'src/application/usecases/export/exportReportToPublication.service';
import { ExportServicesInputDto } from '../dtos/workServicesDTO';
import {
  ExportPdfServicesService,
  ExportServicesPdfOutput,
} from 'src/application/usecases/export/services/exportPdfServices.service';
import { ExportExcelServicesService } from 'src/application/usecases/export/services/exportExcelServices.service';
import { ExportServicesExcelOutput } from '../types/servicesInterface';
import { FeasibilityService } from 'src/application/usecases/feasibility.service';
import { ExportFeasibilityService } from 'src/application/usecases/export/exportFeasibility.service';
import { ExportFeasibilityInputDto } from '../dtos/feasibilityDTO';
import { ExportServicesService } from 'src/application/usecases/services/exportServices.service';

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
    private readonly monthlyMOSummary: MonthlySummaryService,
    private readonly monthlyForecastSummary: GetMonthlySummaryForecastService,

    // Works
    private readonly getWorksInPortfolioService: GetWorksInPortfolioService,
    private readonly getCompletedWorksService: GetCompletedWorksService,

    // Goals
    private readonly getGoalsService: GoalsService,

    // Restrictions
    private readonly restrictionsService: RestrictionsService,

    // Services
    private readonly exportServicesService: ExportServicesService,

    // Feasibility
    private readonly feasibilityService: FeasibilityService,

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
    private readonly exportGoalsService: ExportGoalsService,
    private readonly exportOrdersService: ExportOrdersService,
    private readonly exportPublicationRestrictionService: ExportPublicationRestrictionService,
    private readonly exportReportToPublicationService: ExportReportToPubliationService,
    private readonly exportPdfServicesService: ExportPdfServicesService,
    private readonly exportExcelServicesService: ExportExcelServicesService,
    private readonly exportFeasibilityService: ExportFeasibilityService,

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

  private setPdfHeaders(res: Response, fileName: string) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}.pdf"`,
    );
  }

  // ─────────────────────────────────────────────
  // Visualization routes
  // ─────────────────────────────────────────────

  @Get('programacao')
  @UseGuards(AreaViewGuard())
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
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
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
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1, 9] }))
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
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
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
    @Req() req: CustomRequest,
  ) {
    const filters = this.applyFilters(summaryFilters, req);

    const [firstSummary, secondSummary] = await Promise.all([
      this.monthlyForecastSummary.getSummary(filters),
      this.monthlyForecastSummary.getSecondSummary(filters),
    ]);

    this.setXlsxHeaders(res, 'Exportação Resumo Mensal - Forecast');
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
    @Req() req: CustomRequest,
  ) {
    const appliedFilters = this.applyFilters(filters, req);
    const goalsData = await this.getGoalsService.getGoals(appliedFilters);

    this.setXlsxHeaders(res, 'Exportação Metas');
    return this.exportGoalsService.export(goalsData, res);
  }

  @Get('publicacoes')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1, 7] }))
  async exportPublicationRestrictions(
    @Query() filters: GetRestrictionsDTO,
    @Res() res: Response,
    @Req() req: CustomRequest,
  ) {
    const appliedFilters = this.applyFilters(filters, req);
    const publicationRestrictionData =
      await this.restrictionsService.getPublicationRestriction(appliedFilters);

    this.setXlsxHeaders(res, 'Exportação Restrições de Publicação');
    return this.exportPublicationRestrictionService.export(
      publicationRestrictionData,
      res,
    );
  }

  @Get('servicos')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async exportServices(
    @Query() filters: ExportServicesInputDto,
    @Res() res: Response,
    @Req() req: any,
  ) {
    const appliedFilters = this.applyFilters(filters, req);

    const servicesData =
      await this.exportServicesService.getServicesToExportation(appliedFilters);

    if (!servicesData.length) {
      throw new NotFoundException(
        'Nenhuma obra encontrada para os filtros informados.',
      );
    }

    if (filters.fileType === 'pdf') {
      this.setPdfHeaders(res, 'Exportacao Serviços e Materiais');
      return this.exportPdfServicesService.export(
        servicesData as ExportServicesPdfOutput[],
        res,
      );
    }

    this.setXlsxHeaders(res, 'Exportacao Serviços e Materiais');
    return this.exportExcelServicesService.export(
      servicesData as ExportServicesExcelOutput[],
      res,
      req.user.tipo_usuario === 'INTERNO',
    );
  }

  @Get('viabilidade/aguardando-aprovacao')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportFeasibilityPendingApproval(
    @Res() res: Response,
    @Query() query: ExportFeasibilityInputDto,
  ) {
    const { idPartner } = query;

    const data =
      await this.feasibilityService.exportFeasibilityPendingApproval(idPartner);

    this.setXlsxHeaders(res, 'Exportação Viabilidade Aguardando Aprovação');
    return this.exportFeasibilityService.exportFeasibilityPendingApproval(
      data,
      res,
    );
  }

  @Get('viabilidade/aguardando-viabilidade')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportFeasibilityPending(
    @Res() res: Response,
    @Query() query: ExportFeasibilityInputDto,
  ) {
    const { idPartner } = query;

    const data =
      await this.feasibilityService.exportFeasibilityPending(idPartner);

    this.setXlsxHeaders(res, 'Exportação Viabilidade Pendente');
    return this.exportFeasibilityService.exportFeasibilityPending(data, res);
  }

  // ─────────────────────────────────────────────
  // BI routes (PermissionGuard - no filters)
  // ─────────────────────────────────────────────

  @Get('obras-carteira-bi')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportWorksInPortfolioBI(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação obras em carteira');
    return this.exportWorksInPortfolioBIService.export(res);
  }

  @Get('obras-executadas-bi')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportCompletedWorksBI(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação obras executadas');
    return this.exportCompletedWorksBIService.export(res);
  }

  @Get('programacoes-bi')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportSchedulesBI(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação programações');
    return this.exportSchedulesBIService.export(res);
  }

  // ─────────────────────────────────────────────
  // Permission routes (PermissionGuard - with optional filters)
  // ─────────────────────────────────────────────

  @Get('obras-multas')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportFinedWorks(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.setXlsxHeaders(res, 'Exportação a serem multadas');
    return this.exportFinedWorksService.export(res, startDate, endDate);
  }

  @Get('capacidade-execucao')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportExecutionCapacity(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação capacidade de execução');
    return this.exportExecutionCapacityService.export(res);
  }

  @Get('suspensoes')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportSuspensions(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação Suspensões');
    return this.exportSuspensionsService.export(res);
  }

  @Get('relatorio-execucao')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1, 7], blockPartner: true }))
  async exportExecutionReport(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação Relatório de Execução');
    return this.exportExecutionReportService.export(res);
  }

  @Get('forecast')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportForecast(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação do Forecast');
    return this.exportForecastService.export(res);
  }

  @Get('reprovacoes')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportRejections(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação das reprovações');
    return this.exportRejectionsService.export(res);
  }

  @Get('ordens')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportOrders(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação Ordens/Diagramas');
    return this.exportOrdersService.export(res);
  }

  @Get('relatorio-publicacoes')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1, 7], blockPartner: true }))
  async exportReportToPublication(@Res() res: Response) {
    this.setXlsxHeaders(res, 'Exportação Relatório Publicações ');
    return this.exportReportToPublicationService.export(res);
  }
}
