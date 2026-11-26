import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { ContingencyResourceDispatches } from 'src/domain/types';

type ExportColumn = Partial<ExcelJS.Column> & {
  key: keyof ContingencyResourceDispatches;
};

const FORMATS = {
  dateTime: 'dd/mm/yyyy hh:mm:ss',
  date: 'dd/mm/yyyy',
  integer: '#,##0',
} as const;

/** Mesma ordem da folha original do Forms */
const COLUMNS: ExportColumn[] = [
  {
    header: 'Data de envio',
    key: 'createdAt',
    width: 20,
    style: { numFmt: FORMATS.dateTime },
  },
  { header: 'Enviado Por', key: 'user', width: 35 },
  { header: 'Parceira', key: 'partner', width: 25 },
  {
    header: 'Dia da disponibilidade',
    key: 'availabilityDate',
    width: 20,
    style: { numFmt: FORMATS.date },
  },
  { header: 'Tipo de recurso - Mão de obra', key: 'laborType', width: 30 },
  {
    header: 'Quantidade de mão de obra',
    key: 'laborQuantity',
    width: 18,
    style: { numFmt: FORMATS.integer },
  },
  { header: 'Tipo de recurso - Equipe', key: 'teamType', width: 30 },
  {
    header: 'Quantidade de equipe',
    key: 'teamQuantity',
    width: 18,
    style: { numFmt: FORMATS.integer },
  },
  { header: 'Disponibilizado ao CSD', key: 'allocatedCsd', width: 25 },
];

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

@Injectable()
export class ExportContingencyService {
  async export(
    data: ContingencyResourceDispatches[],
    response: Response,
    fileName = `recursos_contingencia_${new Date().toISOString().slice(0, 10)}.xlsx`,
  ): Promise<void> {
    const workbook = this.buildWorkbook(data);

    response.setHeader('Content-Type', XLSX_MIME);
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    );

    await workbook.xlsx.write(response);
    response.end();
  }

  buildWorkbook(data: ContingencyResourceDispatches[]): ExcelJS.Workbook {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Contingência CCM';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('Contingência', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    worksheet.columns = COLUMNS;
    this.styleHeader(worksheet);

    if (!data.length) {
      worksheet.addRow([]).getCell(1).value =
        'Sem dados para o período selecionado.';
      return workbook;
    }

    worksheet.addRows(data);

    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: COLUMNS.length },
    };

    return workbook;
  }

  private styleHeader(worksheet: ExcelJS.Worksheet): void {
    const header = worksheet.getRow(1);
    header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    header.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF2F3B4C' },
    };
    header.alignment = { vertical: 'middle' };
    header.height = 20;
  }
}
