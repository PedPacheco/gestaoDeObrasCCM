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

import { AreaViewGuard } from 'src/core/guards/newPermission.guard';
import { ExportServicesInputDto } from 'src/interface/dtos/workServicesDTO';
import { ExportServicesExcelOutput } from 'src/interface/types/servicesInterface';

import { ExportServicesService } from 'src/application/usecases/services/exportServices.service';
import {
  ExportPdfServicesService,
  ExportServicesPdfOutput,
} from 'src/application/usecases/export/services/exportPdfServices.service';
import { ExportExcelServicesService } from 'src/application/usecases/export/services/exportExcelServices.service';

import {
  ExportRequest,
  applyPartnerFilters,
  setPdfHeaders,
  setXlsxHeaders,
} from './export.helpers';

@Controller('exportacao')
export class ExportServicesController {
  constructor(
    private readonly exportServicesService: ExportServicesService,
    private readonly exportPdfServicesService: ExportPdfServicesService,
    private readonly exportExcelServicesService: ExportExcelServicesService,
  ) {}

  @Get('servicos')
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async exportServices(
    @Query() filters: ExportServicesInputDto,
    @Res() res: Response,
    @Req() req: ExportRequest,
  ) {
    const appliedFilters = applyPartnerFilters(filters, req);
    const servicesData =
      await this.exportServicesService.getServicesToExportation(appliedFilters);

    if (!servicesData.length) {
      throw new NotFoundException(
        'Nenhuma obra encontrada para os filtros informados.',
      );
    }

    if (filters.fileType === 'pdf') {
      setPdfHeaders(res, 'Exportacao Serviços e Materiais');
      return this.exportPdfServicesService.export(
        servicesData as ExportServicesPdfOutput[],
        res,
      );
    }

    setXlsxHeaders(res, 'Exportacao Serviços e Materiais');
    return this.exportExcelServicesService.export(
      servicesData as ExportServicesExcelOutput[],
      res,
      req.user.tipo_usuario === 'INTERNO',
    );
  }
}
