import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import {
  EXPORT_REPOSITORY,
  IExportRepository,
} from 'src/domain/repositories/IExportRepository';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ExportSuspensionsService {
  constructor(
    @Inject(EXPORT_REPOSITORY)
    private readonly exportRepository: IExportRepository,
  ) {}

  async export(response: Response) {
    const [suspendedData, suspensionsRemovedData] = await Promise.all([
      await this.exportRepository.exportSuspensions(),
      await this.exportRepository.exportSuspensionsRemoved(),
    ]);

    const formattedSuspendedData = suspendedData.map((row) => ({
      ovnota: row.obras.ovnota,
      data: row.data,
      motivo: row.motivo,
      status: row.obras.status.status,
      tipo_obra: row.obras.tipos.tipo_obra,
      parceira: row.obras.turmas.turma,
      municipio: row.obras.municipios.municipio,
      regional: row.obras.municipios.regionais.regional,
    }));

    const formattedSuspendedRemovedData = suspensionsRemovedData.map((row) => ({
      ovnota: row.obras.ovnota,
      status_retirada: row.status.status,
      data_retirada: row.data_retirada,
      tipo_obra: row.obras.tipos.tipo_obra,
      parceira: row.obras.turmas.turma,
      municipio: row.obras.municipios.municipio,
      regional: row.obras.municipios.regionais.regional,
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Suspensões');

    worksheet.columns = [
      { header: 'Ovnota', key: 'ovnota', width: 10 },
      { header: 'Data', key: 'data', width: 20 },
      { header: 'Motivo', key: 'motivo', width: 20 },
      { header: 'Status', key: 'status', width: 10 },
      { header: 'Tipo da obra', key: 'tipo_obra', width: 20 },
      { header: 'Parceira', key: 'parceira', width: 20 },
      { header: 'Municipio', key: 'municipio', width: 20 },
      { header: 'Regional', key: 'regional', width: 20 },
    ];

    const batchSize = 1000;

    for (let i = 0; i < formattedSuspendedData.length; i += batchSize) {
      const batch = formattedSuspendedData.slice(i, i + batchSize);
      worksheet.addRows(batch);
    }

    const worksheet2 = workbook.addWorksheet('Suspensões Retiradas');

    worksheet2.columns = [
      { header: 'Ovnota', key: 'ovnota', width: 10 },
      { header: 'Status Retirada', key: 'status_retirada', width: 20 },
      { header: 'Data retirada', key: 'data_retirada', width: 20 },
      { header: 'Tipo da obra', key: 'tipo_obra', width: 20 },
      { header: 'Parceira', key: 'parceira', width: 20 },
      { header: 'Municipio', key: 'municipio', width: 20 },
      { header: 'Regional', key: 'regional', width: 20 },
    ];

    const batchSize2 = 1000;

    for (let i = 0; i < formattedSuspendedRemovedData.length; i += batchSize2) {
      const batch = formattedSuspendedRemovedData.slice(i, i + batchSize2);
      worksheet2.addRows(batch);
    }

    await workbook.xlsx.write(response);
  }
}
