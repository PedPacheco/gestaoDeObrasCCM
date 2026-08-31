import * as ExcelJS from 'exceljs';
import { Response } from 'express';

import { Injectable } from '@nestjs/common';

@Injectable()
export class ExportFeasibilityService {
  constructor() {}

  async export(data: any[], response: Response) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Viabilidade');

      worksheet.columns = [
        { header: 'OV/Nota', key: 'ovnota', width: 15 },

        {
          header: 'Ordem Diagrama',
          key: 'ordemDiagrama',
          width: 20,
        },

        {
          header: 'Data Envio',
          key: 'data_envio',
          width: 15,
          style: {
            numFmt: 'dd/mm/yyyy',
          },
        },

        {
          header: 'Operação',
          key: 'operacao',
          width: 25,
        },

        {
          header: 'Ponto',
          key: 'ponto',
          width: 15,
        },

        {
          header: 'Número Operação',
          key: 'numeroOperacao',
          width: 20,
        },

        {
          header: 'Descrição Operação',
          key: 'descricaoOperacao',
          width: 60,
        },

        {
          header: 'Material',
          key: 'material',
          width: 15,
        },

        {
          header: 'Texto Breve',
          key: 'textoBreve',
          width: 50,
        },

        {
          header: 'Qtd. Planejada',
          key: 'qtdePlanejada',
          width: 18,
        },

        {
          header: 'Viabilizado',
          key: 'viabilizado',
          width: 15,
        },

        {
          header: 'Diferença',
          key: 'diferenca',
          width: 15,
        },

        {
          header: 'Alterado',
          key: 'alterado',
          width: 12,
        },

        {
          header: 'Tipo',
          key: 'tipo',
          width: 10,
        },

        {
          header: 'Valor Unitário',
          key: 'valorUnit',
          width: 18,
          style: {
            numFmt: '"R$" #,##0.00',
          },
        },

        {
          header: 'Valor Total',
          key: 'valorTotal',
          width: 18,
          style: {
            numFmt: '"R$" #,##0.00',
          },
        },
      ];

      const batchSize = 1000;

      for (let i = 0; i < data.length; i += batchSize) {
        const batch = data.slice(i, i + batchSize);
        worksheet.addRows(batch);
      }

      await workbook.xlsx.write(response);
    } catch (error) {
      throw error;
    }
  }
}
