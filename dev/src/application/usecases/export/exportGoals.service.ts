import * as ExcelJS from 'exceljs';
import { Response } from 'express';

import { Injectable } from '@nestjs/common';

@Injectable()
export class ExportGoalsService {
  constructor() {}

  async export(goalsData: any[], response: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Metas');

    const months = [
      { key: 'jan', label: 'Janeiro' },
      { key: 'fev', label: 'Fevereiro' },
      { key: 'mar', label: 'Março' },
      { key: 'abr', label: 'Abril' },
      { key: 'mai', label: 'Maio' },
      { key: 'jun', label: 'Junho' },
      { key: 'jul', label: 'Julho' },
      { key: 'ago', label: 'Agosto' },
      { key: 'set', label: 'Setembro' },
      { key: 'out', label: 'Outubro' },
      { key: 'nov', label: 'Novembro' },
      { key: 'dez', label: 'Dezembro' },
    ];

    const fixedColumns: Partial<ExcelJS.Column>[] = [
      { header: 'Tipo de Obra', key: 'tipo_obra', width: 20 },
      { header: 'Parceira', key: 'turma', width: 20 },
      { header: 'Regional', key: 'regional', width: 25 },
      { header: 'Ano', key: 'anocalc', width: 10 },
      { header: 'Carteira', key: 'carteira', width: 12 },
      { header: 'Empreendimento', key: 'empreendimento', width: 25 },
    ];

    const monthColumns: Partial<ExcelJS.Column>[] = months.flatMap(
      ({ key, label }) => [
        { header: `${label} Meta`, key: `${key}_meta`, width: 14 },
        { header: `${label} Prog`, key: `${key}_prog`, width: 14 },
        { header: `${label} Real`, key: `${key}_real`, width: 14 },
      ],
    );

    worksheet.columns = [...fixedColumns, ...monthColumns];

    const rows = goalsData.map((item) => {
      const row: Record<string, any> = {
        tipo_obra: item.tipo_obra,
        turma: item.turma,
        regional: item.regional,
        anocalc: item.anocalc,
        carteira: item.carteira,
        empreendimento: item.empreendimento ?? '',
      };

      months.forEach(({ key }) => {
        row[`${key}_meta`] = item[key]?.meta ?? 0;
        row[`${key}_prog`] = item[key]?.prog ?? 0;
        row[`${key}_real`] = item[key]?.real ?? 0;
      });

      return row;
    });

    const batchSize = 1000;
    for (let i = 0; i < rows.length; i += batchSize) {
      worksheet.addRows(rows.slice(i, i + batchSize));
    }

    await workbook.xlsx.write(response);
  }
}
