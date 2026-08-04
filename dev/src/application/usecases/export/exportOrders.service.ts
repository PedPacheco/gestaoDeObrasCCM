import { Inject, Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import {
  EXPORT_REPOSITORY,
  IExportRepository,
} from 'src/domain/contracts/IExportRepository';

@Injectable()
export class ExportOrdersService {
  constructor(
    @Inject(EXPORT_REPOSITORY)
    private readonly exportRepository: IExportRepository,
  ) {}

  async export(res: Response) {
    const data = await this.exportRepository.exportOrders();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Exportação Ordens e Diagramas');

    worksheet.columns = [
      { header: 'Ov/Nota', key: 'ovnota', width: 20 },
      { header: 'Grupo', key: 'grupo', width: 20 },
      { header: 'Tipo de Obra', key: 'tipo_obra', width: 20 },
      { header: 'Status', key: 'status', width: 20 },
      { header: 'Ordem/Diagrama', key: 'ordemdiagrama', width: 20 },
      { header: 'Data execução', key: 'data_conclusao', width: 20 },
      { header: 'Data programada', key: 'data_prog', width: 20 },
      { header: 'Regional', key: 'regional', width: 20 },
      { header: 'Parceira', key: 'turma', width: 20 },
    ];

    const batchSize = 1000;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      worksheet.addRows(batch);
    }

    await workbook.xlsx.write(res);
  }
}
