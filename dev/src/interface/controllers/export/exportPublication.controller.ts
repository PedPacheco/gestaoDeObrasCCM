import { Response } from 'express';
import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';

import { AreaViewGuard } from 'src/core/guards/newPermission.guard';
import { GetRestrictionsDTO } from 'src/interface/dtos/restrictionsDTO';

import { RestrictionsService } from 'src/application/usecases/restrictions.service';
import { ExportPublicationRestrictionService } from 'src/application/usecases/export/exportPublicationRestriction.service';
import { ExportReportToPubliationService } from 'src/application/usecases/export/exportReportToPublication.service';

import {
  ExportRequest,
  applyPartnerFilters,
  setXlsxHeaders,
} from './export.helpers';

@Controller('exportacao')
export class ExportPublicationsController {
  constructor(
    private readonly restrictionsService: RestrictionsService,
    private readonly exportPublicationRestrictionService: ExportPublicationRestrictionService,
    private readonly exportReportToPublicationService: ExportReportToPubliationService,
  ) {}

  @Get('publicacoes')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1, 7] }))
  async exportPublicationRestrictions(
    @Query() filters: GetRestrictionsDTO,
    @Res() res: Response,
    @Req() req: ExportRequest,
  ) {
    const appliedFilters = applyPartnerFilters(filters, req);
    const data =
      await this.restrictionsService.getPublicationRestriction(appliedFilters);

    setXlsxHeaders(res, 'Exportação Restrições de Publicação');
    return this.exportPublicationRestrictionService.export(data, res);
  }

  @Get('relatorio-publicacoes')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1, 7], blockPartner: true }))
  async exportReportToPublication(@Res() res: Response) {
    setXlsxHeaders(res, 'Exportação Relatório Publicações ');
    return this.exportReportToPublicationService.export(res);
  }
}
