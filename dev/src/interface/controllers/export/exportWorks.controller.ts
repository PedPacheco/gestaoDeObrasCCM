import { Response } from 'express';
import { ExportCompletedWorksService } from 'src/application/usecases/export/exportCompletedWorks.service';
import { ExportFinedWorksService } from 'src/application/usecases/export/exportFinedWorks.service';
import { ExportOrdersService } from 'src/application/usecases/export/exportOrders.service';
import { ExportRejectionsService } from 'src/application/usecases/export/exportRejections.service';
import { ExportSuspensionsService } from 'src/application/usecases/export/exportSuspensions.service';
import { ExportWorksInPortfolioService } from 'src/application/usecases/export/exportWorksInPortfolio.service';
import { GetCompletedWorksService } from 'src/application/usecases/works/management/getCompletedWorks.service';
import { GetWorksInPortfolioService } from 'src/application/usecases/works/management/getWorksInPortfolio.service';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';
import { GetWorksDTO } from 'src/interface/dtos/worksDto';

import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';

import {
  applyPartnerFilters,
  ExportRequest,
  setXlsxHeaders,
} from './export.helpers';

@Controller('exportacao')
export class ExportWorksController {
  constructor(
    private readonly getWorksInPortfolioService: GetWorksInPortfolioService,
    private readonly getCompletedWorksService: GetCompletedWorksService,
    private readonly exportWorksInPortfolioService: ExportWorksInPortfolioService,
    private readonly exportCompletedWorksService: ExportCompletedWorksService,
    private readonly exportFinedWorksService: ExportFinedWorksService,
    private readonly exportSuspensionsService: ExportSuspensionsService,
    private readonly exportRejectionsService: ExportRejectionsService,
    private readonly exportOrdersService: ExportOrdersService,
  ) {}

  @Get('obras-carteira')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async exportWorksInPortfolio(
    @Query() workFilters: GetWorksDTO,
    @Res() res: Response,
    @Req() req: ExportRequest,
  ) {
    const filters = applyPartnerFilters(workFilters, req);
    const worksData =
      await this.getWorksInPortfolioService.getWorksInPortfolio(filters);

    setXlsxHeaders(res, 'Exportação obras em carteira');
    return this.exportWorksInPortfolioService.export(worksData, res);
  }

  @Get('obras-executadas')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1, 9] }))
  async exportCompletedWorks(
    @Query() workFilters: GetWorksDTO,
    @Res() res: Response,
    @Req() req: ExportRequest,
  ) {
    const filters = applyPartnerFilters(workFilters, req);
    const worksData =
      await this.getCompletedWorksService.getCompletedWorks(filters);

    setXlsxHeaders(res, 'Exportação obras executadas');
    return this.exportCompletedWorksService.export(worksData, res);
  }

  @Get('obras-multas')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportFinedWorks(
    @Res() res: Response,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    setXlsxHeaders(res, 'Exportação a serem multadas');
    return this.exportFinedWorksService.export(res, startDate, endDate);
  }

  @Get('suspensoes')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportSuspensions(@Res() res: Response) {
    setXlsxHeaders(res, 'Exportação Suspensões');
    return this.exportSuspensionsService.export(res);
  }

  @Get('reprovacoes')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportRejections(@Res() res: Response) {
    setXlsxHeaders(res, 'Exportação das reprovações');
    return this.exportRejectionsService.export(res);
  }

  @Get('ordens')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportOrders(@Res() res: Response) {
    setXlsxHeaders(res, 'Exportação Ordens/Diagramas');
    return this.exportOrdersService.export(res);
  }
}
