import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { Injectable } from '@nestjs/common';

// Tipagem das colunas
type ColumnConfig = Partial<ExcelJS.Column> & { header: string; key: string };

interface ExportOptions {
  sheetName: string;
  columns: ColumnConfig[];
  data: any[];
}

@Injectable()
export class ExportFeasibilityService {
  // ─── Definições de colunas reutilizáveis ───
  private readonly baseColumns: ColumnConfig[] = [
    { header: 'OV/Nota', key: 'ovnota', width: 15 },
    { header: 'Ordem Diagrama', key: 'ordemDiagrama', width: 20 },
    { header: 'Operação', key: 'operacao', width: 25 },
    { header: 'Ponto', key: 'ponto', width: 15 },
    { header: 'Número Operação', key: 'numeroOperacao', width: 20 },
    { header: 'Descrição Operação', key: 'descricaoOperacao', width: 60 },
    { header: 'Material', key: 'material', width: 15 },
    { header: 'Texto Breve', key: 'textoBreve', width: 50 },
    { header: 'Qtd. Planejada', key: 'qtdePlanejada', width: 18 },
    { header: 'Tipo', key: 'tipo', width: 10 },
    {
      header: 'Valor Unitário',
      key: 'valorUnit',
      width: 18,
      style: { numFmt: '"R$" #,##0.00' },
    },
    {
      header: 'Valor Total',
      key: 'valorTotal',
      width: 18,
      style: { numFmt: '"R$" #,##0.00' },
    },
  ];

  // Colunas extras exclusivas do export completo
  private readonly approvalExtraColumns: ColumnConfig[] = [
    {
      header: 'Data Envio',
      key: 'data_envio',
      width: 15,
      style: { numFmt: 'dd/mm/yyyy' },
    },
    { header: 'Viabilizado', key: 'viabilizado', width: 15 },
    { header: 'Diferença', key: 'diferenca', width: 15 },
    { header: 'Alterado', key: 'alterado', width: 12 },
  ];

  // ─── Método genérico (privado) ───
  private async generateXlsx(
    { sheetName, columns, data }: ExportOptions,
    response: Response,
  ): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = columns;

    const batchSize = 1000;
    for (let i = 0; i < data.length; i += batchSize) {
      worksheet.addRows(data.slice(i, i + batchSize));
    }

    await workbook.xlsx.write(response);
  }

  // ─── Métodos públicos ───
  async exportFeasibilityPendingApproval(
    data: any[],
    response: Response,
  ): Promise<void> {
    // Insere as colunas extras na ordem desejada
    const columns: ColumnConfig[] = [
      this.baseColumns[0], // OV/Nota
      this.baseColumns[1], // Ordem Diagrama
      this.approvalExtraColumns[0], // Data Envio
      ...this.baseColumns.slice(2, 9), // Operação → Qtd. Planejada
      this.approvalExtraColumns[1], // Viabilizado
      this.approvalExtraColumns[2], // Diferença
      this.approvalExtraColumns[3], // Alterado
      ...this.baseColumns.slice(9), // Tipo, Valor Unit., Valor Total
    ];

    await this.generateXlsx(
      { sheetName: 'Viabilidade', columns, data },
      response,
    );
  }

  async exportFeasibilityPending(
    data: any[],
    response: Response,
  ): Promise<void> {
    const columns: ColumnConfig[] = [
      this.baseColumns[0], // OV/Nota
      this.baseColumns[1], // Ordem Diagrama
      ...this.baseColumns.slice(2, 9), // Operação → Qtd. Planejada
      this.approvalExtraColumns[1], // Viabilizado
      ...this.baseColumns.slice(9), // Tipo, Valor Unit., Valor Total
    ];

    await this.generateXlsx(
      {
        sheetName: 'Obras aguardando viabilidade',
        columns,
        data,
      },
      response,
    );
  }
}
