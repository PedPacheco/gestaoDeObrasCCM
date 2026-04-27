import { Body, Controller, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';

import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import { EquipmentService } from 'src/application/usecases/equipment.service';
import { GetEquipmentListDTO } from '../dtos/equipmentsDTO';

@Controller('equipamentos')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @UseGuards(VisualizationGuard)
  async getEquipamentos(@Body() body: GetEquipmentListDTO) {
    return this.equipmentService.getEquipment(body.items);
  }

  @Post('without-location/export')
  @UseGuards(VisualizationGuard)
  async exportWithoutLocation(
    @Body() params: GetEquipmentListDTO,
    @Res() res: Response,
  ) {
    const obras = await this.equipmentService.getWithoutLocation(params.items);

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Obras sem localização');

    sheet.columns = [
      { header: 'Nº da Nota', key: 'ovnota', width: 15 },
      { header: 'Equipamento Referência', key: 'referencia', width: 20 },
      { header: 'Status', key: 'status', width: 30 },
      { header: 'Conjunto', key: 'conjunto', width: 30 },
      { header: 'Circuito', key: 'circuito', width: 15 },
      { header: 'Empreiteira', key: 'empreiteira', width: 20 },
      { header: 'Tipo', key: 'tipo_obra', width: 35 },
      { header: 'Executado', key: 'executado', width: 12 },
      { header: 'Empreendimento', key: 'empreendimento', width: 25 },
    ];

    sheet.getRow(1).font = { bold: true };
    sheet.addRows(obras);

    res.setHeader(
      'Content-Disposition',
      'attachment; filename=\"obras-sem-localizacao.xlsx\"',
    );
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );

    await workbook.xlsx.write(res);
    res.end();
  }
}
