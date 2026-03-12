import * as Exceljs from 'exceljs';
import { Response } from 'express';

import { Injectable } from '@nestjs/common';

@Injectable()
export class ExportMonthlyMOSummaryService {
  constructor() {}

  async export(
    firstSummaryData: any[],
    secondSummaryData: any[],
    response: Response,
  ) {
    const workbook = new Exceljs.Workbook();
    const firstWorksheet = workbook.addWorksheet('Resumo Mensal - Mão de Obra');
    const secondWorksheet = workbook.addWorksheet(
      'Resumo Mensal Mão de Obra - Grupos',
    );

    firstWorksheet.columns = [
      {
        header: 'Data Programada',
        key: 'dataProg',
        width: 15,
        style: { numFmt: 'dd/mm/yyyy' },
      },
      { header: 'Total de Obras', key: 'totalQtde', width: 15 },
      { header: 'Total de Equipes', key: 'teamsTotal', width: 15 },
      {
        header: 'Meta Financeiro',
        key: 'financialGoal',
        width: 15,
      },
      {
        header: 'Meta Diária',
        key: 'diaryGoal',
        width: 10,
        style: { numFmt: '0.00%' },
      },
      {
        header: 'Meta Financeiro (Meta 108% AP)',
        key: 'financialGoalWith8',
        width: 20,
      },
      {
        header: 'Meta Diária (Meta 108% AP)',
        key: 'diaryGoalWith8',
        width: 10,
        style: { numFmt: '0.00%' },
      },
      { header: 'Total MO Prog', key: 'totalMoProg', width: 20 },
      { header: 'Total MO Exec', key: 'totalMoExec', width: 10 },
    ];

    secondWorksheet.columns = [
      {
        header: 'Grupo',
        key: 'grupo',
        width: 20,
      },
      { header: 'Parceira', key: 'turma', width: 15 },
      { header: 'Total de obras', key: 'qtdeObras', width: 15 },
      {
        header: 'Total MO Prog',
        key: 'totalMoProg',
        width: 10,
      },
      { header: 'Total MO Exec', key: 'totalMoExec', width: 10 },
      {
        header: 'Total MO Prev',
        key: 'totalMoPrev',
        width: 10,
      },
      {
        header: 'Diferença',
        key: 'diff',
        width: 20,
        style: { numFmt: '0.00%' },
      },
    ];

    const batchSize = 1000;

    for (let i = 0; i < firstSummaryData.length; i += batchSize) {
      const batch = firstSummaryData.slice(i, i + batchSize);

      const formattedBatch = batch.map((row) => ({
        ...row,
        diaryGoal: row.diaryGoal / 100,
        diaryGoalWith8: row.diaryGoalWith8 / 100,
      }));

      firstWorksheet.addRows(formattedBatch);
    }

    for (let i = 0; i < secondSummaryData.length; i += batchSize) {
      const batch = secondSummaryData.slice(i, i + batchSize);

      const formattedBatch = batch.map((row) => ({
        ...row,
        diff: row.diff / 100,
      }));

      secondWorksheet.addRows(formattedBatch);
    }

    await workbook.xlsx.write(response);
  }
}
