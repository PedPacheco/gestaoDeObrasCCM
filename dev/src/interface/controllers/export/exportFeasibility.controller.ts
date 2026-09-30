import { Response } from 'express';
import { Controller, Get, Query, Res, UseGuards } from '@nestjs/common';

import { AreaViewGuard } from 'src/core/guards/newPermission.guard';
import { ExportFeasibilityInputDto } from 'src/interface/dtos/feasibilityDTO';

import { FeasibilityService } from 'src/application/usecases/feasibility.service';
import { ExportFeasibilityService } from 'src/application/usecases/export/exportFeasibility.service';

import { setXlsxHeaders } from './export.helpers';

@Controller('exportacao/viabilidade')
export class ExportFeasibilityController {
  constructor(
    private readonly feasibilityService: FeasibilityService,
    private readonly exportFeasibilityService: ExportFeasibilityService,
  ) {}

  @Get('aguardando-aprovacao')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportFeasibilityPendingApproval(
    @Res() res: Response,
    @Query() query: ExportFeasibilityInputDto,
  ) {
    const data = await this.feasibilityService.exportFeasibilityPendingApproval(
      query.idPartner,
    );

    setXlsxHeaders(res, 'Exportação Viabilidade Aguardando Aprovação');
    return this.exportFeasibilityService.exportFeasibilityPendingApproval(
      data,
      res,
    );
  }

  @Get('aguardando-viabilidade')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1], blockPartner: true }))
  async exportFeasibilityPending(
    @Res() res: Response,
    @Query() query: ExportFeasibilityInputDto,
  ) {
    const data = await this.feasibilityService.exportFeasibilityPending(
      query.idPartner,
    );

    setXlsxHeaders(res, 'Exportação Viabilidade Pendente');
    return this.exportFeasibilityService.exportFeasibilityPending(data, res);
  }
}
