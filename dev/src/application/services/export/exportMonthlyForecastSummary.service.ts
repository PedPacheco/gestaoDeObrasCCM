import * as Exceljs from 'exceljs';
import { Response } from 'express';

import { Injectable } from '@nestjs/common';

@Injectable()
export class ExportMonthlyForecastSummaryService {
  constructor() {}

  async export(
    firstSummaryData: any[],
    secondSummaryData: any[],
    response: Response,
  ) {
    const workbook = new Exceljs.Workbook();
    const firstWorksheet = workbook.addWorksheet('Resumo Mensal Forecast');
    const secondWorksheet = workbook.addWorksheet(
      'Resumo Mensal Forecast - Grupos',
    );

    firstWorksheet.columns = [
      {
        header: 'Data Programada',
        key: 'dataProg',
        width: 20,
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
        width: 20,
        style: { numFmt: '0.00%' },
      },
      {
        header: 'Valor dos Serviços Programados',
        key: 'serviceMoProg',
        width: 25,
      },
      {
        header: 'Valor dos Serviços Planejados',
        key: 'serviceMoPlan',
        width: 25,
      },
      {
        header: 'Valor dos Serviços Pendentes',
        key: 'serviceMoPend',
        width: 25,
      },
      {
        header: 'Valor dos Serviços Executados',
        key: 'serviceMoExec',
        width: 25,
      },
      {
        header: 'Valor dos Material Programados',
        key: 'materialMoProg',
        width: 25,
      },
      {
        header: 'Valor dos Material Planejados',
        key: 'materialMoPlan',
        width: 25,
      },
      {
        header: 'Valor dos Material Pendentes',
        key: 'materialMoPend',
        width: 25,
      },
      {
        header: 'Valor dos Material Executados',
        key: 'materialMoExec',
        width: 25,
      },
      {
        header: 'Programado x Executado (%)',
        key: 'diff',
        width: 25,
        style: { numFmt: '0.00%' },
      },
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
        header: 'Total Serviço Prog',
        key: 'totalServiceMoProg',
        width: 25,
      },
      {
        header: 'Total Serviço Plan',
        key: 'totalServiceMoPlan',
        width: 25,
      },
      {
        header: 'Total Serviço Pend',
        key: 'totalServiceMoPend',
        width: 25,
      },
      { header: 'Total Serviço Exec', key: 'totalServiceMoExec', width: 25 },
      {
        header: 'Total Serviço Prev',
        key: 'totalServiceMoPrev',
        width: 25,
      },
      {
        header: 'Total Material Prog',
        key: 'totalMaterialMoProg',
        width: 25,
      },
      {
        header: 'Total Material Plan',
        key: 'totalMaterialMoPlan',
        width: 25,
      },
      {
        header: 'Total Material Pend',
        key: 'totalMaterialMoPend',
        width: 25,
      },
      { header: 'Total Material Exec', key: 'totalMaterialMoExec', width: 25 },
      {
        header: 'Total Material Prev',
        key: 'totalMaterialMoPrev',
        width: 25,
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
        diff: row.diff / 100,
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
